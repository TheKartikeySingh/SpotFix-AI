import React, { useRef, useState, useEffect } from "react";
import { Camera, X, RefreshCw, AlertTriangle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(
        "Could not access your camera. Please ensure permissions are granted or switch to manual file uploading."
      );
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Match canvas dimensions to the active video track size
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Extract as base64 JPEG
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-between p-4 md:p-6 select-none">
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between text-white z-10">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Camera Viewfinder
        </h3>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-full text-slate-300"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder / Screen */}
      <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900 z-10">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Starting camera stream...</span>
          </div>
        )}

        {error ? (
          <div className="p-6 text-center space-y-4 z-10 max-w-sm">
            <div className="w-12 h-12 bg-red-950 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-red-200 text-sm leading-relaxed">{error}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700"
            >
              Retry Camera Access
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Center alignment overlay */}
        {!error && !isInitializing && (
          <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-6 h-6 border-t-2 border-l-2 border-white/40 absolute top-0 left-0"></div>
            <div className="w-6 h-6 border-t-2 border-r-2 border-white/40 absolute top-0 right-0"></div>
            <div className="w-6 h-6 border-b-2 border-l-2 border-white/40 absolute bottom-0 left-0"></div>
            <div className="w-6 h-6 border-b-2 border-r-2 border-white/40 absolute bottom-0 right-0"></div>
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-lg flex items-center justify-center gap-6 py-4 z-10">
        {!error && (
          <>
            <button
              onClick={toggleCamera}
              className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition active:scale-90"
              title="Flip Camera"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white hover:bg-slate-100 active:scale-95 transition rounded-full p-1.5 flex items-center justify-center shadow-2xl"
              title="Capture Photo"
              disabled={isInitializing}
            >
              <div className="w-full h-full rounded-full border-4 border-slate-900 bg-white flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-900" />
              </div>
            </button>

            <div className="w-14"></div> {/* spacer to center the trigger button */}
          </>
        )}
      </div>
    </div>
  );
}
