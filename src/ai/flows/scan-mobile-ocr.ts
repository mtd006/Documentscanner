'use server';

/**
 * @fileOverview Optical Character Recognition (OCR) flow for ScanMobile.
 *
 * - scanMobileOCR - A function that converts scanned documents into editable text using AI.
 * - ScanMobileOCRInput - The input type for the scanMobileOCR function.
 * - ScanMobileOCROutput - The return type for the scanMobileOCR function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanMobileOCRInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanMobileOCRInput = z.infer<typeof ScanMobileOCRInputSchema>;

const ScanMobileOCROutputSchema = z.object({
  isConvertible: z.boolean().describe('Whether or not the image is convertible to text.'),
  text: z.string().describe('The extracted text from the document, if convertible.'),
});
export type ScanMobileOCROutput = z.infer<typeof ScanMobileOCROutputSchema>;

export async function scanMobileOCR(input: ScanMobileOCRInput): Promise<ScanMobileOCROutput> {
  return scanMobileOCRFlow(input);
}

const ocrCheckTool = ai.defineTool(
  {
    name: 'isTextExtractable',
    description: 'Check if text can be extracted from the image.',
    inputSchema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
    outputSchema: z.boolean(),
  },
  async input => {
    // TODO: Implement actual check to see if the image is easily convertible to text.
    // For now, we will just return true.
    return true;
  }
);

const prompt = ai.definePrompt({
  name: 'scanMobileOCRPrompt',
  input: {schema: ScanMobileOCRInputSchema},
  output: {schema: ScanMobileOCROutputSchema},
  tools: [ocrCheckTool],
  prompt: `You are an OCR service that extracts text from images of documents.

  Determine whether or not the document is easily convertible to text using the isTextExtractable tool.

  If it is, extract the text and return it. If it is not, return an empty string for the text field, and set isConvertible to false.

  Here is the document:

  {{media url=photoDataUri}}
  `,
});

const scanMobileOCRFlow = ai.defineFlow(
  {
    name: 'scanMobileOCRFlow',
    inputSchema: ScanMobileOCRInputSchema,
    outputSchema: ScanMobileOCROutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
