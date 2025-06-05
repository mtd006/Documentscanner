
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Crop,
  Maximize,
  Wand2,
  Sparkles,
  FileText,
  Save,
  Share2,
  Loader2,
  Eye,
  Upload,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssessOcrQualityOutput } from "@/ai/flows/scan-mobile-assess-ocr";

interface ControlsPanelProps {
  onOpenCameraClick: () => void;
  onUploadFileClick: () => void;
  onEdgeDetection: () => void;
  onPerspectiveCorrection: () => void;
  onApplyFilter: (filter: string) => void;
  onAssessOcr: () => void;
  onRunOcr: () => void;
  onSave: () => void;
  onShare: () => void;
  isImageLoaded: boolean;
  isLoading: boolean;
  ocrAssessmentResult: AssessOcrQualityOutput | null;
  ocrResultTextForDisabledCheck: string; // Added for checking OCR run state
}

export function ControlsPanel({
  onOpenCameraClick,
  onUploadFileClick,
  onEdgeDetection,
  onPerspectiveCorrection,
  onApplyFilter,
  onAssessOcr,
  onRunOcr,
  onSave,
  onShare,
  isImageLoaded,
  isLoading,
  ocrAssessmentResult,
  ocrResultTextForDisabledCheck, // Destructure new prop
}: ControlsPanelProps) {
  // Determine if OCR is currently running (for loader display on OCR button)
  const isOcrRunning = isLoading && ocrResultTextForDisabledCheck === "" && ocrAssessmentResult === null; // More specific: loading, no text yet, and no prior assessment blocking it
  const isAssessmentRunning = isLoading && ocrAssessmentResult === null;


  // Disable OCR run button if assessment failed and no text has been extracted yet from a previous attempt
  // Or if currently loading, or no image
  const disableRunOcrButton = 
    !isImageLoaded || 
    isLoading || 
    (ocrAssessmentResult !== null && !ocrAssessmentResult.willOcrBeSuccessful && ocrResultTextForDisabledCheck === "");


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-center">Scan & Edit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button onClick={onOpenCameraClick} variant="default" size="lg" disabled={isLoading}>
            <Camera className="mr-2 h-5 w-5" /> Scan with Camera
          </Button>
          <Button onClick={onUploadFileClick} variant="outline" size="lg" disabled={isLoading}>
            <Upload className="mr-2 h-5 w-5" /> Upload Image File
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Adjustments</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onEdgeDetection}
              variant="outline"
              disabled={!isImageLoaded || isLoading}
            >
              <Crop className="mr-2 h-4 w-4" /> Edge Detect
            </Button>
            <Button
              onClick={onPerspectiveCorrection}
              variant="outline"
              disabled={!isImageLoaded || isLoading}
            >
              <Maximize className="mr-2 h-4 w-4" /> Perspective
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Image Enhancement</h3>
          <Select
            onValueChange={(value) => onApplyFilter(value)}
            disabled={!isImageLoaded || isLoading}
            defaultValue="original"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="grayscale">Grayscale</SelectItem>
              <SelectItem value="bw">Black & White</SelectItem>
              <SelectItem value="enhance">Color Enhance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Optical Character Recognition (OCR)</h3>
          <Button
            onClick={onAssessOcr}
            variant="outline"
            className="w-full"
            disabled={!isImageLoaded || isLoading}
          >
            {isAssessmentRunning ? ( 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Assess OCR Quality
          </Button>
          {ocrAssessmentResult && (
            <div className="text-xs p-2 bg-muted rounded-md border">
              <p>Assessment: {ocrAssessmentResult.willOcrBeSuccessful ? "Good for OCR" : "May not be good for OCR"}</p>
              <p>Confidence: {(ocrAssessmentResult.confidenceLevel * 100).toFixed(0)}%</p>
              <p>Reason: {ocrAssessmentResult.reason}</p>
            </div>
          )}
          <Button
            onClick={onRunOcr}
            variant="default"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={disableRunOcrButton}
          >
            {isOcrRunning ? ( 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Extract Text (OCR)
          </Button>
        </div>

        <Separator />
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onSave}
            variant="outline"
            disabled={!isImageLoaded || isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            disabled={!isImageLoaded || isLoading}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
