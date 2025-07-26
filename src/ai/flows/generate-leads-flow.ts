
'use server';
/**
 * @fileOverview A flow for generating business leads.
 *
 * - generateLeads - A function that handles lead generation.
 * - GenerateLeadsInput - The input type for the generateLeads function.
 * - GenerateLeadsOutput - The return type for the generateLeads function.
 */
import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'zod';

const LeadSchema = z.object({
  name: z.string().describe('The name of the company.'),
  email: z.string().describe('A contact email for the company.'),
  phone: z.string().describe('A contact phone number for the company.'),
  website: z.string().describe('The full company website URL, including the protocol (e.g., https://example.com).'),
  linkedin: z.string().optional().describe('The specific LinkedIn company profile URL (e.g., https://www.linkedin.com/company/company-name).'),
  location: z.string().optional().describe('The geographical location of the company (e.g., "Berlin, Germany").'),
});

const GenerateLeadsInputSchema = z.object({
  query: z.string().describe('A natural language query from the user (e.g., "marketing agencies in Berlin").'),
});
export type GenerateLeadsInput = z.infer<typeof GenerateLeadsInputSchema>;

const GenerateLeadsOutputSchema = z.array(LeadSchema);
export type GenerateLeadsOutput = z.infer<typeof GenerateLeadsOutputSchema>;

export async function generateLeads(input: GenerateLeadsInput): Promise<GenerateLeadsOutput> {
  return generateLeadsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeadsPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: GenerateLeadsInputSchema},
  output: {schema: GenerateLeadsOutputSchema},
  config: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  system: `You are oPilot, an AI-powered lead generation assistant. Your primary function is to find real, qualified business leads from the public web based on a user's query.

You must act as an expert researcher with access to a vast index of the internet.

RULES:
- You MUST find real companies and publicly available contact information.
- NEVER fabricate data. If a piece of information (like an email or phone number) is not realistically findable on the public web for a given company, leave the field blank.
- You do not have access to private data or paid databases. All information must be sourced from what would be considered public knowledge on the web.
- Your only output must be a valid JSON array of leads. Do not include any commentary, summaries, or explanations.
`,
  prompt: `User Query: "{{{query}}}"`,
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

      if (errorMessage.includes('503 Service Unavailable') || (error.cause && (error.cause as any).status === 503)) {
          errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
      } else if (errorMessage.includes('429 Too many Requests')) {
          errorMessage = 'The daily free limit for the AI model has been reached. Please check your AI provider plan or try again tomorrow.';
      }

      throw new Error(errorMessage);
    }
  }
);
