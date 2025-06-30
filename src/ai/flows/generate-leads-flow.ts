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
import { scoreLead } from './score-lead-flow';

const LeadSchema = z.object({
  name: z.string().describe('The name of the company.'),
  description: z.string().optional().describe('A one-line description of what the company is all about. Will be empty if not requested.'),
  email: z.string().describe('A contact email for the company. Should be an empty string if contact extraction is disabled.'),
  phone: z.string().describe('A contact phone number for the company. Should be an empty string if contact extraction is disabled.'),
  website: z.string().describe('The full company website URL, including the protocol (e.g., https://example.com).'),
  address: z.string().optional().describe('The physical address of the company.'),
  linkedin: z.string().optional().describe('The specific LinkedIn company profile URL (e.g., https://www.linkedin.com/company/company-name).'),
  score: z.number().optional().describe('A lead quality score from 1-100.'),
  scoreRationale: z.string().optional().describe('The rationale behind the lead score.'),
});

const GenerateLeadsInputSchema = z.object({
  query: z.string().describe('The search query for lead generation, e.g., "Marketing agencies in London".'),
  numLeads: z.number().describe('The number of leads to generate.'),
  includeAddress: z.boolean().optional().describe('Whether to include the physical address.'),
  includeLinkedIn: z.boolean().optional().describe('Whether to include the LinkedIn profile URL.'),
  extractContactInfo: z.boolean().optional().describe('Whether to extract email and phone number. Defaults to true.'),
  includeDescription: z.boolean().optional().describe('Whether to include a one-line company description. Defaults to false.'),
  scoreLeads: z.boolean().optional().describe('Whether to perform AI-based scoring on the leads. Defaults to false.'),
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
  input: {schema: GenerateLeadsInputSchema},
  output: {schema: GenerateLeadsOutputSchema},
  prompt: `You are an expert business development assistant. Your task is to generate a list of business leads based on a given query.

  Generate exactly {{{numLeads}}} leads based on the following query: "{{{query}}}"

  For each lead, provide a fictional but realistic-looking company name, and a full website URL including the protocol (e.g. https://example.com).
  {{#if extractContactInfo}}
  Also provide an email address and phone number.
  {{else}}
  For the email and phone fields, return an empty string.
  {{/if}}
  
  {{#if includeAddress}}
  Also include a physical address for each company.
  {{/if}}
  {{#if includeLinkedIn}}
  Also include a specific, realistic-looking LinkedIn company profile URL for each company (e.g., https://www.linkedin.com/company/some-company). Do not just use "www.linkedin.com".
  {{/if}}
  {{#if includeDescription}}
  Also include a concise, one-line description of what the company is all about.
  {{/if}}
  Ensure the generated data is plausible for the given query.
  
  Return the list of leads in the specified JSON format.
  `,
});

const generateLeadsFlow = ai.defineFlow(
  {
    name: 'generateLeadsFlow',
    inputSchema: GenerateLeadsInputSchema,
    outputSchema: GenerateLeadsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      let leads = output || [];

      if (input.scoreLeads && leads.length > 0) {
        // If scoring is requested, run the scoring flow for each lead in parallel.
        const scoringPromises = leads.map(lead => 
          scoreLead({ 
            name: lead.name, 
            description: lead.description, 
            website: lead.website 
          }).then(scoreOutput => ({
            ...lead,
            score: scoreOutput.score,
            scoreRationale: scoreOutput.rationale,
          }))
        );
        leads = await Promise.all(scoringPromises);
      }

      return leads;
    } catch (error: any) {
      console.error('Error in generateLeadsFlow:', error);
      // Re-throw the original error for better client-side debugging.
      throw new Error(error.message || 'An unexpected error occurred while generating leads.');
    }
  }
);
