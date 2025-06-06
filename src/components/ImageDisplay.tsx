
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageDisplayProps {
  imageUrl: string | null;
  appliedFilter?: string; 
  currentImageIndex: number;
  totalPages: number;
  onNextImage: () => void;
  onPreviousImage: () => void;
}

export function ImageDisplay({ 
  imageUrl, 
  appliedFilter, 
  currentImageIndex, 
  totalPages, 
  onNextImage, 
  onPreviousImage 
}: ImageDisplayProps) {
  let filterClasses = "";
  if (appliedFilter === "grayscale") {
    filterClasses = "filter grayscale";
  } else if (appliedFilter === "bw") {
    filterClasses = "filter grayscale contrast-150 brightness-110";
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-2">
      <div 
        id="image-to-capture" 
        className="w-full aspect-[3/4] bg-muted rounded-lg shadow-lg overflow-hidden flex items-center justify-center border border-border"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Scanned document page ${currentImageIndex + 1}`}
            width={600}
            height={800}
            className={cn("object-contain w-full h-full", filterClasses)}
            priority 
            quality={100} 
            key={imageUrl} // Add key to force re-render on image change
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src="https://placehold.co/600x800.png"
              alt="Placeholder for scanned document"
              width={600}
              height={800}
              data-ai-hint="document scan"
              className="object-contain w-full h-full opacity-50"
              priority
            />
          </div>
        )}
      </div>
      {totalPages > 0 && (
        <div className="flex items-center justify-between w-full mt-2 px-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPreviousImage} 
            disabled={currentImageIndex <= 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentImageIndex + 1} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onNextImage} 
            disabled={currentImageIndex >= totalPages - 1}
          >
            Next <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

    