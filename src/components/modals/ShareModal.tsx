
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
import { Send, Link as LinkIcon, Loader2 } from "lucide-react"; // Changed Link to LinkIcon to avoid conflict
import React, { useState } from "react";

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

  const pageDescription = totalPages > 0 ? `Page ${currentImageIndex + 1} of ${totalPages}` : "the document";

  const handleCopyLink = async () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please select an image to share." });
      return;
    }
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(currentImageUrl);
      toast({ title: "Link Copied", description: `A shareable link (data URI) for ${pageDescription} has been copied to your clipboard.` });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link to your clipboard." });
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
    const subject = encodeURIComponent(`Scanned Document - ${pageDescription}`);
    const body = encodeURIComponent(
      `Hello,\n\nI'm sharing ${pageDescription} with you.\n\nIf you received a link, you can paste it into your browser to view the image. Alternatively, save the image first and then attach it.\n\n(Note: For large images, direct embedding in email or very long links might not work well with all email clients. Consider saving and attaching if the link is a long data URI.)`
    );
    
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    try {
       window.location.href = mailtoLink;
       // It's hard to know if the mail client actually opened, so we assume success here.
       // A small delay before closing might be good if the user immediately clicks away.
       setTimeout(() => {
         toast({ title: "Email Client Opened", description: "Your email client should now be open with a pre-filled message." });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Share Current Page</DialogTitle>
          <DialogDescription>
            Share {pageDescription} with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={handleShareViaEmail} variant="default" disabled={!currentImageUrl || isSharing}>
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
            Share via Email
          </Button>
          <Button onClick={handleCopyLink} variant="outline" disabled={!currentImageUrl || isSharing}>
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            Copy Link (Data URI)
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
