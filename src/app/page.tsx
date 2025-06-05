// @ts-nocheck
// TODO: Fix TS errors
"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ImageDisplay } from "@/components/ImageDisplay";
import { ControlsPanel } from "@/components/ControlsPanel";
import { OcrModal } from "@/components/modals/OcrModal";
import { SaveModal } from "@/components/modals/SaveModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { useToast } from "@/hooks/use-toast";
import { performOcrAssessmentAction, performOcrAction } from "./actions";
import type { AssessOcrQualityOutput } from "@/ai/flows/scan-mobile-assess-ocr";
import type { ScanMobileOCROutput } from "@/ai/flows/scan-mobile-ocr";

export default function ScanMobilePage() {
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<string>("original");
  const [isLoading, setIsLoading] = useState(false);
  const [ocrAssessmentResult, setOcrAssessmentResult] = useState<AssessOcrQualityOutput | null>(null);
  const [ocrResultText, setOcrResultText] = useState<string>("");
  
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Effect to reset OCR assessment when image changes
  useEffect(() => {
    setOcrAssessmentResult(null);
  }, [scannedImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select an image file.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScannedImage(reader.result as string);
        setAppliedFilter("original"); // Reset filter on new image
        toast({ title: "Image Loaded", description: "Your document is ready for processing." });
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected file.",
        });
      }
      reader.readAsDataURL(file);
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleEdgeDetection = () => {
    toast({ title: "Feature Info", description: "Automatic edge detection coming soon!" });
  };

  const handlePerspectiveCorrection = () => {
    toast({ title: "Feature Info", description: "Perspective correction coming soon!" });
  };

  const handleApplyFilter = (filter: string) => {
    if (filter === "enhance") {
       toast({ title: "Feature Info", description: "Color enhancement filter coming soon!" });
       setAppliedFilter("original"); // fallback to original if enhance is selected
       return;
    }
    setAppliedFilter(filter);
    toast({ title: "Filter Applied", description: `Switched to ${filter} view.` });
  };

  const handleAssessOcr = async () => {
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan a document first." });
      return;
    }
    setIsLoading(true);
    setOcrAssessmentResult(null);
    try {
      const assessment = await performOcrAssessmentAction({ photoDataUri: scannedImage });
      setOcrAssessmentResult(assessment);
      toast({ title: "OCR Assessment Complete", description: assessment.willOcrBeSuccessful ? "Document quality looks good for OCR." : "Document quality might be challenging for OCR." });
    } catch (error) {
      toast({ variant: "destructive", title: "Assessment Error", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan a document first." });
      return;
    }
    setIsLoading(true);
    try {
      const result: ScanMobileOCROutput = await performOcrAction({ photoDataUri: scannedImage });
      if (result.isConvertible && result.text) {
        setOcrResultText(result.text);
        setShowOcrModal(true);
        toast({ title: "OCR Successful", description: "Text extracted from the document." });
      } else {
        toast({ title: "OCR Information", description: result.text || "Could not extract text or document not convertible." });
        setOcrResultText(result.text || "No text extracted or document not convertible.");
        setShowOcrModal(true); // Show modal even if empty to inform user
      }
    } catch (error) {
      toast({ variant: "destructive", title: "OCR Error", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan a document first." });
      return;
    }
    setShowSaveModal(true);
  };

  const handleShare = () => {
     if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan a document first." });
      return;
    }
    setShowShareModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 sm:p-6 flex flex-col items-center gap-6">
        <ImageDisplay imageUrl={scannedImage} appliedFilter={appliedFilter} />
        <ControlsPanel
          onScanClick={handleScanClick}
          onEdgeDetection={handleEdgeDetection}
          onPerspectiveCorrection={handlePerspectiveCorrection}
          onApplyFilter={handleApplyFilter}
          onAssessOcr={handleAssessOcr}
          onRunOcr={handleRunOcr}
          onSave={handleSave}
          onShare={handleShare}
          isImageLoaded={!!scannedImage}
          isLoading={isLoading}
          ocrAssessmentResult={ocrAssessmentResult}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </main>
      <OcrModal 
        isOpen={showOcrModal} 
        onClose={() => setShowOcrModal(false)} 
        text={ocrResultText} 
      />
      <SaveModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)} 
      />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />
    </div>
  );
}
