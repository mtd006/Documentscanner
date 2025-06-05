"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export function OcrModal({ isOpen, onClose, text }: OcrModalProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({ title: "Success", description: "Text copied to clipboard." });
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to copy text." });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Extracted Text (OCR)</DialogTitle>
          <DialogDescription>
            Review and copy the text extracted from your document.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={text}
            readOnly
            className="min-h-[200px] max-h-[400px] resize-y bg-muted/50"
            aria-label="Extracted text"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopyToClipboard}>
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
