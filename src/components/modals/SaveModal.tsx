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
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveModal({ isOpen, onClose }: SaveModalProps) {
  const { toast } = useToast();

  const handleSave = (format: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `Saving as ${format} is not yet implemented.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Save Document</DialogTitle>
          <DialogDescription>
            Choose a format to save your scanned document.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleSave("PDF")} variant="default">
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
          <Button onClick={() => handleSave("JPG")} variant="outline">
            Save as JPG
          </Button>
          <Button onClick={() => handleSave("PNG")} variant="outline">
            Save as PNG
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
