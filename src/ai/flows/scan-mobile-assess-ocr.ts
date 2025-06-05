// Scans a document and assesses whether OCR conversion would yield good results before running OCR, saving the user time and resources.

'use server';

/**
 * @fileOverview Assesses whether OCR conversion would yield good results before running OCR.
 *
 * - assessOcrQuality - A function that assesses the quality of OCR conversion.
 * - AssessOcrQualityInput - The input type for the assessOcrQuality function.
 * - AssessOcrQualityOutput - The return type for the assessOcrQuality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessOcrQualityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AssessOcrQualityInput = z.infer<typeof AssessOcrQualityInputSchema>;

const AssessOcrQualityOutputSchema = z.object({
  willOcrBeSuccessful: z
    .boolean()
    .describe(
      'Whether or not the OCR conversion will be successful based on the document quality.'
    ),
  confidenceLevel: z
    .number()
    .describe(
      'The confidence level (0-1) that the OCR conversion will be successful.'
    ),
  reason: z
    .string()
    .describe(
      'The reason for the assessment of whether or not the OCR conversion will be successful.'
    ),
});
export type AssessOcrQualityOutput = z.infer<typeof AssessOcrQualityOutputSchema>;

export async function assessOcrQuality(input: AssessOcrQualityInput): Promise<AssessOcrQualityOutput> {
  return assessOcrQualityFlow(input);
}

const assessOcrQualityPrompt = ai.definePrompt({
  name: 'assessOcrQualityPrompt',
  input: {schema: AssessOcrQualityInputSchema},
  output: {schema: AssessOcrQualityOutputSchema},
  prompt: `You are an expert OCR quality assessor.

You will use this information to determine whether or not the OCR conversion will be successful.

Based on the quality of the document, you will make a determination as to whether the OCR conversion will be successful or not, and set the willOcrBeSuccessful output field appropriately.

You will also provide a confidence level (0-1) that the OCR conversion will be successful.

You will also provide a reason for the assessment of whether or not the OCR conversion will be successful.

Use the following as the primary source of information about the document.

Photo: {{media url=photoDataUri}}`,
});

const assessOcrQualityFlow = ai.defineFlow(
  {
    name: 'assessOcrQualityFlow',
    inputSchema: AssessOcrQualityInputSchema,
    outputSchema: AssessOcrQualityOutputSchema,
  },
  async input => {
    const {output} = await assessOcrQualityPrompt(input);
    return output!;
  }
);
