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
import { Send, Link } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { toast } = useToast();

  const handleShare = (method: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `Sharing via ${method} is not yet implemented.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Share Document</DialogTitle>
          <DialogDescription>
            Share your scanned document with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleShare("Email")} variant="default">
            <Send className="mr-2 h-4 w-4" /> Share via Email
          </Button>
          <Button onClick={() => handleShare("Link")} variant="outline">
            <Link className="mr-2 h-4 w-4" /> Copy Link
          </Button>
          {/* Add more share options as needed */}
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
