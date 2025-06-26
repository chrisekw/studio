'use server';
/**
 * @fileOverview A flow for generating business leads.
 *
 * - generateLeads - A function that handles lead generation.
 * - GenerateLeadsInput - The input type for the generateLeads function.
 * - GenerateLeadsOutput - The return type for the generateLeads function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
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

const FREE_PLAN_DAILY_LIMIT = 5;

const generateLeadsFlow = ai.defineFlow(
  {
    name: 'generateLeadsFlow',
    inputSchema: GenerateLeadsInputSchema,
    outputSchema: GenerateLeadsOutputSchema,
  },
  async (input) => {
    const { userId, numLeads, ...promptInput } = input;
    const today = format(new Date(), 'yyyy-MM-dd');
    const userUsageRef = doc(db, 'userLeadUsage', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const userUsageDoc = await transaction.get(userUsageRef);
        
        let currentCount = 0;
        if (userUsageDoc.exists()) {
          const data = userUsageDoc.data();
          if (data.lastGeneratedDate === today) {
            currentCount = data.dailyCount;
          }
        }

        if (currentCount + numLeads > FREE_PLAN_DAILY_LIMIT) {
          const remaining = FREE_PLAN_DAILY_LIMIT - currentCount;
          if (remaining <= 0) {
            throw new Error(`You have exceeded your daily limit of 5 leads. Please upgrade to a paid plan or try again tomorrow.`);
          }
          throw new Error(`You have ${remaining} leads remaining today. Please request a smaller number of leads or upgrade to a paid plan.`);
        }
      });
    } catch (error: any) {
      if (error.message.includes('leads remaining') || error.message.includes('exceeded your daily limit')) {
        throw error;
      }
      console.error('Firebase transaction error:', error);
      throw new Error('Failed to verify lead usage. Please try again.');
    }

    const { output } = await prompt(promptInput);
    
    if (!output) {
      return [];
    }

    const generatedLeads = output;

    await runTransaction(db, async (transaction) => {
      const userUsageDoc = await transaction.get(userUsageRef);
      let currentCount = 0;
      if (userUsageDoc.exists() && userUsageDoc.data().lastGeneratedDate === today) {
        currentCount = userUsageDoc.data().dailyCount;
      }

      transaction.set(userUsageRef, {
        dailyCount: currentCount + generatedLeads.length,
        lastGeneratedDate: today
      }, { merge: true });
    });

    return generatedLeads;
  }
);
