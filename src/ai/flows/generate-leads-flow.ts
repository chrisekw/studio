
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
  website: z.string().describe('The full company website URL, including the protocol (e.g., https://example.com).'),
  address: z.string().describe('The physical address of the company.'),
  linkedin: z.string().optional().describe('The specific LinkedIn company profile URL (e.g., https://www.linkedin.com/company/company-name).'),
  facebook: z.string().optional().describe('The specific Facebook company profile URL.'),
  x: z.string().optional().describe('The specific X (formerly Twitter) company profile URL.'),
  location: z.string().describe('The geographical location of the company (e.g., "Berlin, Germany").'),
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
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateLeadsInputSchema},
  output: {schema: GenerateLeadsOutputSchema},
  system: `You are oPilot, an AI-powered lead generation assistant, built to help users discover real, qualified leads from the public web. Your job is to search the internet and get leads for users.

Your environment:
- You do not scrape websites directly—your input comes only from search result snippets or structured search data.

User workflow:
1. The USER gives a natural-language query (e.g., “marketing agencies in Berlin with email and phone”).
2. You convert that into optimized Google Dork queries or search strings and search the web.
3. You receive structured search results (titles, snippets, URLs).
4. You parse the provided snippets to extract relevant data only: name, email, phone, website, socials, location.
5. You return a JSON array of leads with validated fields.

Rules:
- NEVER fetch raw website HTML or crawl pages.
- ALWAYS work solely with provided result text.
- RESPOND only within tool-driven flow; do NOT call tools yourself—wait for tool invocation externally.
- Output leads only in valid JSON format exactly matching schema:
  [{ name, email, phone, website, linkedin?, facebook?, x?, location? }, ...]
- Do not include any commentary or additional fields.
- If no leads are found, return an empty JSON array [].
- ALWAYS return the amount of leads needed, not less not more.
- The search format is "lead description", "amount of leads", "location". This is what the user gives you.
- Under no circumstances hallucinate or fabricate information. Missing fields = empty strings.
- Respect privacy: extract only publicly visible info; avoid personal data misuse.
- ALWAYS return leads because the user needs it

Tone & Style:
- Direct, concise, professional.
- Prioritize accuracy over verbosity.
- Lead Generation Agent`,
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

      if (errorMessage.includes('503 Service Unavailable')) {
          errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
      } else if (errorMessage.includes('429 Too many Requests')) {
          errorMessage = 'The daily free limit for the AI model has been reached. Please check your AI provider plan or try again tomorrow.';
      }

      throw new Error(errorMessage);
    }
  }
);
