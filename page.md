
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
  const [scannedImage, setScannedImage] = useState<string | null>(null);
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

  useEffect(() => {
    let isMounted = true;

    const performInitialCameraCheck = async () => {
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
        // Attempt to get user media to check permission
        tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (isMounted) {
          setHasCameraPermission(true); // Permission granted
        }
      } catch (error: unknown) {
        if (isMounted) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            console.info('Initial camera permission: Access denied by user or policy.');
          } else {
            console.error('Error during initial camera permission check:', error);
          }
          setHasCameraPermission(false); // Permission denied or other error
        }
      } finally {
        // If a stream was obtained (permission granted), stop its tracks immediately.
        // This is just a permission check; the actual stream for the UI is handled by `handleOpenCamera`.
        if (tempStream) {
          tempStream.getTracks().forEach(track => track.stop());
        }
      }
    };

    if (hasCameraPermission === null) {
      performInitialCameraCheck();
    }

    return () => {
      isMounted = false;
      // General cleanup for videoRef if it's active when the component unmounts
      // This complements specific cleanups in handleCloseCamera, handleCaptureImage etc.
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [hasCameraPermission, toast]);


  useEffect(() => {
    setOcrAssessmentResult(null);
  }, [scannedImage]);

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
        setScannedImage(reader.result as string);
        setAppliedFilter("original");
        setShowCameraView(false); 
        toast({ title: "Image Loaded", description: "Your document is ready for processing." });
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
    }
  };

  const handleOpenCamera = () => {
    if (hasCameraPermission === true) {
      setScannedImage(null);
      setAppliedFilter("original");
      setOcrAssessmentResult(null);
      setOcrResultText("");
      setShowCameraView(true);
      
      setTimeout(() => { // Ensure DOM is updated for videoRef
        if (videoRef.current) {
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(err => {
                  console.error("Error playing video:", err);
                  toast({ variant: "destructive", title: "Camera Error", description: "Could not start camera preview."});
                });
              }
            })
            .catch(err => {
              console.error("Error accessing camera for preview:", err);
              if (err instanceof DOMException && err.name === 'NotAllowedError') {
                 toast({ variant: "destructive", title: "Camera Access Denied", description: "Please enable camera permissions in your browser settings."});
              } else {
                 toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera. Please check permissions or try again."});
              }
              setHasCameraPermission(false); 
              setShowCameraView(false);
            });
        } else {
             toast({ variant: "destructive", title: "Camera Init Error", description: "Camera component not ready. Please try again."});
             setShowCameraView(false); 
        }
      }, 0);
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
      // Optionally, re-trigger permission check if it's null, though useEffect should handle initial.
      // This case implies initial check might still be ongoing or failed silently.
      if (hasCameraPermission === null) {
        // Forcing a re-check if user clicks when it's still null.
        // This will run the useEffect logic again if hasCameraPermission is set to null
        // Or directly call a check function.
        // For simplicity, we rely on the toast and the user potentially retrying.
      }
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
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
          }
          if (videoRef.current) {
              videoRef.current.srcObject = null; 
          }
          setShowCameraView(false); 
          return;
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setScannedImage(dataUrl);
        setAppliedFilter("original");
        setShowCameraView(false);
        toast({ title: "Image Captured", description: "Your document is ready for processing." });
        
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null; 
        }
      } else {
         toast({ variant: "destructive", title: "Capture Error", description: "Could not get canvas context." });
      }
    } else {
       toast({ variant: "destructive", title: "Capture Error", description: "Camera or canvas not ready." });
    }
  }, [toast]);
  
  const handleUploadFileClick = () => {
    setShowCameraView(false);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    fileInputRef.current?.click();
  };

  const handleEdgeDetection = () => {
    toast({ title: "Feature Info", description: "Automatic edge detection coming soon!" });
  };

  const handlePerspectiveCorrection = () => {
    toast({ title: "Feature Info", description: "Perspective correction coming soon!" });
  };

  const handleApplyFilter = (filter: string) => {
    if (filter === "enhance") {
       toast({ title: "Feature Info", description: "Color enhancement filter coming soon!" });
       setAppliedFilter("original"); 
       return;
    }
    setAppliedFilter(filter);
    toast({ title: "Filter Applied", description: `Switched to ${filter} view.` });
  };

  const handleAssessOcr = async () => {
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setIsLoading(true);
    setOcrAssessmentResult(null); 
    try {
      const assessment = await performOcrAssessmentAction({ photoDataUri: scannedImage });
      setOcrAssessmentResult(assessment);
      toast({ title: "OCR Assessment Complete", description: assessment.willOcrBeSuccessful ? "Document quality looks good for OCR." : "Document quality might be challenging for OCR." });
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Assessment Error", description: (error instanceof Error ? error.message : "An unknown error occurred") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setIsLoading(true);
    setOcrResultText(""); 
    try {
      const result: ScanMobileOCROutput = await performOcrAction({ photoDataUri: scannedImage });
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
    if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setShowSaveModal(true);
  };

  const handleShare = () => {
     if (!scannedImage) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan or upload a document first." });
      return;
    }
    setShowShareModal(true);
  };
  
  const handleCloseCamera = () => {
    setShowCameraView(false);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  }

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
              {hasCameraPermission === null && ( // Still checking
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <p className="text-white p-4 bg-black/50 rounded-md">Initializing camera...</p>
                </div>
              )}
            </div>
            {hasCameraPermission === false && showCameraView && ( // Explicitly check showCameraView here for the alert
              <Alert variant="destructive" className="w-full max-w-md">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Camera permission was denied or is unavailable. Please check browser settings. You can use file upload instead.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full max-w-md">
              <Button onClick={handleCaptureImage} className="flex-1" disabled={hasCameraPermission !== true || isLoading}>
                <Camera className="mr-2 h-5 w-5" /> Capture Image
              </Button>
              <Button onClick={handleCloseCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
            <Button onClick={handleUploadFileClick} variant="link" className="mt-2">
                Or Upload an Image File
            </Button>
          </>
        ) : (
          <>
            <ImageDisplay imageUrl={scannedImage} appliedFilter={appliedFilter} />
            <ControlsPanel
              onOpenCameraClick={handleOpenCamera}
              onUploadFileClick={handleUploadFileClick}
              onEdgeDetection={handleEdgeDetection}
              onPerspectiveCorrection={handlePerspectiveCorrection}
              onApplyFilter={handleApplyFilter}
              onAssessOcr={handleAssessOcr}
              onRunOcr={handleRunOcr}
              onSave={handleSave}
              onShare={handleShare}
              isImageLoaded={!!scannedImage}
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
      />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />
    </div>
  );
}

export default ScanMobilePage;
