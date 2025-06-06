
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ImageDisplay } from "@/components/ImageDisplay";
import { ControlsPanel } from "@/components/ControlsPanel";
import { OcrModal } from "@/components/modals/OcrModal";
import { SaveModal } from "@/components/modals/SaveModal";
import { ShareModal } from "@/components/modals/ShareModal";
import { useToast } from "@/hooks/use-toast";
import { performOcrAssessmentAction, performOcrAction } from "./actions";
import type { AssessOcrQualityOutput } from "@/ai/flows/scan-mobile-assess-ocr";
import type { ScanMobileOCROutput } from "@/ai/flows/scan-mobile-ocr";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const ScanMobilePage: React.FC = () => {
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [appliedFilter, setAppliedFilter] = useState<string>("original");
  const [isLoading, setIsLoading] = useState(false);
  const [ocrAssessmentResult, setOcrAssessmentResult] = useState<AssessOcrQualityOutput | null>(null);
  const [ocrResultText, setOcrResultText] = useState<string>("");
  
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCameraView, setShowCameraView] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const currentImageUrl = currentImageIndex >= 0 && currentImageIndex < scannedImages.length ? scannedImages[currentImageIndex] : null;

  useEffect(() => {
    let isMounted = true;

    const performInitialCameraCheck = async () => {
      if (hasCameraPermission !== null) return; 

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access.',
          });
          setHasCameraPermission(false);
        }
        return;
      }

      let tempStream: MediaStream | null = null;
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (isMounted) {
          setHasCameraPermission(true);
        }
      } catch (error: unknown) {
        if (isMounted) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            console.info('Initial camera permission: Access denied by user or policy.');
          } else {
            console.error('Error during initial camera permission check:', error);
          }
          setHasCameraPermission(false);
        }
      } finally {
        if (tempStream) {
          tempStream.getTracks().forEach(track => track.stop());
        }
      }
    };
    
    performInitialCameraCheck();

    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [hasCameraPermission, toast]);


  useEffect(() => {
    let stream: MediaStream | null = null;
    const startStream = async () => {
      if (videoRef.current && hasCameraPermission === true) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (videoRef.current) { 
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error starting camera stream:", err);
          toast({ variant: "destructive", title: "Camera Error", description: "Could not start camera. Please check permissions."});
          setHasCameraPermission(false); 
          setShowCameraView(false); 
        }
      }
    };

    if (showCameraView) {
      startStream();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentActiveStream = videoRef.current.srcObject as MediaStream;
        currentActiveStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [showCameraView, hasCameraPermission, toast]);


  useEffect(() => {
    setOcrAssessmentResult(null);
    setOcrResultText("");
  }, [currentImageIndex, scannedImages.length]);


  const addImageToScans = useCallback((imageDataUrl: string) => {
    setScannedImages(prevScannedImgs => {
      const newScannedImgs = [...prevScannedImgs, imageDataUrl];
      setCurrentImageIndex(prevScannedImgs.length); 
      return newScannedImgs;
    });
    setAppliedFilter("original");
  }, [setScannedImages, setCurrentImageIndex, setAppliedFilter]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select an image file.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        addImageToScans(reader.result as string);
        setShowCameraView(false); 
        toast({ title: "Image Added", description: "New page added to your document." });
      };
      reader.onerror = (errorEvent: ProgressEvent<FileReader>) => {
        const errorMessage = (errorEvent.target as FileReader)?.error?.message || "Could not read the selected file.";
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: errorMessage,
        });
      }
      reader.readAsDataURL(file);
      if (fileInputRef.current) { 
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenCamera = () => {
    if (hasCameraPermission === true) {
      setShowCameraView(true);
    } else if (hasCameraPermission === false) {
      toast({
        variant: "destructive",
        title: "Camera Access Required",
        description: "Camera permission was denied or is not available. Please check your browser settings or use file upload.",
      });
    } else { 
       toast({
        title: "Checking Camera...",
        description: "Attempting to access camera. Please wait or respond to any permission prompts.",
      });
    }
  };

  const handleCaptureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const currentStream = video.srcObject instanceof MediaStream ? video.srcObject : null;

      if (videoWidth === 0 || videoHeight === 0 || !currentStream || !currentStream.active) {
          toast({ variant: "destructive", title: "Capture Error", description: "Video stream not ready or inactive. Please try opening the camera again." });
          setShowCameraView(false); 
          return;
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        addImageToScans(dataUrl);
        toast({ title: "Image Captured & Added", description: "New page added to your document." });
      } else {
         toast({ variant: "destructive", title: "Capture Error", description: "Could not get canvas context." });
         setShowCameraView(false); 
      }
    } else {
       toast({ variant: "destructive", title: "Capture Error", description: "Camera or canvas not ready." });
       setShowCameraView(false); 
    }
  }, [toast, addImageToScans]); 
  
  const handleUploadFileClick = () => {
    setShowCameraView(false); 
    fileInputRef.current?.click();
  };

  const handleEdgeDetection = () => {
    toast({ title: "Feature Info", description: "Automatic edge detection coming soon!" });
  };

  const handlePerspectiveCorrection = () => {
    toast({ title: "Feature Info", description: "Perspective correction coming soon!" });
  };

  const handleCropImage = () => {
    toast({ title: "Feature Info", description: "Crop image feature coming soon!" });
  };

  const handleBrightnessContrast = () => {
    toast({ title: "Feature Info", description: "Brightness/Contrast adjustment coming soon!" });
  };

  const handleApplyFilter = (filter: string) => {
    if (filter === "enhance") {
       toast({ title: "Feature Info", description: "Color enhancement filter coming soon!" });
       setAppliedFilter("original"); 
       return;
    }
    setAppliedFilter(filter);
    toast({ title: "Filter Applied", description: `Switched to ${filter} view for current page.` });
  };

  const handleAssessOcr = async () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setIsLoading(true);
    setOcrAssessmentResult(null); 
    try {
      const assessment = await performOcrAssessmentAction({ photoDataUri: currentImageUrl });
      setOcrAssessmentResult(assessment);
      toast({ title: "OCR Assessment Complete", description: assessment.willOcrBeSuccessful ? "Document quality looks good for OCR." : "Document quality might be challenging for OCR." });
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Assessment Error", description: (error instanceof Error ? error.message : "An unknown error occurred") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setIsLoading(true);
    setOcrResultText(""); 
    try {
      const result: ScanMobileOCROutput = await performOcrAction({ photoDataUri: currentImageUrl });
      if (result.isConvertible && result.text) {
        setOcrResultText(result.text);
        setShowOcrModal(true);
        toast({ title: "OCR Successful", description: "Text extracted from the document." });
      } else {
        const message = result.text || (result.isConvertible === false ? "Document not convertible to text." : "Could not extract text.");
        toast({ title: "OCR Information", description: message });
        setOcrResultText(message); 
        setShowOcrModal(true);
      }
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "OCR Error", description: (error instanceof Error ? error.message : "An unknown error occurred") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please select or scan a page." });
      return;
    }
    setShowSaveModal(true);
  };

  const handleShare = () => {
     if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No Image", description: "Please select or scan a page." });
      return;
    }
    setShowShareModal(true);
  };
  
  const handleCloseCamera = () => {
    setShowCameraView(false); 
  }

  const handleNextImage = () => {
    if (currentImageIndex < scannedImages.length - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleDeleteCurrentImage = () => {
    const currentScannedImagesState = scannedImages; 
    const currentIndexBeforeDelete = currentImageIndex;

    if (currentIndexBeforeDelete === -1 || currentScannedImagesState.length === 0) {
      toast({ variant: "destructive", title: "No Page", description: "There is no page to delete." });
      return;
    }

    const lengthBeforeDelete = currentScannedImagesState.length;

    setScannedImages(prevImages => prevImages.filter((_, idx) => idx !== currentIndexBeforeDelete));

    setCurrentImageIndex(() => {
      const newLength = lengthBeforeDelete - 1;

      if (newLength === 0) {
        return -1; 
      }

      if (currentIndexBeforeDelete >= newLength) {
        return newLength - 1; 
      }
      
      return currentIndexBeforeDelete;
    });

    toast({ title: "Page Deleted", description: "The current page has been removed." });
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 sm:p-6 flex flex-col items-center gap-6">
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {showCameraView ? (
          <>
            <div className="relative w-full max-w-md aspect-[3/4] bg-muted rounded-lg shadow-lg overflow-hidden flex flex-col items-center justify-center border border-border">
              <video 
                ref={videoRef} 
                className="w-full h-full object-contain"
                autoPlay 
                playsInline 
                muted 
              />
              {hasCameraPermission === null && ( 
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <p className="text-white p-4 bg-black/50 rounded-md">Initializing camera...</p>
                </div>
              )}
            </div>
            {hasCameraPermission === false && showCameraView && ( 
              <Alert variant="destructive" className="w-full max-w-md">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Camera permission was denied or is unavailable. Please check browser settings. You can use file upload instead.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full max-w-md">
              <Button onClick={handleCaptureImage} className="flex-1" disabled={hasCameraPermission !== true || isLoading}>
                <Camera className="mr-2 h-5 w-5" /> Capture & Add Page
              </Button>
              <Button onClick={handleCloseCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
            <Button onClick={handleUploadFileClick} variant="link" className="mt-2">
                Or Add Page by Upload
            </Button>
          </>
        ) : (
          <>
            <ImageDisplay 
              imageUrl={currentImageUrl} 
              appliedFilter={appliedFilter}
              currentImageIndex={currentImageIndex}
              totalPages={scannedImages.length}
              onNextImage={handleNextImage}
              onPreviousImage={handlePreviousImage}
            />
            <ControlsPanel
              onOpenCameraClick={handleOpenCamera}
              onUploadFileClick={handleUploadFileClick}
              onEdgeDetection={handleEdgeDetection}
              onPerspectiveCorrection={handlePerspectiveCorrection}
              onCropImage={handleCropImage}
              onBrightnessContrast={handleBrightnessContrast}
              onApplyFilter={handleApplyFilter}
              onAssessOcr={handleAssessOcr}
              onRunOcr={handleRunOcr}
              onSave={handleSave}
              onShare={handleShare}
              onDeleteCurrentImage={handleDeleteCurrentImage}
              isImageLoaded={scannedImages.length > 0 && currentImageIndex !== -1}
              isLoading={isLoading}
              ocrAssessmentResult={ocrAssessmentResult}
              ocrResultTextForDisabledCheck={ocrResultText}
            />
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </main>
      <OcrModal 
        isOpen={showOcrModal} 
        onClose={() => setShowOcrModal(false)} 
        text={ocrResultText} 
      />
      <SaveModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)}
        currentImageIndex={currentImageIndex}
        totalPages={scannedImages.length}
      />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        currentImageUrl={currentImageUrl}
        currentImageIndex={currentImageIndex}
        totalPages={scannedImages.length}
      />
    </div>
  );
}

export default ScanMobilePage;

    