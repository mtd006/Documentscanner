
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedImages: string[];
  currentImageIndex: number;
  totalPages: number;
}

const PAPER_SIZES = {
  auto: { width: 0, height: 0, label: "Auto (Fit to Image)" }, // Width/height 0 indicates dynamic sizing
  a4: { width: 595.28, height: 841.89, label: "A4 (210 x 297 mm)" },
  letter: { width: 612, height: 792, label: "Letter (8.5 x 11 in)" },
  legal: { width: 612, height: 1008, label: "Legal (8.5 x 14 in)" },
} as const;

type PaperSizeKey = keyof typeof PAPER_SIZES;

export function SaveModal({ isOpen, onClose, scannedImages, currentImageIndex, totalPages }: SaveModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSizeKey>('auto');

  useEffect(() => {
    if (isOpen) {
      setSelectedPaperSize('auto'); // Reset to default when modal opens
    }
  }, [isOpen]);

  const currentVisiblePageInfo = totalPages > 0 ? `Page ${currentImageIndex + 1} of ${totalPages}` : "Document";

  const captureCurrentElementAsCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const elementToCapture = document.getElementById("image-to-capture");
    if (!elementToCapture) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find the image element to save.",
      });
      return null;
    }
    try {
      const canvas = await html2canvas(elementToCapture, {
        useCORS: true,
        logging: false,
        scale: 2,
      });
      return canvas;
    } catch (error) {
      console.error("Error capturing element with html2canvas:", error);
      toast({
        variant: "destructive",
        title: "Capture Error",
        description: "Failed to capture the current image for saving.",
      });
      return null;
    }
  };

  const handleSave = async (format: "PDF" | "JPG" | "PNG") => {
    if (scannedImages.length === 0) {
      toast({ variant: "destructive", title: "No Images", description: "There are no images to save." });
      return;
    }
    setIsSaving(true);

    const timestamp = Date.now();

    try {
      if (format === "PDF") {
        if (totalPages > 1) {
          // Save all pages as PDF
          if (selectedPaperSize === 'auto') {
            const pdf = new jsPDF({ unit: 'pt' });
            if (pdf.getNumberOfPages() > 0) { // Ensure there's a page to delete
                pdf.deletePage(1); // Delete the default initial page
            }

            for (let i = 0; i < scannedImages.length; i++) {
              const imgDataUrl = scannedImages[i];
              const img = new Image();
              img.src = imgDataUrl;

              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  const imgWidth = img.naturalWidth;
                  const imgHeight = img.naturalHeight;
                  pdf.addPage([imgWidth, imgHeight], imgWidth > imgHeight ? 'l' : 'p');
                  pdf.addImage(imgDataUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
                  resolve();
                };
                img.onerror = (err) => {
                  console.error("Error loading image for PDF (auto size):", err);
                  toast({ variant: "destructive", title: "Image Load Error", description: `Could not load page ${i + 1} for PDF.` });
                  reject(err);
                }
              });
            }
            pdf.save(`scanned-document-all-${timestamp}.pdf`);
            toast({ title: "Success", description: `All ${totalPages} pages saved as PDF.` });

          } else { // Specific paper size selected
            const specificPdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: selectedPaperSize as PaperSizeKey });
            
            for (let i = 0; i < scannedImages.length; i++) {
              const imgDataUrl = scannedImages[i];
              const img = new Image();
              img.src = imgDataUrl;

              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  const imgWidth = img.naturalWidth;
                  const imgHeight = img.naturalHeight;
                  const pagePaperWidth = specificPdf.internal.pageSize.getWidth();
                  const pagePaperHeight = specificPdf.internal.pageSize.getHeight();

                  const ratio = Math.min(pagePaperWidth / imgWidth, pagePaperHeight / imgHeight);
                  const scaledWidth = imgWidth * ratio;
                  const scaledHeight = imgHeight * ratio;

                  const x = (pagePaperWidth - scaledWidth) / 2;
                  const y = (pagePaperHeight - scaledHeight) / 2;
                  
                  if (i > 0) { // Add a new page only for subsequent images
                    specificPdf.addPage();
                  }
                  specificPdf.addImage(imgDataUrl, 'JPEG', x, y, scaledWidth, scaledHeight);
                  resolve();
                };
                img.onerror = (err) => {
                  console.error("Error loading image for PDF (standard size):", err);
                  toast({ variant: "destructive", title: "Image Load Error", description: `Could not load page ${i + 1} for PDF.` });
                  reject(err);
                }
              });
            }
            specificPdf.save(`scanned-document-all-${timestamp}.pdf`);
            toast({ title: "Success", description: `All ${totalPages} pages saved as PDF (${PAPER_SIZES[selectedPaperSize].label}).` });
          }
        } else { // Save current single page as PDF (respecting filters)
          const canvas = await captureCurrentElementAsCanvas();
          if (!canvas) {
            setIsSaving(false);
            return;
          }
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          const singlePagePdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
          });
          singlePagePdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
          singlePagePdf.save(`scanned-document-page-${currentImageIndex + 1}-${timestamp}.pdf`);
          toast({ title: "Success", description: `${currentVisiblePageInfo} saved as PDF (with filters).` });
        }
      } else if (format === "JPG" || format === "PNG") { // Save current page as JPG/PNG (respecting filters)
        const canvas = await captureCurrentElementAsCanvas();
        if (!canvas) {
          setIsSaving(false);
          return;
        }
        const imageFormat = format === "JPG" ? "image/jpeg" : "image/png";
        const fileExtension = format === "JPG" ? "jpg" : "png";
        const imgData = canvas.toDataURL(imageFormat, format === "JPG" ? 0.9 : undefined);

        const link = document.createElement("a");
        link.href = imgData;
        link.download = `scanned-document-page-${currentImageIndex + 1}-${timestamp}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success", description: `${currentVisiblePageInfo} saved as ${format} (with filters).` });
      }
    } catch (error) {
      console.error(`Error saving as ${format}:`, error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: `Failed to save as ${format}. Please try again.`,
      });
    } finally {
      setIsSaving(false);
      onClose(); // Close modal after saving attempt, success or fail.
    }
  };

  const pdfButtonText = totalPages > 1 ? "Save All Pages as PDF" : "Save Current Page as PDF";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{totalPages > 1 ? "Save Document" : "Save Current Page"}</DialogTitle>
          <DialogDescription>
            {totalPages > 1
              ? `Save all ${totalPages} pages as a single PDF. You can select a paper size. For JPG/PNG, only the current page (${currentImageIndex + 1}) will be saved. Filters applied to the current view are included for JPG/PNG and single-page PDF.`
              : `Choose a format to save ${currentVisiblePageInfo}. Applied filters will be included.`
            }
          </DialogDescription>
        </DialogHeader>

        {totalPages > 1 && (
          <div className="grid gap-2 py-3">
            <Label htmlFor="paper-size-select">Paper Size for Multi-Page PDF:</Label>
            <Select
              value={selectedPaperSize}
              onValueChange={(value: string) => setSelectedPaperSize(value as PaperSizeKey)}
              disabled={isSaving}
            >
              <SelectTrigger id="paper-size-select" className="w-full">
                <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <Button onClick={() => handleSave("PDF")} variant="default" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {pdfButtonText}
          </Button>
          <Button onClick={() => handleSave("JPG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Save Current Page as JPG
          </Button>
          <Button onClick={() => handleSave("PNG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Save Current Page as PNG
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
    

    