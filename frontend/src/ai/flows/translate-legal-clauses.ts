'use server';

/**
 * @fileOverview A legal clause translation AI agent.
 *
 * - translateLegalClauses - A function that translates legal clauses from one language to another.
 * - TranslateLegalClausesInput - The input type for the translateLegalClauses function.
 * - TranslateLegalClausesOutput - The return type for the translateLegalClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateLegalClausesInputSchema = z.object({
  clause: z.string().describe('The legal clause to translate.'),
  sourceLanguage: z.string().describe('The language of the legal clause.'),
  targetLanguage: z.string().describe('The language to translate the legal clause into.'),
});
export type TranslateLegalClausesInput = z.infer<typeof TranslateLegalClausesInputSchema>;

const TranslateLegalClausesOutputSchema = z.object({
  translatedClause: z.string().describe('The translated legal clause.'),
});
export type TranslateLegalClausesOutput = z.infer<typeof TranslateLegalClausesOutputSchema>;

export async function translateLegalClauses(input: TranslateLegalClausesInput): Promise<TranslateLegalClausesOutput> {
  return translateLegalClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateLegalClausesPrompt',
  input: {schema: TranslateLegalClausesInputSchema},
  output: {schema: TranslateLegalClausesOutputSchema},
  prompt: `Translate the following legal clause from {{sourceLanguage}} to {{targetLanguage}}:\n\n{{clause}}`,
});

const translateLegalClausesFlow = ai.defineFlow(
  {
    name: 'translateLegalClausesFlow',
    inputSchema: TranslateLegalClausesInputSchema,
    outputSchema: TranslateLegalClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
