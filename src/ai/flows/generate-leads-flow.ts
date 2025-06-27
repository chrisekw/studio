'use server';
/**
 * @fileOverview A flow for generating business leads.
 *
 * - generateLeads - A function that handles lead generation.
 * - GenerateLeadsInput - The input type for the generateLeads function.
 * - GenerateLeadsOutput - The return type for the generateLeads function.
 */
import 'dotenv/config'; // Ensure environment variables are loaded for server actions.

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { format } from 'date-fns';

const LeadSchema = z.object({
  name: z.string().describe('The name of the company.'),
  email: z.string().describe('A contact email for the company.'),
  phone: z.string().describe('A contact phone number for the company.'),
  website: z.string().describe('The full company website URL, including the protocol (e.g., https://example.com).'),
  address: z.string().optional().describe('The physical address of the company.'),
  linkedin: z.string().optional().describe('The specific LinkedIn company profile URL (e.g., https://www.linkedin.com/company/company-name).'),
});

const GenerateLeadsInputSchema = z.object({
  query: z.string().describe('The search query for lead generation, e.g., "Marketing agencies in London".'),
  numLeads: z.number().describe('The number of leads to generate.'),
  includeAddress: z.boolean().optional().describe('Whether to include the physical address.'),
  includeLinkedIn: z.boolean().optional().describe('Whether to include the LinkedIn profile URL.'),
  userId: z.string().describe('The ID of the user requesting the leads.'),
});
export type GenerateLeadsInput = z.infer<typeof GenerateLeadsInputSchema>;

const GenerateLeadsOutputSchema = z.array(LeadSchema);
export type GenerateLeadsOutput = z.infer<typeof GenerateLeadsOutputSchema>;

export async function generateLeads(input: GenerateLeadsInput): Promise<GenerateLeadsOutput> {
  return generateLeadsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeadsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: z.object({
    query: GenerateLeadsInputSchema.shape.query,
    numLeads: GenerateLeadsInputSchema.shape.numLeads,
    includeAddress: GenerateLeadsInputSchema.shape.includeAddress,
    includeLinkedIn: GenerateLeadsInputSchema.shape.includeLinkedIn,
  })},
  output: {schema: GenerateLeadsOutputSchema},
  prompt: `You are an expert business development assistant. Your task is to generate a list of business leads based on a given query.

  Generate exactly {{{numLeads}}} leads based on the following query: "{{{query}}}"

  For each lead, provide a fictional but realistic-looking company name, email address, phone number, and a full website URL including the protocol (e.g. https://example.com).
  {{#if includeAddress}}
  Also include a physical address for each company.
  {{/if}}
  {{#if includeLinkedIn}}
  Also include a specific, realistic-looking LinkedIn company profile URL for each company (e.g., https://www.linkedin.com/company/some-company). Do not just use "www.linkedin.com".
  {{/if}}
  Ensure the generated data is plausible for the given query.
  
  Return the list of leads in the specified JSON format.
  `,
});

const PLAN_LIMITS = {
  Free: { daily: 5 },
  Starter: { monthly: 200 },
  Pro: { monthly: 1000 },
  Agency: { monthly: Infinity }, // Essentially unlimited
};

const generateLeadsFlow = ai.defineFlow(
  {
    name: 'generateLeadsFlow',
    inputSchema: GenerateLeadsInputSchema,
    outputSchema: GenerateLeadsOutputSchema,
  },
  async (input) => {
    const { userId, numLeads, ...promptInput } = input;

    try {
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new Error('User profile not found. Please try again.');
      }
      const userPlan = userSnap.data()?.plan || 'Free';
      const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];

      const today = format(new Date(), 'yyyy-MM-dd');
      const currentMonth = format(new Date(), 'yyyy-MM');
      const userUsageRef = adminDb.collection('userLeadUsage').doc(userId);

      // Check usage limits within a transaction
      await adminDb.runTransaction(async (transaction) => {
        const userUsageDoc = await transaction.get(userUsageRef);
        const usageData = userUsageDoc.exists ? userUsageDoc.data() : {};

        if (limits.daily) {
          const dailyCount = usageData?.lastGeneratedDate === today ? usageData.dailyCount || 0 : 0;
          if (dailyCount + numLeads > limits.daily) {
            const remaining = limits.daily - dailyCount;
            if (remaining <= 0) throw new Error(`LIMIT_EXCEEDED: You have exceeded your daily limit of ${limits.daily} leads. Please upgrade your plan or try again tomorrow.`);
            throw new Error(`LIMIT_EXCEEDED: Your request exceeds your daily limit. You have ${remaining} leads remaining. Please request fewer leads or upgrade your plan.`);
          }
        } else if (limits.monthly) {
          const monthlyCount = usageData?.lastGeneratedMonth === currentMonth ? usageData.monthlyCount || 0 : 0;
          if (monthlyCount + numLeads > limits.monthly) {
            const remaining = limits.monthly - monthlyCount;
            if (remaining <= 0) throw new Error(`LIMIT_EXCEEDED: You have exceeded your monthly limit of ${limits.monthly} leads. Please upgrade your plan or wait until next month.`);
            throw new Error(`LIMIT_EXCEEDED: Your request exceeds your monthly limit. You have ${remaining} leads remaining. Please request fewer leads or upgrade your plan.`);
          }
        }
      });

      const promptResult = await prompt(promptInput);

      const { output } = promptResult;
      if (!output) {
        return [];
      }
      const generatedLeads = output;

      // Update usage count in a transaction
      await adminDb.runTransaction(async (transaction) => {
        const userUsageDoc = await transaction.get(userUsageRef);
        const usageData = userUsageDoc.exists ? userUsageDoc.data() : {};
        const updates: { [key: string]: any } = {};

        if (limits.daily) {
          const dailyCount = usageData?.lastGeneratedDate === today ? usageData.dailyCount || 0 : 0;
          updates.dailyCount = dailyCount + generatedLeads.length;
          updates.lastGeneratedDate = today;
        } else if (limits.monthly) {
          const monthlyCount = usageData?.lastGeneratedMonth === currentMonth ? usageData.monthlyCount || 0 : 0;
          updates.monthlyCount = monthlyCount + generatedLeads.length;
          updates.lastGeneratedMonth = currentMonth;
        }
        transaction.set(userUsageRef, updates, { merge: true });
      });

      return generatedLeads;
    } catch (error: any) {
      if (error.message?.startsWith('LIMIT_EXCEEDED:')) {
        throw error;
      }

      console.error('Error in generateLeadsFlow:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
      });

      if (error.code === 'PERMISSION_DENIED' || (error.details && error.details.includes('permission_denied'))) {
        throw new Error('Database permission error. Please check server credentials and Firestore rules.');
      }

      throw new Error('An unexpected error occurred while generating leads. Please try again later.');
    }
  }
);
