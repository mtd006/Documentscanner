
"use client";

import React, { useState } from "react";
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
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedImages: string[]; // Now accepts all images
  currentImageIndex: number;
  totalPages: number;
}

export function SaveModal({ isOpen, onClose, scannedImages, currentImageIndex, totalPages }: SaveModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const currentVisiblePageInfo = totalPages > 0 ? `Page ${currentImageIndex + 1} of ${totalPages}` : "Document";
  const documentInfo = totalPages > 1 ? `${totalPages} pages` : currentVisiblePageInfo;

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
          const pdf = new jsPDF(); // Default portrait, A4. We'll add pages as needed.
          // Remove default first page if it's blank (jsPDF adds one by default)
          if (pdf.getNumberOfPages() === 1 && !pdf.internal.pages[1]?.length) {
             pdf.deletePage(1);
          }

          for (let i = 0; i < scannedImages.length; i++) {
            const imgDataUrl = scannedImages[i];
            const img = new Image();
            img.src = imgDataUrl;
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    const imgWidth = img.naturalWidth;
                    const imgHeight = img.naturalHeight;
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    // Calculate scaling to fit image within PDF page, maintaining aspect ratio
                    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                    const scaledWidth = imgWidth * ratio;
                    const scaledHeight = imgHeight * ratio;

                    // Center the image on the page
                    const x = (pdfWidth - scaledWidth) / 2;
                    const y = (pdfHeight - scaledHeight) / 2;
                    
                    if (i > 0 || pdf.getNumberOfPages() === 0) { // Add new page for subsequent images or if it's the first image and no default page exists
                        pdf.addPage();
                    } else if (pdf.getNumberOfPages() > 0 && pdf.internal.pages[pdf.getPageInfo(pdf.getCurrentPageInfo().pageNumber).pageContext.j]) { // If it's the first image but on an existing (possibly default) page
                         // Ensure we are on the correct page if jsPDF added a default one
                         pdf.setPage(pdf.getNumberOfPages());
                    }


                    pdf.addImage(imgDataUrl, 'JPEG', x, y, scaledWidth, scaledHeight);
                    resolve(true);
                };
                img.onerror = (err) => {
                    console.error("Error loading image for PDF:", err);
                    toast({ variant: "destructive", title: "Image Load Error", description: `Could not load page ${i+1} for PDF.`});
                    reject(err);
                }
            });
          }
          pdf.save(`scanned-document-all-${timestamp}.pdf`);
          toast({ title: "Success", description: `All ${totalPages} pages saved as PDF.` });

        } else { // Save current single page as PDF (respecting filters)
          const canvas = await captureCurrentElementAsCanvas();
          if (!canvas) {
            setIsSaving(false);
            return;
          }
          const imgData = canvas.toDataURL("image/jpeg", 0.9); 
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
          pdf.save(`scanned-document-page-${currentImageIndex + 1}-${timestamp}.pdf`);
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
        description: `Failed to save as ${format}.`,
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const pdfButtonText = totalPages > 1 ? "Save All Pages as PDF" : "Save Current Page as PDF";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{totalPages > 1 ? "Save Document" : "Save Current Page"}</DialogTitle>
          <DialogDescription>
            {totalPages > 1 
              ? `Save all ${totalPages} pages as a single PDF, or save the current page (${currentImageIndex + 1}) in other formats. Filters applied to the current view are included for JPG/PNG and single-page PDF.`
              : `Choose a format to save ${currentVisiblePageInfo}. Applied filters will be included.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleSave("PDF")} variant="default" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {pdfButtonText}
          </Button>
          <Button onClick={() => handleSave("JPG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Current Page as JPG
          </Button>
          <Button onClick={() => handleSave("PNG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

    