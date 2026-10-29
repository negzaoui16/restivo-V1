"use client";

/**
 * ============================================================================
 * COMPOSANT : ARModal (Espace Client - Rendu 3D & Réalité Augmentée)
 * ============================================================================
 * Rôle :
 * Offre au client une expérience immersive en 2 modes :
 * 1. Mode Vue 3D 360° :
 *    - Utilise le composant officiel Google <model-viewer>.
 *    - Permet de tourner autour du plat à 360° et de zoomer sur les détails.
 * 2. Mode Réalité Augmentée Caméra (Live Camera AR) :
 *    - Active la caméra arrière HD du smartphone (via getUserMedia).
 *    - Incruste le plat 3D avec une ombre portée réaliste sous le plat.
 *    - Permet au client de glisser le plat avec 1 doigt (Touch Drag).
 *    - Permet d'ajuster l'échelle avec 2 doigts (Pinch-to-zoom) ou boutons ±.
 *    - Permet de faire pivoter le plat (⟳ 45°).
 *    - Permet de verrouiller le plat sur la table réelle (Bouton "Fixer").
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Box,
  Sparkles,
  Camera,
  VideoOff,
  RefreshCw,
  Pin,
  Lock,
  Plus,
  Minus,
  RotateCw,
  WifiOff,
} from "lucide-react";
import { getOrCache3DModelBlob } from "@/lib/offline/offline-manager";

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

  // Position, scale & rotation of dish in Camera AR Mode
  const [isPinned, setIsPinned] = useState(false);
  const [scale, setScale] = useState(0.65);
  const [pos, setPos] = useState({ x: 0, y: 50 });
  const [rotationDeg, setRotationDeg] = useState(0);

  // Touch Drag & Pinch-to-zoom tracking
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(0.65);

  // Offline & Local 3D Model Blob caching state
  const [localModelBlobUrl, setLocalModelBlobUrl] = useState<string | null>(null);
  const [isOfflineModel, setIsOfflineModel] = useState(false);
  const [isNetworkOffline, setIsNetworkOffline] = useState(false);

  // Clean, @-free HTTPS model URL
  const resolvedModelUrl = React.useMemo(() => {
    if (!modelUrl) return "";
    if (modelUrl.startsWith("/")) {
      if (typeof window !== "undefined") {
        return `${window.location.origin}${modelUrl}`;
      }
      return modelUrl;
    }
    if (modelUrl.includes("@")) {
      return modelUrl.replace(/@[^/]+/, "");
    }
    return modelUrl;
  }, [modelUrl]);

  // Direct Google Scene Viewer intent for Android fallback
  const androidSceneViewerUrl = React.useMemo(() => {
    if (!resolvedModelUrl) return "";
    const file = encodeURIComponent(resolvedModelUrl);
    const title = encodeURIComponent(itemName || "Plat Restivo");
    const fallback = encodeURIComponent(
      typeof window !== "undefined" ? window.location.href : ""
    );
    return `intent://arvr.google.com/scene-viewer/1.2?file=${file}&mode=ar_preferred&title=${title}&resizable=true&disable_occlusion=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
  }, [resolvedModelUrl, itemName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsAndroidDevice(isAndroid);
    setIsMobileDevice(isMobileUA || (isTouchDevice && window.innerWidth <= 1024));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsNetworkOffline(!navigator.onLine);

    const onOnline = () => setIsNetworkOffline(false);
    const onOffline = () => setIsNetworkOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!resolvedModelUrl) return;
    let isCancelled = false;

    getOrCache3DModelBlob(resolvedModelUrl).then((res) => {
      if (isCancelled || !res) return;
      setLocalModelBlobUrl(res.blobUrl);
      setIsOfflineModel(res.isFromCache);
    });

    return () => {
      isCancelled = true;
    };
  }, [resolvedModelUrl]);

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
    setPos({ x: 0, y: 50 });
    setScale(0.65);
    setRotationDeg(0);
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

  /**
   * ==========================================================================
   * GESTION DE LA CAMÉRA AR EN DIRECT (getUserMedia)
   * ==========================================================================
   * 1. Demande l'autorisation d'accès au capteur arrière (facingMode: environment).
   * 2. Demande une résolution idéale Full HD (1920x1080) sans audio.
   * 3. Attache le flux MediaStream à la balise <video> en arrière-plan.
   * ==========================================================================
   */
  const handleStartLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "L'accès caméra nécessite une connexion HTTPS sécurisée."
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
      setCameraError(null);
      setIsCameraActive(true);
      setIsPinned(false);
      setPos({ x: 0, y: 50 });
      setScale(0.65);
      setRotationDeg(0);
    } catch (err: any) {
      console.warn("Live camera access failed:", err);
      setCameraError(
        "Permission caméra refusée. Veuillez autoriser l'accès à la caméra pour voir le plat sur votre table."
      );
    }
  };

  /**
   * ==========================================================================
   * MOTEUR GESTUELLE TACTILE AR : TOUCH DRAG (1 Doigt) & PINCH-TO-ZOOM (2 Doigts)
   * ==========================================================================
   * - 1 Doigt : Calcule le delta de déplacement (clientX, clientY) pour positionner
   *             le plat exactement où le client le glisse sur sa table réelle.
   * - 2 Doigts : Calcule la distance euclidienne (Math.hypot(dx, dy)) entre les
   *              deux doigts pour ajuster dynamiquement l'échelle (scale).
   * ==========================================================================
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPinned) return; // Si verrouillé, les gestes sont désactivés
    if (e.touches.length === 1) {
      // Démarrage du glissement (Drag)
      const t = e.touches[0];
      isDragging.current = true;
      dragStart.current = {
        x: t.clientX,
        y: t.clientY,
        posX: pos.x,
        posY: pos.y,
      };
      pinchStartDist.current = null;
    } else if (e.touches.length === 2) {
      // Démarrage du zoom à deux doigts (Pinch)
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy); // Distance euclidienne initiale
      pinchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinned) return;
    if (e.touches.length === 1 && isDragging.current) {
      // Déplacement 1 doigt : calcule l'écart et met à jour la position X/Y
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      setPos({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    } else if (e.touches.length === 2 && pinchStartDist.current !== null) {
      // Zoom 2 doigts : compare la nouvelle distance à la distance initiale
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      // Borne l'échelle entre 0.25 (très petit) et 1.8 (très grand)
      const nextScale = Math.min(1.8, Math.max(0.25, pinchStartScale.current * ratio));
      setScale(Number(nextScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    pinchStartDist.current = null;
  };

  const togglePin = () => {
    setIsPinned((prev) => !prev);
  };

  const rotateDish = () => {
    setRotationDeg((prev) => (prev + 45) % 360);
  };

  const resetPosition = () => {
    setPos({ x: 0, y: 50 });
    setScale(0.65);
    setRotationDeg(0);
    setIsPinned(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${
          isCameraActive ? "max-w-3xl h-[95vh]" : "max-w-xl max-h-[90vh]"
        } bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8E2D7] flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E2D7] bg-[#FAF7F2] z-20">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                isCameraActive
                  ? "bg-emerald-100 text-emerald-700 shadow-sm"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{itemName}</h3>
                {(isNetworkOffline || isOfflineModel) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    <WifiOff className="w-2.5 h-2.5" /> Hors Ligne
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#736D65] flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isCameraActive ? "Réalité Augmentée · Vue Caméra en Direct" : "Vue 3D Interactive"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label="Fermer"
            title="Fermer"
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E8E2D7] text-[#736D65] flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Viewport with Live Camera Overlay */}
        <div
          className={`relative flex-1 ${
            isCameraActive ? "min-h-[500px] bg-black" : "min-h-[380px] bg-gradient-to-b from-[#FAF7F2] to-[#ECE6DC]"
          } overflow-hidden flex items-center justify-center select-none`}
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

          {/* Realistic Contact Shadow (Visible in Camera Mode under the dish) */}
          {isCameraActive && (
            <div
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate3d(${pos.x}px, ${pos.y + 110 * scale}px, 0px) scale(${scale})`,
                width: "280px",
                height: "90px",
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 75%)",
                zIndex: 5,
              }}
            />
          )}

          {/* 3D Food Model Container */}
          <div
            className="w-full h-full flex items-center justify-center pointer-events-auto"
            style={{
              transform: isCameraActive
                ? `translate3d(${pos.x}px, ${pos.y}px, 0px) scale(${scale}) rotate(${rotationDeg}deg)`
                : "none",
              transition: isDragging.current ? "none" : "transform 0.08s ease-out",
              willChange: "transform",
              position: "relative",
              zIndex: 10,
            }}
          >
            <ModelViewer
              ref={viewerRef}
              src={localModelBlobUrl || resolvedModelUrl}
              poster={imageUrl ?? undefined}
              alt={`Modèle 3D de ${itemName}`}
              auto-rotate={!isCameraActive}
              camera-controls={true}
              bounds="tight"
              min-camera-orbit="auto 0deg auto"
              max-camera-orbit="auto 88deg auto"
              exposure="1.2"
              shadow-intensity={isCameraActive ? "2.2" : "1.2"}
              shadow-softness="0.5"
              touch-action={isCameraActive && !isPinned ? "none" : "pan-y"}
              style={{
                width: "100%",
                height: "100%",
                minHeight: isCameraActive ? "500px" : "380px",
                backgroundColor: "transparent",
                outline: "none",
              }}
            />
          </div>

          {/* Top HUD Badge in Camera Mode */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <div
                className={`flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold border shadow-lg ${
                  isPinned
                    ? "bg-emerald-950/85 border-emerald-400 text-emerald-200"
                    : "bg-black/75 border-white/20 text-white"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPinned ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  }`}
                />
                <span>
                  {isPinned
                    ? "Plat fixé sur votre table ✅"
                    : isNetworkOffline
                    ? "AR Hors-Ligne 📴 — Glissez pour placer le plat"
                    : "Glissez avec le doigt pour placer le plat"}
                </span>
              </div>

              <button
                type="button"
                onClick={resetPosition}
                className="pointer-events-auto p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-md transition-transform active:scale-90"
                title="Recentrer le plat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Controls inside Camera View (Bottom HUD) */}
          {isCameraActive && (
            <div className="absolute bottom-4 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
              {/* Zoom Scale Buttons */}
              <div className="flex items-center bg-black/75 backdrop-blur-md rounded-2xl border border-white/20 p-1 text-white shadow-xl">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.25, Number((s - 0.08).toFixed(2))))}
                  className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Réduire la taille"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold px-2 min-w-[46px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(1.8, Number((s + 0.08).toFixed(2))))}
                  className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Agrandir la taille"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Rotate Button */}
              <button
                type="button"
                onClick={rotateDish}
                className="p-2.5 rounded-2xl bg-black/75 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                title="Tourner le plat de 45°"
              >
                <RotateCw className="w-4 h-4 text-amber-300" />
                <span>⟳ Tourner</span>
              </button>

              {/* Pin / Lock on Table Button */}
              <button
                type="button"
                onClick={togglePin}
                className={`py-2.5 px-4 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                  isPinned
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300"
                    : "bg-[#B55234] hover:bg-[#9E4328] text-white"
                }`}
              >
                {isPinned ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Fixé</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4" />
                    <span>Fixer sur table</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span>{cameraError}</span>
            <button
              type="button"
              onClick={() => setCameraError(null)}
              className="text-amber-900 font-bold ml-2 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E2D7] flex flex-col gap-2 z-20">
          {isCameraActive ? (
            <button
              type="button"
              onClick={stopCameraStream}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <VideoOff className="w-4 h-4 text-red-400" />
              <span>Quitter le mode caméra (Retour à la vue 3D)</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Primary Action: Launch Camera AR Mode */}
              <button
                type="button"
                onClick={handleStartLiveCamera}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#B55234] hover:bg-[#9E4328] active:bg-[#87341C] text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <Camera className="w-5 h-5 text-amber-200" />
                <span>📸 Poser sur ma table (Caméra Réalité Augmentée)</span>
              </button>

              {/* Optional Android Google Scene Viewer fallback */}
              {isAndroidDevice && androidSceneViewerUrl && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = androidSceneViewerUrl;
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-[#D9D2C5] hover:bg-[#F7F4EE] text-[#5A544C] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ouvrir dans Google 3D (Scene Viewer)</span>
                </button>
              )}

              <p className="text-[11px] text-[#736D65] text-center leading-relaxed">
                💡 En ouvrant la caméra, vous pourrez glisser le plat avec le doigt directement sur votre table et le fixer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
