"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Box,
  Smartphone,
  Sparkles,
  Camera,
  VideoOff,
  RefreshCw,
  Pin,
  Lock,
  Plus,
  Minus,
} from "lucide-react";

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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AR diagnostics: shows the real reason when native AR cannot start
  const [arDiag, setArDiag] = useState<string | null>(null);
  const [useSampleModel, setUseSampleModel] = useState(false);
  const arStartedRef = useRef(false);

  // Spatial Anchoring & Table Stabilization states
  // Initial scale set to realistic plate ratio (0.55 instead of oversized 1.0)
  const [isPinned, setIsPinned] = useState(false);
  const [scale, setScale] = useState(0.55);
  const [pos, setPos] = useState({ x: 0, y: 60 });
  const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0, rotation: 0 });

  const baselineOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Map internal /models/ path to jsDelivr CDN which serves valid model/gltf-binary MIME headers
  const resolvedModelUrl = React.useMemo(() => {
    // Isolation test: standard Google sample model to tell "phone/config problem" from "our model problem"
    if (useSampleModel) return "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    if (!modelUrl) return "";
    if (modelUrl.includes("/models/")) {
      const fileName = modelUrl.substring(modelUrl.lastIndexOf("/") + 1);
      return `https://cdn.jsdelivr.net/gh/negzaoui16/restivo-V1@Negzaoui/public/models/${fileName}`;
    }
    return modelUrl;
  }, [modelUrl, useSampleModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsMobileDevice(isMobileUA || (isTouchDevice && window.innerWidth <= 1024));
  }, []);

  // Stabilized Sensor Tracking (Filters out magnetic compass jitter and clamps displacement)
  useEffect(() => {
    if (!isCameraActive) {
      baselineOrientation.current = null;
      setGyroOffset({ x: 0, y: 0, rotation: 0 });
      return;
    }

    // Once pinned, the sensors no longer move the dish (offset was baked into pos)
    if (isPinned) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const alpha = e.alpha ?? 0;

      if (!baselineOrientation.current) {
        baselineOrientation.current = { alpha, beta: e.beta, gamma: e.gamma };
        return;
      }

      const base = baselineOrientation.current;

      // Delta pitch (tilt up/down) - purely gravitational, rock-solid
      const dBeta = e.beta - base.beta;

      // Delta roll (side tilt) - purely gravitational
      const dGamma = e.gamma - base.gamma;

      // Delta yaw (panning) - heavily dampened with deadband to eliminate compass noise
      let dAlpha = alpha - base.alpha;
      if (dAlpha > 180) dAlpha -= 360;
      if (dAlpha < -180) dAlpha -= 360;
      if (Math.abs(dAlpha) < 2.5) dAlpha = 0;

      // Vertical movement reacts to pitch (looking down/up at table)
      const gy = dBeta * 4.5;
      // Horizontal movement reacts to gentle yaw & roll
      const gx = -dAlpha * 3.0 - dGamma * 2.0;

      // Clamped within table range so it NEVER flies off the screen into the floor or couch!
      setGyroOffset({
        x: Math.max(-120, Math.min(120, gx)),
        y: Math.max(-140, Math.min(140, gy)),
        rotation: Math.max(-15, Math.min(15, -dGamma * 0.25)),
      });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [isCameraActive, isPinned]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsPinned(false);
    setPos({ x: 0, y: 60 });
    setScale(0.55);
  }, []);

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
  }, [isOpen, onClose, stopCameraStream]);

  // Trigger true native WebXR AR with floor/table plane detection
  const handleTriggerNativeAR = async () => {
    const viewer = viewerRef.current as any;
    setArDiag(null);
    setCameraError(null);
    arStartedRef.current = false;

    if (!viewer || typeof viewer.activateAR !== "function") {
      setArDiag("AR indisponible : le viewer 3D n'est pas prêt. Ouverture du mode caméra…");
      handleStartLiveCamera();
      return;
    }

    if (!viewer.loaded) {
      setArDiag("Le modèle 3D est encore en chargement ou a échoué à charger. Réessayez dans quelques secondes.");
      return;
    }

    if (!viewer.canActivateAR) {
      setArDiag(
        "Ce navigateur/téléphone n'expose aucun mode AR (WebXR / Scene Viewer). Ouverture du mode caméra…"
      );
      handleStartLiveCamera();
      return;
    }

    try {
      await viewer.activateAR();
    } catch (err: any) {
      setArDiag(`Échec du lancement AR : ${err?.message || "erreur inconnue"}. Ouverture du mode caméra…`);
      handleStartLiveCamera();
      return;
    }

    // Safety net: if nothing happened (silent failure), fall back to camera mode
    window.setTimeout(() => {
      if (!arStartedRef.current && document.visibilityState === "visible") {
        setArDiag("L'AR native n'a pas démarré sur cet appareil. Ouverture du mode caméra…");
        handleStartLiveCamera();
      }
    }, 3500);
  };

  // Listen to model-viewer events to understand why AR works or fails
  useEffect(() => {
    if (!isOpen) return;
    const viewer = viewerRef.current as any;
    if (!viewer) return;

    const onArStatus = (e: any) => {
      const status = e?.detail?.status;
      if (status === "session-started" || status === "object-placed") {
        arStartedRef.current = true;
        setArDiag(null);
      }
      if (status === "failed") {
        setArDiag("Le système AR a signalé un échec (ARCore / Scene Viewer). Utilisez le mode caméra.");
      }
    };
    const onError = (e: any) => {
      const msg = e?.detail?.sourceError?.message || e?.detail?.type || "erreur inconnue";
      setArDiag(`Erreur de chargement du modèle 3D : ${msg}`);
    };

    viewer.addEventListener("ar-status", onArStatus);
    viewer.addEventListener("error", onError);
    return () => {
      viewer.removeEventListener("ar-status", onArStatus);
      viewer.removeEventListener("error", onError);
    };
  }, [isOpen, resolvedModelUrl]);

  const handleStartLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "L'accès caméra direct nécessite une connexion HTTPS sécurisée."
      );
      return;
    }

    try {
      // Request permission for DeviceOrientation on iOS 13+
      if (
        typeof (DeviceOrientationEvent as any) !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          await (DeviceOrientationEvent as any).requestPermission();
        } catch {}
      }

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
      setCameraError(null);
      setArDiag(null);
      setIsCameraActive(true);
      setIsPinned(false);
      setPos({ x: 0, y: 60 });
      setScale(0.55);
    } catch (err: any) {
      console.warn("Live camera access failed:", err);
      setCameraError(
        "Permission caméra refusée. Veuillez autoriser l'accès à la caméra pour voir le plat sur votre table."
      );
    }
  };

  // Touch drag handlers to position food anywhere on the table
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPinned) return;
    const t = e.touches[0];
    isDragging.current = true;
    dragStart.current = {
      x: t.clientX,
      y: t.clientY,
      posX: pos.x,
      posY: pos.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isPinned) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setPos({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy,
    });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const togglePin = () => {
    if (!isPinned) {
      // Bake the current sensor offset into the position so the dish stays exactly where it is
      setPos((p) => ({ x: p.x + gyroOffset.x, y: p.y + gyroOffset.y }));
      setGyroOffset((g) => ({ x: 0, y: 0, rotation: g.rotation }));
      setIsPinned(true);
    } else {
      baselineOrientation.current = null;
      setIsPinned(false);
    }
  };

  const resetAnchor = () => {
    baselineOrientation.current = null;
    setGyroOffset({ x: 0, y: 0, rotation: 0 });
    setPos({ x: 0, y: 60 });
    setScale(0.55);
    setIsPinned(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${
          isCameraActive ? "max-w-2xl h-[94vh]" : "max-w-xl max-h-[90vh]"
        } bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8E2D7] flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D7] bg-[#FAF7F2] z-20">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCameraActive
                  ? "bg-emerald-100 text-emerald-700 animate-pulse"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{itemName}</h3>
              <p className="text-[11px] text-[#736D65] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isCameraActive ? "Réalité Augmentée · Ancrage sur table" : "Vue 3D & Réalité Augmentée"}
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

        {/* 3D Viewport with Live Camera + Spatial Table Stabilization */}
        <div
          className={`relative flex-1 ${
            isCameraActive ? "min-h-[480px] bg-black" : "min-h-[380px] bg-gradient-to-b from-[#FAF7F2] to-[#ECE6DC]"
          } overflow-hidden flex items-center justify-center`}
          onTouchStart={isCameraActive ? handleTouchStart : undefined}
          onTouchMove={isCameraActive ? handleTouchMove : undefined}
          onTouchEnd={isCameraActive ? handleTouchEnd : undefined}
        >
          {/* Live High-Definition Camera Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${
              isCameraActive ? "opacity-100 pointer-events-none" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Model-Viewer with Gyroscope & Spatial Translation */}
          <div
            className="w-full h-full flex items-center justify-center pointer-events-auto"
            style={{
              transform: isCameraActive
                ? `translate3d(${pos.x + gyroOffset.x}px, ${pos.y + gyroOffset.y}px, 0px) scale(${scale}) rotate(${gyroOffset.rotation}deg)`
                : "none",
              transition: isDragging.current ? "none" : "transform 0.08s ease-out",
              willChange: "transform",
              position: "relative",
              zIndex: 10,
            }}
          >
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
              shadow-intensity={isCameraActive ? "2.2" : "1.2"}
              shadow-softness="0.5"
              touch-action={isCameraActive ? "none" : "pan-y"}
              ar=""
              ar-modes="scene-viewer webxr quick-look"
              ar-placement="floor"
              ar-scale="auto"
              style={{
                width: "100%",
                height: "100%",
                minHeight: isCameraActive ? "480px" : "380px",
                backgroundColor: "transparent",
                outline: "none",
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
          </div>

          {/* Camera AR HUD Overlay Status */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <div
                className={`flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-semibold border shadow-md ${
                  isPinned
                    ? "bg-emerald-950/80 border-emerald-400 text-emerald-200"
                    : "bg-black/75 border-white/20 text-white"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPinned ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  }`}
                />
                <span>
                  {isPinned
                    ? "Plat fixé sur la table · Tournez autour"
                    : "Ajustez la position puis cliquez 'Fixer'"}
                </span>
              </div>

              <button
                type="button"
                onClick={resetAnchor}
                className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-md transition-transform active:scale-90"
                title="Recalibrer le centre"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Scale & Anchor Controls inside Camera View */}
          {isCameraActive && (
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
              {/* Scale Zoom Buttons with percentage */}
              <div className="flex items-center bg-black/70 backdrop-blur-md rounded-2xl border border-white/20 p-1 text-white shadow-lg">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.25, Number((s - 0.08).toFixed(2))))}
                  className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Réduire"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold px-2.5 min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(1.8, Number((s + 0.08).toFixed(2))))}
                  className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Agrandir"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Pin / Lock Button */}
              <button
                type="button"
                onClick={togglePin}
                className={`py-2 px-4 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95 ${
                  isPinned
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300"
                    : "bg-[#B55234] hover:bg-[#9E4328] text-white"
                }`}
              >
                {isPinned ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Fixé sur table</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5" />
                    <span>Fixer sur ma table</span>
                  </>
                )}
              </button>
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D7] flex flex-col gap-2 z-20">
          {isMobileDevice ? (
            <div className="flex flex-col gap-2">
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <VideoOff className="w-4 h-4 text-red-400" />
                  <span>Quitter le mode caméra</span>
                </button>
              ) : (
                <>
                  {/* Primary Trigger: True WebXR Plane Tracking */}
                  <button
                    type="button"
                    onClick={handleTriggerNativeAR}
                    className="w-full py-3 px-5 rounded-2xl bg-[#B55234] hover:bg-[#9E4328] active:bg-[#87341C] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                    <span>Poser sur ma table (Vrai AR · Détection de table)</span>
                  </button>

                  {/* Secondary Trigger: Live Stabilized Camera View */}
                  <button
                    type="button"
                    onClick={handleStartLiveCamera}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#D9D2C5] hover:bg-[#F7F4EE] text-[#5A544C] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <Camera className="w-4 h-4 text-[#B55234]" />
                    <span>Ou ouvrir en Mode Caméra Directe</span>
                  </button>
                </>
              )}

              {/* AR diagnostic: real reason when native AR fails */}
              {arDiag && !isCameraActive && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] leading-snug">
                  ⚠️ {arDiag}
                </div>
              )}

              {/* Isolation test: standard Google model vs our own model */}
              {!isCameraActive && (
                <button
                  type="button"
                  onClick={() => {
                    setArDiag(null);
                    setUseSampleModel((v) => !v);
                  }}
                  className="text-[11px] text-[#8A847C] underline underline-offset-2 text-center"
                >
                  {useSampleModel
                    ? "Revenir au modèle du plat"
                    : "🔧 Test : essayer l'AR avec un modèle standard (astronaute)"}
                </button>
              )}

              <p className="text-[11px] text-[#736D65] text-center leading-relaxed">
                {isCameraActive
                  ? "💡 Déplacez le plat avec le doigt, ajustez la taille, puis cliquez sur 'Fixer sur ma table' pour l'ancrer."
                  : "💡 Utilisez 'Poser sur ma table' pour scanner votre table et y déposer le plat."}
              </p>
            </div>
          ) : (
            <div className="py-1 text-center">
              <p className="text-xs text-[#5E5850] font-semibold">
                💡 <strong>Vue 3D interactive :</strong> Utilisez la souris pour tourner à 360° et la molette pour zoomer.
              </p>
              <p className="text-[11px] text-[#8A847C] mt-1">
                📱 Ouvrez cette page sur votre smartphone pour poser ce plat directement sur votre table en Réalité Augmentée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
