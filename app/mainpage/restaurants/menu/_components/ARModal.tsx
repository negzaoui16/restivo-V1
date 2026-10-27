"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Box, Smartphone, Sparkles, Camera } from "lucide-react";

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsMobileDevice(isMobileUA || (isTouchDevice && window.innerWidth <= 1024));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleActivateAR = () => {
    const viewer = viewerRef.current as any;

    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const isAndroid = /android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      // Generate the full absolute HTTPS URL to the 3D .glb model
      let fullUrl = "";
      if (modelUrl.includes("/models/")) {
        const fileName = modelUrl.substring(modelUrl.lastIndexOf("/") + 1);
        fullUrl = `https://raw.githubusercontent.com/negzaoui16/restivo-V1/Negzaoui/public/models/${fileName}`;
      } else {
        fullUrl = new URL(modelUrl, window.location.href).href;
        if (fullUrl.startsWith("http://")) {
          fullUrl = fullUrl.replace("http://", "https://");
        }
      }

      if (isAndroid) {
        // Direct launch into Google Scene Viewer with public HTTPS model URL
        const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
          fullUrl
        )}&mode=ar_preferred&title=${encodeURIComponent(
          itemName
        )}&resizable=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;

        window.location.href = sceneViewerIntent;
        return;
      }

      if (isIOS) {
        if (viewer && typeof viewer.activateAR === "function") {
          viewer.activateAR();
          return;
        }
      }

      // Universal fallback via ModelViewer
      if (viewer && typeof viewer.activateAR === "function") {
        viewer.activateAR();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8E2D7] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7] bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">{itemName}</h3>
              <p className="text-[11px] text-[#736D65] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Vue 3D & Réalité Augmentée
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la vue 3D"
            title="Fermer"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E8E2D7] text-[#736D65] flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Canvas / Model-Viewer Container */}
        <div className="relative flex-1 min-h-[400px] bg-gradient-to-b from-[#FAF7F2] to-[#ECE6DC] flex items-center justify-center p-4">
          <ModelViewer
            ref={viewerRef}
            src={modelUrl}
            poster={imageUrl ?? undefined}
            alt={`3D model of ${itemName}`}
            auto-rotate=""
            camera-controls=""
            bounds="tight"
            min-camera-orbit="auto 0deg auto"
            max-camera-orbit="auto 88deg auto"
            disable-pan=""
            exposure="1.1"
            shadow-intensity="1.5"
            shadow-softness="0.8"
            touch-action="pan-y"
            ar=""
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            style={{ width: "100%", height: "400px", outline: "none" }}
          >
            {/* Native slot fallback */}
            <button
              slot="ar-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleActivateAR();
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 py-2.5 px-5 rounded-full bg-[#B55234] hover:bg-[#9E4328] text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Voir sur ma table en AR</span>
            </button>
          </ModelViewer>
        </div>

        {/* Footer info & Device-specific controls */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D7] flex flex-col gap-2">
          {isMobileDevice ? (
            <>
              <button
                type="button"
                onClick={handleActivateAR}
                className="w-full py-3 px-5 rounded-2xl bg-[#B55234] hover:bg-[#9E4328] active:bg-[#87341C] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <Camera className="w-4.5 h-4.5" />
                <span>Voir sur ma table en AR (Ouvrir la caméra)</span>
              </button>
              <p className="text-[11px] text-[#736D65] text-center leading-relaxed">
                💡 Tournez le plat à 360° avec le doigt. Cliquez sur le bouton ci-dessus pour lancer la caméra et le poser sur votre table.
              </p>
            </>
          ) : (
            <div className="py-1 text-center">
              <p className="text-xs text-[#5E5850] font-semibold">
                💡 <strong>Vue 3D interactive :</strong> Utilisez la souris pour tourner à 360° et la molette pour zoomer.
              </p>
              <p className="text-[11px] text-[#8A847C] mt-1">
                📱 L&apos;option Caméra &amp; Réalité Augmentée est disponible sur smartphone et tablette pour projeter ce plat sur votre table.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
