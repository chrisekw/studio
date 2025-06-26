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

const LeadSchema = z.object({
  name: z.string().describe('The name of the company.'),
  email: z.string().describe('A contact email for the company.'),
  phone: z.string().describe('A contact phone number for the company.'),
  website: z.string().describe('The company website URL.'),
});

const GenerateLeadsInputSchema = z.object({
  query: z.string().describe('The search query for lead generation, e.g., "Marketing agencies in London".'),
  numLeads: z.number().describe('The number of leads to generate.'),
});
export type GenerateLeadsInput = z.infer<typeof GenerateLeadsInputSchema>;

const GenerateLeadsOutputSchema = z.array(LeadSchema);
export type GenerateLeadsOutput = z.infer<typeof GenerateLeadsOutputSchema>;

export async function generateLeads(input: GenerateLeadsInput): Promise<GenerateLeadsOutput> {
  return generateLeadsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeadsPrompt',
  input: {schema: GenerateLeadsInputSchema},
  output: {schema: GenerateLeadsOutputSchema},
  prompt: `You are an expert business development assistant. Your task is to generate a list of business leads based on a given query.

  Generate exactly {{{numLeads}}} leads based on the following query: "{{{query}}}"

  For each lead, provide a fictional but realistic-looking company name, email address, phone number, and website URL. Ensure the generated data is plausible for the given query.
  
  Return the list of leads in the specified JSON format.
  `,
});

const generateLeadsFlow = ai.defineFlow(
  {
    name: 'generateLeadsFlow',
    inputSchema: GenerateLeadsInputSchema,
    outputSchema: GenerateLeadsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
