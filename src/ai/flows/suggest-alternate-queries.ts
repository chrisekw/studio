// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting alternate but semantically identical queries.
 *
 * The flow takes a query string as input and returns an array of suggested alternative queries.
 * This is useful for broadening lead generation efforts by exploring different search terms.
 *
 * @param {string} query - The input query string.
 * @returns {string[]} - An array of suggested alternative queries.
 */
import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

const SuggestAlternateQueriesInputSchema = z.object({
  query: z.string().describe('The original search query.'),
});
export type SuggestAlternateQueriesInput = z.infer<typeof SuggestAlternateQueriesInputSchema>;

const SuggestAlternateQueriesOutputSchema = z.array(z.string()).describe('An array of 5 suggested alternative queries.');
export type SuggestAlternateQueriesOutput = z.infer<typeof SuggestAlternateQueriesOutputSchema>;

export async function suggestAlternateQueries(input: SuggestAlternateQueriesInput): Promise<SuggestAlternateQueriesOutput> {
  return suggestAlternateQueriesFlow(input);
}

const suggestAlternateQueriesPrompt = ai.definePrompt({
  name: 'suggestAlternateQueriesPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: SuggestAlternateQueriesInputSchema},
  output: {schema: SuggestAlternateQueriesOutputSchema},
  config: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  prompt: `You are an expert in generating alternative search queries.

  Given the following search query, suggest a list of exactly 5 alternative queries that are semantically identical but use different keywords or phrasing. The goal is to broaden the search and explore different avenues for lead generation.

  Original Query: {{{query}}}

  Return the 5 alternative queries in the specified format.`,
});

const suggestAlternateQueriesFlow = ai.defineFlow(
  {
    name: 'suggestAlternateQueriesFlow',
    inputSchema: SuggestAlternateQueriesInputSchema,
    outputSchema: SuggestAlternateQueriesOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await suggestAlternateQueriesPrompt(input);
      // Return the first 5 suggestions, in case the model returns more than requested.
      return (output || []).slice(0, 5);
    } catch (error: any) {
      console.error('Error in suggestAlternateQueriesFlow:', error);
      throw new Error(error.message || 'Could not fetch AI suggestions.');
    }
  }
);
