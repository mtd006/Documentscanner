"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageDisplayProps {
  imageUrl: string | null;
  appliedFilter?: string; // e.g., 'grayscale', 'bw'
}

export function ImageDisplay({ imageUrl, appliedFilter }: ImageDisplayProps) {
  let filterClasses = "";
  if (appliedFilter === "grayscale") {
    filterClasses = "filter grayscale";
  } else if (appliedFilter === "bw") {
    filterClasses = "filter grayscale contrast-150 brightness-110";
  }

  return (
    <div className="w-full max-w-md aspect-[3/4] bg-muted rounded-lg shadow-lg overflow-hidden flex items-center justify-center border border-border">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Scanned document"
          width={600}
          height={800}
          className={cn("object-contain w-full h-full", filterClasses)}
          priority
        />
      ) : (
        <Image
          src="https://placehold.co/600x800.png"
          alt="Placeholder for scanned document"
          width={600}
          height={800}
          data-ai-hint="document scan"
          className="object-contain w-full h-full opacity-50"
          priority
        />
      )}
    </div>
  );
}
