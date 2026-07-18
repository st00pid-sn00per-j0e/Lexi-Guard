'use server';

/**
 * @fileOverview Analyzes contract clauses to identify potential risks and suggest improvements.
 *
 * - analyzeContractClauses - A function that handles the contract clause analysis process.
 * - AnalyzeContractClausesInput - The input type for the analyzeContractClauses function.
 * - AnalyzeContractClausesOutput - The return type for the analyzeContractClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContractClausesInputSchema = z.object({
  contractText: z
    .string()
    .describe('The text content of the contract to be analyzed.'),
});
export type AnalyzeContractClausesInput = z.infer<typeof AnalyzeContractClausesInputSchema>;

const AnalyzeContractClausesOutputSchema = z.object({
  analysisResults: z.array(
    z.object({
      clause: z.string().describe('The specific clause from the contract.'),
      riskLevel: z
        .enum(['High', 'Medium', 'Low'])
        .describe('The risk level associated with the clause.'),
      suggestedImprovements: z
        .string()
        .describe('Suggestions for improving the clause to mitigate risks.'),
    })
  ).describe('An array of analysis results for each clause in the contract.'),
});
export type AnalyzeContractClausesOutput = z.infer<typeof AnalyzeContractClausesOutputSchema>;

export async function analyzeContractClauses(
  input: AnalyzeContractClausesInput
): Promise<AnalyzeContractClausesOutput> {
  return analyzeContractClausesFlow(input);
}

const analyzeContractClausesPrompt = ai.definePrompt({
  name: 'analyzeContractClausesPrompt',
  input: {schema: AnalyzeContractClausesInputSchema},
  output: {schema: AnalyzeContractClausesOutputSchema},
  prompt: `You are an AI assistant specializing in legal contract analysis.
  Your task is to analyze the clauses of a contract and identify potential risks
  and suggest improvements.

  Analyze the following contract text:
  {{contractText}}

  Provide the analysis results in the following JSON format:
  {
    "analysisResults": [
      {
        "clause": "",
        "riskLevel": "High | Medium | Low",
        "suggestedImprovements": ""
      }
    ]
  }
  `,
});

const analyzeContractClausesFlow = ai.defineFlow(
  {
    name: 'analyzeContractClausesFlow',
    inputSchema: AnalyzeContractClausesInputSchema,
    outputSchema: AnalyzeContractClausesOutputSchema,
  },
  async input => {
    const {output} = await analyzeContractClausesPrompt(input);
    return output!;
  }
);

