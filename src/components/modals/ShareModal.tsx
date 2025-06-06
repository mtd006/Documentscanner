
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
import { Send, Link as LinkIcon, Info, Loader2 } from "lucide-react"; 
import React, { useState } from "react";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert"; 

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string | null;
  currentImageIndex: number;
  totalPages: number;
}

export function ShareModal({ 
  isOpen, 
  onClose, 
  currentImageUrl, 
  currentImageIndex, 
  totalPages 
}: ShareModalProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const currentPageDescription = totalPages > 0 ? `current page (Page ${currentImageIndex + 1} of ${totalPages})` : "the current document";

  const handleCopyLink = async () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please select an image to share." });
      return;
    }
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(currentImageUrl);
      toast({ 
        title: "Data URI Copied", 
        description: `A data URI for ${currentPageDescription} has been copied. This is suitable for direct browser viewing or developer use, but may be too long for typical sharing.` 
      });
    } catch (error) {
      console.error("Failed to copy data URI:", error);
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the data URI to your clipboard." });
    } finally {
      setIsSharing(false);
      onClose();
    }
  };

  const handleShareViaEmail = () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please select an image to share." });
      return;
    }
    setIsSharing(true);
    const subject = encodeURIComponent(`Scanned Document - ${currentPageDescription}`);
    const body = encodeURIComponent(
      `Hello,\n\nI'm sharing ${currentPageDescription} with you.\n\nIf you were provided a data URI, you can paste it into your browser's address bar to view the image. For sharing the full document, consider saving it as a PDF first and attaching the file.\n\n(Note: Data URIs can be very long and might not work well if pasted directly into all email clients or messages.)`
    );
    
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    try {
       window.location.href = mailtoLink;
       setTimeout(() => {
         toast({ title: "Email Client Opened", description: "Your email client should now be open. Consider attaching a saved PDF for multi-page documents." });
         setIsSharing(false);
         onClose();
       }, 500);

    } catch (error) {
        console.error("Failed to open email client:", error);
        toast({ variant: "destructive", title: "Email Error", description: "Could not open your email client." });
        setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSharing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Share Document</DialogTitle>
          <DialogDescription>
            Share options for the {currentPageDescription}. For sharing all pages, it's best to save as a PDF first.
            The "Copy Link" option copies a data URI which is suitable for direct browser viewing but can be very long.
          </DialogDescription>
        </DialogHeader>
        
        {totalPages > 1 && (
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Sharing Multiple Pages</AlertTitle>
            <AlertDesc>
              To share all {totalPages} pages together, it's recommended to first use the "Save" option to create a single PDF document. Then, you can share that PDF file.
            </AlertDesc>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <Button onClick={handleShareViaEmail} variant="default" disabled={!currentImageUrl || isSharing}>
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
            Email Info for Current Page
          </Button>
          <Button onClick={handleCopyLink} variant="outline" disabled={!currentImageUrl || isSharing}>
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            Copy Data URI for Current Page
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSharing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
