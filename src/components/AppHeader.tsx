
"use client";

import { ScanLine, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onNewScanClick?: () => void;
}

export function AppHeader({ onNewScanClick }: AppHeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <ScanLine className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-headline font-semibold">ScanMobile</h1>
        </div>
        {onNewScanClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewScanClick}
            className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            aria-label="Start new scan"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            New Scan
          </Button>
        )}
      </div>
    </header>
  );
}
