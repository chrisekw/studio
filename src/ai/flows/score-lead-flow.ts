'use server';
/**
 * @fileOverview This flow is currently unused. It was previously used for scoring leads.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ScoreLeadInputSchema = z.object({
  name: z.string().describe('The name of the company.'),
  description: z.string().optional().describe('A one-line description of what the company is all about.'),
  website: z.string().describe('The full company website URL.'),
});
export type ScoreLeadInput = z.infer<typeof ScoreLeadInputSchema>;

const ScoreLeadOutputSchema = z.object({
    score: z.number().describe('A score from 1-100 indicating the quality of the lead. A higher score means a better lead.'),
    rationale: z.string().describe('A brief, one-sentence rationale for the given score.'),
});
export type ScoreLeadOutput = z.infer<typeof ScoreLeadOutputSchema>;

export async function scoreLead(input: ScoreLeadInput): Promise<ScoreLeadOutput> {
  return scoreLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreLeadPrompt',
  model: 'gemini-1.5-flash',
  input: { schema: ScoreLeadInputSchema },
  output: { schema: ScoreLeadOutputSchema },
  config: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  prompt: `You are an expert B2B sales development representative. Your task is to score a business lead based on its potential value for outreach.

  Analyze the following lead details:
  - Company Name: {{{name}}}
  - Website: {{{website}}}
  {{#if description}}
  - Description: {{{description}}}
  {{/if}}

  Based on this information, provide a score from 1 to 100, where 100 is the highest quality lead. Also provide a brief, one-sentence rationale explaining your score. For example, consider factors like the company's industry, apparent size, and the professionalism of their online presence.

  Return the score and rationale in the specified JSON format.
  `,
});

const scoreLeadFlow = ai.defineFlow(
  {
    name: 'scoreLeadFlow',
    inputSchema: ScoreLeadInputSchema,
    outputSchema: ScoreLeadOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output || { score: 0, rationale: 'Could not generate score.' };
    } catch (error: any) {
      console.error('Error in scoreLeadFlow:', error);
      // Return a default error state instead of throwing
      return { score: 0, rationale: 'Error during scoring.' };
    }
  }
);
