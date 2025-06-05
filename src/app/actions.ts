
"use server";

import { assessOcrQuality, AssessOcrQualityInput, AssessOcrQualityOutput } from "@/ai/flows/scan-mobile-assess-ocr";
import { scanMobileOCR, ScanMobileOCRInput, ScanMobileOCROutput } from "@/ai/flows/scan-mobile-ocr";

export async function performOcrAssessmentAction(input: AssessOcrQualityInput): Promise<AssessOcrQualityOutput> {
  try {
    const result = await assessOcrQuality(input);
    return result;
  } catch (error: unknown) {
    console.error("Error in performOcrAssessmentAction:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to assess OCR quality: ${error.message}`);
    }
    throw new Error("Failed to assess OCR quality due to an unknown error.");
  }
}

export async function performOcrAction(input: ScanMobileOCRInput): Promise<ScanMobileOCROutput> {
  try {
    const result = await scanMobileOCR(input);
    return result;
  } catch (error: unknown) {
    console.error("Error in performOcrAction:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to perform OCR: ${error.message}`);
    }
    throw new Error("Failed to perform OCR due to an unknown error.");
  }
}
