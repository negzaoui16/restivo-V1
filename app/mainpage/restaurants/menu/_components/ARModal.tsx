"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Box, Smartphone, Sparkles, Camera, VideoOff, RefreshCw, Layers } from "lucide-react";

// Web component custom element reference
const ModelViewer = "model-viewer" as unknown as React.ElementType;

interface ARModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  modelUrl: string;
  imageUrl?: string | null;
}

export function ARModal({
  isOpen,
  onClose,
  itemName,
  modelUrl,
  imageUrl,
}: ARModalProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Map internal /models/ path to jsDelivr CDN which serves valid model/gltf-binary MIME headers
  const resolvedModelUrl = React.useMemo(() => {
    if (!modelUrl) return "";
    if (modelUrl.includes("/models/")) {
      const fileName = modelUrl.substring(modelUrl.lastIndexOf("/") + 1);
      return `https://cdn.jsdelivr.net/gh/negzaoui16/restivo-V1@Negzaoui/public/models/${fileName}`;
    }
    return modelUrl;
  }, [modelUrl]);

  // Direct, gesture-safe Android Scene Viewer URL
  const androidSceneViewerUrl = React.useMemo(() => {
    if (!resolvedModelUrl) return "";
    return `intent://arvr.google.com/scene-viewer/1.0?file=${resolvedModelUrl}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
  }, [resolvedModelUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsAndroidDevice(isAndroid);
    setIsMobileDevice(isMobileUA || (isTouchDevice && window.innerWidth <= 1024));
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopCameraStream();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      stopCameraStream();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleStartLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "L'accès caméra direct nécessite une connexion HTTPS sécurisée. Utilisez le bouton Google AR ci-dessous."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Live camera access failed:", err);
      setCameraError(
        "Permission caméra refusée ou non disponible. Vous pouvez utiliser Google Scene Viewer."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className={`relative w-full ${isCameraActive ? "max-w-2xl h-[92vh]" : "max-w-xl max-h-[90vh]"} bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8E2D7] flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E2D7] bg-[#FAF7F2] z-20">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCameraActive ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-purple-100 text-purple-700"}`}>
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{itemName}</h3>
              <p className="text-[11px] text-[#736D65] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isCameraActive ? "Mode Réalité Augmentée en Direct" : "Vue 3D & Réalité Augmentée"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label="Fermer la vue 3D"
            title="Fermer"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E8E2D7] text-[#736D65] flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Viewport with Optional Live Camera Background */}
        <div className={`relative flex-1 ${isCameraActive ? "min-h-[460px] bg-black" : "min-h-[380px] bg-gradient-to-b from-[#FAF7F2] to-[#ECE6DC]"} overflow-hidden flex items-center justify-center`}>
          {/* Real-time Camera Feed (Web-AR) */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${isCameraActive ? "opacity-100 pointer-events-none" : "opacity-0 pointer-events-none"}`}
          />

          {/* Model-Viewer placed transparently over the camera or studio */}
          <ModelViewer
            ref={viewerRef}
            src={resolvedModelUrl}
            poster={imageUrl ?? undefined}
            alt={`3D model of ${itemName}`}
            auto-rotate={!isCameraActive ? "" : undefined}
            camera-controls=""
            bounds="tight"
            min-camera-orbit="auto 0deg auto"
            max-camera-orbit="auto 88deg auto"
            exposure="1.15"
            shadow-intensity={isCameraActive ? "1.8" : "1.2"}
            shadow-softness="0.7"
            touch-action="pan-y"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            style={{
              width: "100%",
              height: "100%",
              minHeight: isCameraActive ? "460px" : "380px",
              backgroundColor: "transparent",
              outline: "none",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Native slot for WebXR devices */}
            <button
              slot="ar-button"
              className="absolute top-4 right-4 py-2 px-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold backdrop-blur-md shadow-md flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>WebXR AR</span>
            </button>
          </ModelViewer>

          {/* Camera AR Overlay HUD Badge */}
          {isCameraActive && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Caméra active · Glissez le plat sur votre table</span>
            </div>
          )}
        </div>

        {/* Camera Error Alert */}
        {cameraError && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span>{cameraError}</span>
            <button
              type="button"
              onClick={() => setCameraError(null)}
              className="text-amber-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Controls & Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D7] flex flex-col gap-2.5 z-20">
          {isMobileDevice ? (
            <div className="flex flex-col gap-2">
              {isCameraActive ? (
                /* Active Camera Controls */
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="flex-1 py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <VideoOff className="w-4 h-4 text-red-400" />
                    <span>Quitter la caméra</span>
                  </button>
                </div>
              ) : (
                /* Primary AR Triggers */
                <>
                  <button
                    type="button"
                    onClick={handleStartLiveCamera}
                    className="w-full py-3 px-5 rounded-2xl bg-[#B55234] hover:bg-[#9E4328] active:bg-[#87341C] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Camera className="w-4.5 h-4.5" />
                    <span>Ouvrir la caméra en direct (Sur ma table)</span>
                  </button>

                  {/* Secondary Option: Native Google Scene Viewer for ARCore devices */}
                  {isAndroidDevice && (
                    <a
                      href={androidSceneViewerUrl}
                      rel="ar"
                      className="w-full py-2.5 px-4 rounded-xl border border-[#D9D2C5] hover:bg-[#F7F4EE] text-[#5A544C] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#B55234]" />
                      <span>Ou lancer avec Google Scene Viewer</span>
                    </a>
                  )}
                </>
              )}

              <p className="text-[11px] text-[#736D65] text-center leading-relaxed">
                {isCameraActive
                  ? "💡 Tournez le plat à 360° et déplacez-le pour voir son rendu exact sur votre table."
                  : "💡 Cliquez pour lancer la caméra en direct et projeter ce plat directement devant vous."}
              </p>
            </div>
          ) : (
            <div className="py-1 text-center">
              <p className="text-xs text-[#5E5850] font-semibold">
                💡 <strong>Vue 3D interactive :</strong> Utilisez la souris pour tourner à 360° et la molette pour zoomer.
              </p>
              <p className="text-[11px] text-[#8A847C] mt-1">
                📱 Ouvrez cette page sur votre smartphone pour projeter ce plat en Réalité Augmentée directement sur votre table.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
