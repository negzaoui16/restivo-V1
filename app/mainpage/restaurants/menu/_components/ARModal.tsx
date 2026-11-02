"use client";

/**
 * ============================================================================
 * COMPOSANT : ARModal (Espace Client - Rendu 3D & Réalité Augmentée 1:1)
 * ============================================================================
 * Rôle :
 * Offre au client une expérience immersive en 2 modes :
 * 1. Mode Vue 3D 360° :
 *    - Utilise le composant officiel Google <model-viewer>.
 *    - Permet de tourner autour du plat à 360° et de zoomer sur les détails.
 * 2. Mode Réalité Augmentée Caméra (Live Camera AR 1:1) :
 *    - Calibre automatiquement la Taille Officielle 1:1 en cm (ex: Burger 12cm,
 *      M9loub 22cm, Pizza 30cm).
 *    - Active la caméra arrière HD du smartphone (via getUserMedia).
 *    - Permet de glisser le plat avec 1 doigt (Touch Drag) et zoomer à 2 doigts.
 *    - Ancrage Gyroscopique sur Table ("Fixer sur table") : compense les mouvements
 *      du téléphone (DeviceOrientation alpha/beta/gamma) pour que le plat reste
 *      fixé sur la table réelle.
 *    - Vue de Dessus Dynamique ("Chofou mill fo9") : quand le client lève/incline
 *      son téléphone au-dessus de la table (ou glisse le doigt une fois fixé, ou
 *      clique sur "Vue Dessus"), l'angle 3D (phi) passe en vue plongeante du dessus.
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  Ruler,
  Eye,
} from "lucide-react";
import { getOrCache3DModelBlob } from "@/lib/offline/offline-manager";
import { parseDescriptionTags, sizeCmToARScale } from "@/lib/menu/tags";

// Web component custom element reference
const ModelViewer = "model-viewer" as unknown as React.ElementType;

interface ARModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  modelUrl: string;
  imageUrl?: string | null;
  description?: string | null;
  categoryName?: string | null;
}

export function ARModal({
  isOpen,
  onClose,
  itemName,
  modelUrl,
  imageUrl,
  description,
  categoryName,
}: ARModalProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- CALIBRATION TAILLE OFFICIELLE 1:1 (EN CM) ---
  const officialSizeCm = useMemo(() => {
    return parseDescriptionTags(description, itemName, categoryName).sizeCm;
  }, [description, itemName, categoryName]);

  const officialScale = useMemo(() => {
    return sizeCmToARScale(officialSizeCm);
  }, [officialSizeCm]);

  // Position, échelle 1:1 et angles 3D (Theta = rotation horizontale, Phi = inclinaison verticale / vue de dessus)
  const [isPinned, setIsPinned] = useState(false);
  const [scale, setScale] = useState<number>(() => sizeCmToARScale(officialSizeCm));
  const [pos, setPos] = useState({ x: 0, y: 45 });
  const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0 });
  const [orbitTheta, setOrbitTheta] = useState(0); // Angle horizontal 3D en degrés (0°..360°)
  const [basePhi, setBasePhi] = useState(66); // Angle vertical 3D : 66° = vue sur table, 18° = vue de dessus (mill fo9)
  const [gyroPhiDelta, setGyroPhiDelta] = useState(0); // Ajustement dynamique selon l'inclinaison du téléphone
  const [isTopDownPreset, setIsTopDownPreset] = useState(false);

  // Suivi Gyroscope pour l'ancrage sur table et la vue de dessus
  const latestOrientationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const anchorOrientationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const smoothedGyroOffsetRef = useRef({ x: 0, y: 0 });
  const smoothedPhiDeltaRef = useRef(0);

  // Synchronise l'échelle initiale avec la taille officielle du plat
  useEffect(() => {
    setScale(officialScale);
  }, [officialScale]);

  // Touch Drag & Pinch-to-zoom tracking
  const isDragging = useRef(false);
  const dragStart = useRef({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
    theta: 0,
    phi: 66,
  });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(officialScale);

  // Offline & Local 3D Model Blob caching state
  const [localModelBlobUrl, setLocalModelBlobUrl] = useState<string | null>(null);
  const [isNetworkOffline, setIsNetworkOffline] = useState(false);

  // Clean, @-free HTTPS model URL
  const resolvedModelUrl = useMemo(() => {
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
    });

    return () => {
      isCancelled = true;
    };
  }, [resolvedModelUrl]);

  /**
   * ==========================================================================
   * CAPTEUR D'ORIENTATION (GYROSCOPE) : ANCRAGE SUR TABLE & VUE DE DESSUS
   * ==========================================================================
   * 1. Quand le téléphone s'incline au-dessus du plat (beta passe de 65° vers 15°),
   *    l'angle vertical (phi) du modèle 3D diminue automatiquement pour montrer
   *    le dessus du plat ("chofou mill fo9").
   * 2. Quand le plat est fixé sur la table (isPinned === true), les mouvements
   *    de rotation du téléphone (alpha, beta, gamma) sont compensés en sens
   *    inverse avec un lissage (lerp) pour que le plat reste ancré sur la table.
   * ==========================================================================
   */
  useEffect(() => {
    if (!isCameraActive || typeof window === "undefined") return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha ?? 0; // Yaw (boussole 0..360)
      const beta = event.beta ?? 60; // Pitch (0 = téléphone à plat horizontal au-dessus de la table, 90 = vertical)
      const gamma = event.gamma ?? 0; // Roll (-90..90)

      latestOrientationRef.current = { alpha, beta, gamma };

      // 1. Inclinaison dynamique Vue de Dessus ("mill fo9") selon l'angle du téléphone (beta)
      // Si beta ≈ 60° (téléphone incliné vers la table) -> delta = 0°
      // Si beta ≈ 15° (téléphone levé à plat au-dessus du burger) -> delta = -42° (vue du dessus !)
      const clampedBeta = Math.max(8, Math.min(82, beta));
      const targetPhiDelta = (clampedBeta - 60) * 0.85;
      smoothedPhiDeltaRef.current =
        smoothedPhiDeltaRef.current + (targetPhiDelta - smoothedPhiDeltaRef.current) * 0.22;
      setGyroPhiDelta(Math.round(smoothedPhiDeltaRef.current));

      // 2. Compensation d'ancrage sur la table lorsque "Fixer sur table" est actif
      if (isPinned && anchorOrientationRef.current) {
        const anchor = anchorOrientationRef.current;

        // Différence angulaire circulaire la plus courte sur 360° (-180°..+180°)
        const deltaAlpha = ((alpha - anchor.alpha + 540) % 360) - 180;
        const deltaGamma = gamma - anchor.gamma;
        const deltaBeta = beta - anchor.beta;

        // Déplacement inverse en pixels pour maintenir le plat au même point sur la table
        const rawTargetX = deltaAlpha * 9.5 - deltaGamma * 6.5;
        const rawTargetY = deltaBeta * 9.0;

        const clampedX = Math.max(-240, Math.min(240, rawTargetX));
        const clampedY = Math.max(-200, Math.min(200, rawTargetY));

        smoothedGyroOffsetRef.current = {
          x: smoothedGyroOffsetRef.current.x + (clampedX - smoothedGyroOffsetRef.current.x) * 0.28,
          y: smoothedGyroOffsetRef.current.y + (clampedY - smoothedGyroOffsetRef.current.y) * 0.28,
        };

        setGyroOffset({
          x: Math.round(smoothedGyroOffsetRef.current.x),
          y: Math.round(smoothedGyroOffsetRef.current.y),
        });
      }
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
    setPos({ x: 0, y: 45 });
    setGyroOffset({ x: 0, y: 0 });
    smoothedGyroOffsetRef.current = { x: 0, y: 0 };
    anchorOrientationRef.current = null;
    setScale(officialScale);
    setOrbitTheta(0);
    setBasePhi(66);
    setGyroPhiDelta(0);
    setIsTopDownPreset(false);
  }, [officialScale]);

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
   * GESTION DE LA CAMÉRA AR EN DIRECT (getUserMedia + Calibration 1:1)
   * ==========================================================================
   */
  const handleStartLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("L'accès caméra nécessite une connexion HTTPS sécurisée.");
      return;
    }

    // Demande la permission gyroscope sur iOS si nécessaire
    try {
      const DeviceOrientationEvt = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DeviceOrientationEvt?.requestPermission === "function") {
        await DeviceOrientationEvt.requestPermission().catch(() => {});
      }
    } catch {
      // Ignorer si non supporté
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
      setPos({ x: 0, y: 45 });
      setGyroOffset({ x: 0, y: 0 });
      smoothedGyroOffsetRef.current = { x: 0, y: 0 };
      anchorOrientationRef.current = null;
      setScale(officialScale); // Initialise à la taille officielle 1:1 du plat
      setOrbitTheta(0);
      setBasePhi(66);
      setGyroPhiDelta(0);
      setIsTopDownPreset(false);
    } catch (err: unknown) {
      console.warn("Live camera access failed:", err);
      setCameraError(
        "Permission caméra refusée. Veuillez autoriser l'accès à la caméra pour voir le plat sur votre table."
      );
    }
  };

  /**
   * ==========================================================================
   * MOTEUR TACTILE AR :
   * - Non fixé (Placement) : 1 doigt déplace le plat sur la table, 2 doigts zooment.
   * - Fixé sur table (isPinned) : le plat reste verrouillé à sa place sur la table,
   *   et glisser 1 doigt permet de tourner autour en 3D ou de regarder le plat
   *   par-dessus ("chofou mill fo9") sans qu'il bouge de la table !
   * ==========================================================================
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      isDragging.current = true;
      dragStart.current = {
        x: t.clientX,
        y: t.clientY,
        posX: pos.x,
        posY: pos.y,
        theta: orbitTheta,
        phi: basePhi,
      };
      pinchStartDist.current = null;
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;

      if (isPinned) {
        // Plat fixé sur la table : glisser 1 doigt incline la vue 3D (dessus / côté) et tourne à 360°
        const nextTheta = (dragStart.current.theta - dx * 0.55) % 360;
        const nextPhi = Math.max(12, Math.min(82, dragStart.current.phi - dy * 0.35));
        setOrbitTheta(Math.round(nextTheta));
        setBasePhi(Math.round(nextPhi));
        setIsTopDownPreset(nextPhi <= 30);
      } else {
        // Mode placement libre : déplace le plat sur la table
        setPos({
          x: dragStart.current.posX + dx,
          y: dragStart.current.posY + dy,
        });
      }
    } else if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      const nextScale = Math.min(1.6, Math.max(0.2, pinchStartScale.current * ratio));
      setScale(Number(nextScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    pinchStartDist.current = null;
  };

  const togglePin = () => {
    setIsPinned((prev) => {
      const nextPinned = !prev;
      if (nextPinned) {
        // Verrouille l'orientation actuelle comme point d'ancrage sur la table
        if (latestOrientationRef.current) {
          anchorOrientationRef.current = { ...latestOrientationRef.current };
        }
        smoothedGyroOffsetRef.current = { x: 0, y: 0 };
        setGyroOffset({ x: 0, y: 0 });
      } else {
        // Intègre le décalage courant et libère l'ancrage
        setPos((p) => ({
          x: p.x + gyroOffset.x,
          y: p.y + gyroOffset.y,
        }));
        anchorOrientationRef.current = null;
        smoothedGyroOffsetRef.current = { x: 0, y: 0 };
        setGyroOffset({ x: 0, y: 0 });
      }
      return nextPinned;
    });
  };

  const rotateDish = () => {
    setOrbitTheta((prev) => (prev + 45) % 360);
  };

  const toggleTopDownView = () => {
    setIsTopDownPreset((prev) => {
      const next = !prev;
      setBasePhi(next ? 18 : 66);
      return next;
    });
  };

  const resetToOfficialScale = () => {
    setScale(officialScale);
  };

  const resetPosition = () => {
    setPos({ x: 0, y: 45 });
    setGyroOffset({ x: 0, y: 0 });
    smoothedGyroOffsetRef.current = { x: 0, y: 0 };
    if (latestOrientationRef.current) {
      anchorOrientationRef.current = { ...latestOrientationRef.current };
    }
    setScale(officialScale);
    setOrbitTheta(0);
    setBasePhi(66);
    setIsTopDownPreset(false);
    setIsPinned(false);
  };

  if (!isOpen) return null;

  // Angle vertical final combinant la base (table ou vue dessus) et l'inclinaison du téléphone
  const effectivePhi = Math.max(12, Math.min(82, basePhi + gyroPhiDelta));
  // Position totale du plat sur l'écran (position manuelle + compensation gyroscopique quand fixé)
  const renderX = pos.x + (isPinned ? gyroOffset.x : 0);
  const renderY = pos.y + (isPinned ? gyroOffset.y : 0);
  // Taille physique actuelle affichée en cm (proportionnelle à la taille officielle 1:1)
  const currentDisplayedCm = Math.max(
    4,
    Math.round((scale / officialScale) * officialSizeCm)
  );
  const isAtOfficialScale = Math.abs(scale - officialScale) <= 0.03;

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
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E8E2D7] bg-[#FAF7F2] z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center ${
                isCameraActive
                  ? "bg-emerald-100 text-emerald-700 shadow-sm"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-[#1A1A1A] truncate">{itemName}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3ECE1] text-[#B55234] border border-[#E4D6C3]">
                  <Ruler className="w-2.5 h-2.5" />
                  Taille 1:1 : {officialSizeCm} cm
                </span>
                {isNetworkOffline && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    <WifiOff className="w-2.5 h-2.5" /> Hors Ligne
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#736D65] flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">
                  {isCameraActive
                    ? "Réalité Augmentée 1:1 · Inclinez le téléphone pour voir du dessus"
                    : "Vue 3D Interactive 360°"}
                </span>
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
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E8E2D7] text-[#736D65] flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Viewport with Live Camera Overlay */}
        <div
          className={`relative flex-1 ${
            isCameraActive
              ? "min-h-[500px] bg-black"
              : "min-h-[380px] bg-gradient-to-b from-[#FAF7F2] to-[#ECE6DC]"
          } overflow-hidden flex items-center justify-center select-none`}
          style={{ touchAction: isCameraActive ? "none" : "pan-y" }}
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

          {/* Realistic Contact Shadow on the Table */}
          {isCameraActive && (
            <div
              className="absolute pointer-events-none"
              style={{
                transform: `translate3d(${renderX}px, ${
                  renderY + (effectivePhi < 35 ? 25 : 85) * scale
                }px, 0px) scale(${scale})`,
                width: "260px",
                height: effectivePhi < 35 ? "210px" : "95px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0) 74%)",
                transition: isDragging.current ? "none" : "transform 0.08s ease-out, height 0.2s ease",
                zIndex: 5,
              }}
            />
          )}

          {/* 3D Food Model Container (Sans coupure ni conflit tactile) */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: isCameraActive
                ? `translate3d(${renderX}px, ${renderY}px, 0px) scale(${scale})`
                : "none",
              transition: isDragging.current ? "none" : "transform 0.08s ease-out",
              willChange: "transform",
              position: "relative",
              zIndex: 10,
              pointerEvents: isCameraActive ? "none" : "auto",
            }}
          >
            <ModelViewer
              ref={viewerRef}
              src={localModelBlobUrl || resolvedModelUrl}
              poster={imageUrl ?? undefined}
              alt={`Modèle 3D de ${itemName}`}
              auto-rotate={!isCameraActive}
              camera-controls={!isCameraActive}
              interaction-prompt="none"
              camera-orbit={
                isCameraActive
                  ? `${orbitTheta}deg ${effectivePhi}deg 105%`
                  : undefined
              }
              interpolation-decay="120"
              bounds="tight"
              min-camera-orbit="auto 0deg auto"
              max-camera-orbit="auto 88deg auto"
              exposure="1.2"
              shadow-intensity={isCameraActive ? "2.0" : "1.2"}
              shadow-softness="0.55"
              style={{
                width: "100%",
                height: "100%",
                minHeight: isCameraActive ? "500px" : "380px",
                backgroundColor: "transparent",
                outline: "none",
                pointerEvents: isCameraActive ? "none" : "auto",
              }}
            />
          </div>

          {/* Top HUD Badge in Camera Mode */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <div
                className={`flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] sm:text-[12px] font-semibold border shadow-lg ${
                  isPinned
                    ? "bg-emerald-950/90 border-emerald-400 text-emerald-100"
                    : "bg-black/75 border-white/20 text-white"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isPinned ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  }`}
                />
                <span className="truncate">
                  {isPinned
                    ? "Fixé sur table ✅ — Glissez ou levez le tél pour voir du dessus"
                    : "Glissez pour placer sur la table · 2 doigts pour zoomer"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                {/* Bouton Vue de Dessus ("Chofou mill fo9") / Vue Table */}
                <button
                  type="button"
                  onClick={toggleTopDownView}
                  className={`px-2.5 py-2 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md flex items-center gap-1 transition-all active:scale-95 ${
                    effectivePhi <= 32
                      ? "bg-amber-500 text-black border-amber-300"
                      : "bg-black/70 hover:bg-black/85 text-white border-white/20"
                  }`}
                  title="Basculer entre Vue de Dessus et Vue sur Table"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{effectivePhi <= 32 ? "Vue Dessus" : "Vue Table"}</span>
                </button>

                <button
                  type="button"
                  onClick={resetPosition}
                  className="p-2 rounded-full bg-black/70 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-md transition-transform active:scale-90"
                  title="Recentrer le plat en taille 1:1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Controls inside Camera View (Bottom HUD) */}
          {isCameraActive && (
            <div className="absolute bottom-4 left-2.5 right-2.5 z-30 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
              {/* Zoom Scale Buttons + Taille Officielle en cm */}
              <div className="flex items-center bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 p-1 text-white shadow-xl">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.2, Number((s - 0.05).toFixed(2))))}
                  className="w-7 h-7 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Réduire la taille"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetToOfficialScale}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold min-w-[68px] text-center transition-colors ${
                    isAtOfficialScale
                      ? "text-emerald-300"
                      : "text-amber-300 hover:bg-white/10"
                  }`}
                  title="Cliquez pour remettre à la taille officielle 1:1"
                >
                  📏 {currentDisplayedCm} cm {isAtOfficialScale ? "(1:1)" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(1.6, Number((s + 0.05).toFixed(2))))}
                  className="w-7 h-7 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                  title="Agrandir la taille"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rotate 3D Button */}
              <button
                type="button"
                onClick={rotateDish}
                className="py-2 px-3 rounded-2xl bg-black/80 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                title="Tourner le plat en 3D de 45°"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                <span>360°</span>
              </button>

              {/* Pin / Lock on Table Button */}
              <button
                type="button"
                onClick={togglePin}
                className={`py-2 px-3.5 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all active:scale-95 ${
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
              {/* Primary Action: Launch Camera AR Mode 1:1 */}
              <button
                type="button"
                onClick={handleStartLiveCamera}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#B55234] hover:bg-[#9E4328] active:bg-[#87341C] text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <Camera className="w-5 h-5 text-amber-200" />
                <span>
                  📸 Poser sur ma table (Taille réelle 1:1 · {officialSizeCm} cm)
                </span>
              </button>

              <p className="text-[11px] text-[#736D65] text-center leading-relaxed">
                💡 Calibré à la taille réelle ({officialSizeCm} cm). Fixez le plat sur la table puis levez votre téléphone pour le voir du dessus !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
