'use server';
/**
 * @fileOverview A Genkit flow for composing marketing and transactional emails.
 * 
 * - composeEmail - A function that handles email composition.
 * - ComposeEmailInput - The input type for the composeEmail function.
 * - ComposeEmailOutput - The return type for the composeEmail function.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const ComposeEmailInputSchema = z.object({
  audience: z.enum(['All Users', 'Free Users', 'Paid Subscribers']).describe('The target audience for the email.'),
  goal: z.string().describe('The primary goal or topic of the email (e.g., "Announce a new feature", "Offer a discount", "Share a tip").'),
});
export type ComposeEmailInput = z.infer<typeof ComposeEmailInputSchema>;

export const ComposeEmailOutputSchema = z.object({
  subject: z.string().describe('A compelling and relevant subject line for the email.'),
  body: z.string().describe('The full email body content, written in a friendly but professional tone. Use Markdown for formatting (e.g., headings, bold text, lists).'),
});
export type ComposeEmailOutput = z.infer<typeof ComposeEmailOutputSchema>;

export async function composeEmail(input: ComposeEmailInput): Promise<ComposeEmailOutput> {
  return composeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'composeEmailPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: ComposeEmailInputSchema },
  output: { schema: ComposeEmailOutputSchema },
  system: `You are an expert email marketer for a SaaS company called "oPilot", an AI lead generation tool. Your task is to write compelling and effective emails.

RULES:
- The tone should be friendly, professional, and slightly enthusiastic.
- The email body MUST be formatted using Markdown.
- Keep the language clear and concise.
- Focus on the user benefits and call to action.
- The output must be a valid JSON object with 'subject' and 'body' fields.`,
  prompt: `Compose an email for the following campaign:

Audience: {{{audience}}}
Goal/Topic: {{{goal}}}

Generate a subject and body for this email.`,
});

const composeEmailFlow = ai.defineFlow(
  {
    name: 'composeEmailFlow',
    inputSchema: ComposeEmailInputSchema,
    outputSchema: ComposeEmailOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI model failed to generate an email. Please try again.');
      }
      return output;
    } catch (error: any) {
      console.error('Error in composeEmailFlow:', error);
      throw new Error(error.message || 'An unexpected error occurred while composing the email.');
    }
  }
);
