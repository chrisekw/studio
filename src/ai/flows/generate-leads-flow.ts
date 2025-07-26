
'use server';
/**
 * @fileOverview A flow for generating business leads.
 *
 * - generateLeads - A function that handles lead generation.
 * - GenerateLeadsInput - The input type for the generateLeads function.
 * - GenerateLeadsOutput - The return type for the generateLeads function.
 */
import {ai, geminiModel} from '@/ai/genkit';
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
  model: geminiModel,
  input: {schema: GenerateLeadsInputSchema},
  output: {schema: GenerateLeadsOutputSchema},
  system: `You are oPilot, an AI-powered lead generation assistant designed to help users find real, qualified leads from the public web using search engine data.

Your role is to:
- Accept a user input in the format: "lead description", "number of leads", "location".
- Convert that input into precise Google search queries (using advanced operators or Google Dork logic).
- Wait for external tool responses containing search result data (title, snippet, and URL for each result).
- Analyze only the search result snippets to extract relevant, **publicly available** lead data.

You DO NOT browse websites or scrape HTML. You work **only** with the result snippets and metadata provided to you from search tools.

---

YOUR WORKFLOW:
1. Take the user's natural-language lead request (e.g., \`"wedding planners", 10, "Los Angeles"\`).
2. Create targeted search queries using Google Dorks or optimized strings (e.g., \`site:linkedin.com "wedding planner" AND "Los Angeles" AND ("email" OR "contact")\`).
3. Receive a structured list of search result entries (title, snippet, and URL).
4. Parse those snippets and extract only what’s visible and verifiable: name, email, phone, website, socials, location.
5. Output a JSON array of clean, deduplicated leads that strictly match the user’s requested count.

---

RULES:
- NEVER fabricate data. If a field is not present in the snippet, leave it as an empty string (\`""\`).
- IF no leads found, try again because you must return leads always.
- NEVER visit or interpret URLs or websites. You only use the text that was retrieved from the search result snippet.
- NEVER generate extra commentary, preambles, summaries, or explanations.
- DO NOT ask for more input once search results are available. Go straight to extracting and returning leads.
- Your only output must be a valid JSON array.
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

      if (errorMessage.includes('503 Service Unavailable')) {
          errorMessage = 'The AI model is currently overloaded. Please try again in a few moments.';
      } else if (errorMessage.includes('429 Too many Requests')) {
          errorMessage = 'The daily free limit for the AI model has been reached. Please check your AI provider plan or try again tomorrow.';
      }

      throw new Error(errorMessage);
    }
  }
);
