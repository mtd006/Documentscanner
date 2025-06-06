
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
  currentImageIndex: number;
  totalPages: number;
}

export function SaveModal({ isOpen, onClose, currentImageIndex, totalPages }: SaveModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const pageInfo = totalPages > 0 ? `Page ${currentImageIndex + 1} of ${totalPages}` : "Document";

  const captureElementAsCanvas = async (): Promise<HTMLCanvasElement | null> => {
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
        description: "Failed to capture the image for saving.",
      });
      return null;
    }
  };

  const handleSave = async (format: "PDF" | "JPG" | "PNG") => {
    setIsSaving(true);
    const canvas = await captureElementAsCanvas();
    if (!canvas) {
      setIsSaving(false);
      return;
    }

    const pageSuffix = totalPages > 1 ? `-page-${currentImageIndex + 1}` : "";
    const filename = `scanned-document${pageSuffix}-${Date.now()}`;

    try {
      if (format === "PDF") {
        const imgData = canvas.toDataURL("image/jpeg", 0.9); 
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}.pdf`);
        toast({ title: "Success", description: `${pageInfo} saved as PDF.` });
      } else if (format === "JPG") {
        const imgData = canvas.toDataURL("image/jpeg", 0.9); 
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success", description: `${pageInfo} saved as JPG.` });
      } else if (format === "PNG") {
        const imgData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Success", description: `${pageInfo} saved as PNG.` });
      }
    } catch (error) {
      console.error(`Error saving as ${format}:`, error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: `Failed to save ${pageInfo} as ${format}.`,
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Save Current Page</DialogTitle>
          <DialogDescription>
            Choose a format to save {pageInfo}. Applied filters will be included.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleSave("PDF")} variant="default" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Save as PDF
          </Button>
          <Button onClick={() => handleSave("JPG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save as JPG
          </Button>
          <Button onClick={() => handleSave("PNG")} variant="outline" disabled={isSaving || totalPages === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save as PNG
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

    