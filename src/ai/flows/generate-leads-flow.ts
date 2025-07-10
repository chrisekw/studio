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
  description: z.string().optional().describe('A one-line description of what the company is all about. Will be empty if not requested.'),
  email: z.string().describe('A contact email for the company. Should be an empty string if contact extraction is disabled.'),
  phone: z.string().describe('A contact phone number for the company. Should be an empty string if contact extraction is disabled.'),
  website: z.string().describe('The full company website URL, including the protocol (e.g., https://example.com).'),
  address: z.string().optional().describe('The physical address of the company.'),
  linkedin: z.string().optional().describe('The specific LinkedIn company profile URL (e.g., https://www.linkedin.com/company/company-name).'),
  facebook: z.string().optional().describe('The specific Facebook company profile URL.'),
  x: z.string().optional().describe('The specific X (formerly Twitter) company profile URL.'),
});

const GenerateLeadsInputSchema = z.object({
  query: z.string().describe('The search query for lead generation, e.g., "Marketing agencies in London".'),
  numLeads: z.number().describe('The number of leads to generate.'),
  includeAddress: z.boolean().optional().describe('Whether to include the physical address.'),
  includeLinkedIn: z.boolean().optional().describe('Whether to include the LinkedIn profile URL.'),
  includeSocials: z.boolean().optional().describe('Whether to include Facebook and X profile URLs.'),
  extractContactInfo: z.boolean().optional().describe('Whether to extract email and phone number. Defaults to true.'),
  includeDescription: z.boolean().optional().describe('Whether to include a one-line company description. Defaults to false.'),
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

  {{#if includeSocials}}
  Also include specific, realistic-looking company profile URLs for Facebook and X (formerly Twitter).
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
      const response = await prompt(input);
      const output = response.output;

      if (!output) {
        const candidate = response.candidates[0];
        let reason = "The AI model returned an empty or invalid response.";

        if (candidate?.finishReason) {
          switch (candidate.finishReason) {
            case 'SAFETY':
              reason = 'The request was blocked due to safety settings. Please adjust your query and try again.';
              break;
            case 'RECITATION':
              reason = 'The response was blocked due to a recitation policy. Please rephrase your query.';
              break;
            case 'BLOCKED':
              reason = 'The response was blocked for an unspecified reason. Please rephrase your query.';
              break;
            default:
              reason = `Generation stopped for reason: ${candidate.finishReason}.`;
              break;
          }
        }
        
        throw new Error(reason);
      }
      
      return output;

    } catch (error: any) {
      console.error('Error in generateLeadsFlow:', error);
      let errorMessage = error.message || 'An unexpected error occurred while generating leads.';

      // Specifically handle API errors from Google AI
      if (errorMessage.includes('503 Service Unavailable')) {
          errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
      } else if (errorMessage.includes('429 Too Many Requests')) {
          errorMessage = 'The daily free limit for the AI model has been reached. Please check your AI provider plan or try again tomorrow.';
      }

      // Re-throw a clear error message for the client-side to catch and display.
      throw new Error(errorMessage);
    }
  }
);
