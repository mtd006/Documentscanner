// @ts-nocheck
// TODO: Fix TS errors
"use server";

import { assessOcrQuality, AssessOcrQualityInput, AssessOcrQualityOutput } from "@/ai/flows/scan-mobile-assess-ocr";
import { scanMobileOCR, ScanMobileOCRInput, ScanMobileOCROutput } from "@/ai/flows/scan-mobile-ocr";

export async function performOcrAssessmentAction(input: AssessOcrQualityInput): Promise<AssessOcrQualityOutput> {
  try {
    const result = await assessOcrQuality(input);
    return result;
  } catch (error) {
    console.error("Error in performOcrAssessmentAction:", error);
    throw new Error("Failed to assess OCR quality.");
  }
}

export async function performOcrAction(input: ScanMobileOCRInput): Promise<ScanMobileOCROutput> {
  try {
    const result = await scanMobileOCR(input);
    return result;
  } catch (error) {
    console.error("Error in performOcrAction:", error);
    throw new Error("Failed to perform OCR.");
  }
}
