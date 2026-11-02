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
 * 2. Mode Réalité Augmentée Caméra (Live Camera AR 1:1 avec Suivi Visuel Optique) :
 *    - Calibre automatiquement la Taille Officielle 1:1 en cm (ex: Burger 12cm,
 *      M9loub 22cm, Pizza 30cm).
 *    - Active la caméra arrière HD du smartphone (via getUserMedia).
 *    - Ancrage Visuel Optique sur Table ("Fixer sur table") :
 *      Analyse en temps réel (60 FPS sur canvas basse résolution) le flux vidéo
 *      de la caméra (Optical Flow multi-blocs + Verrouillage de Repère Visuel /
 *      Landmark Template Matching) pour que le plat suive exactement les pixels
 *      de la table et des objets voisins sans jamais partir en sens inverse.
 *    - Vue de Dessus Dynamique ("Chofou mill fo9") : quand le client lève/incline
 *      son téléphone au-dessus de la table (ou clique sur "👁️ Dessus"), l'angle
 *      3D (phi) passe en vue plongeante du dessus sans déplacer le plat.
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

// Dimensions du canvas d'analyse optique (rapide < 0.4ms par frame)
const TRACK_W = 96;
const TRACK_H = 128;
const PATCH_HALF = 4; // Patch 9x9 pour le flux optique
const LANDMARK_HALF = 5; // Patch 11x11 pour le verrouillage de repère sur table

interface LandmarkAnchor {
  template: Uint8Array; // Patch 11x11 en niveaux de gris
  landmarkX: number; // Position courante estimée du repère (en coords TRACK_W)
  landmarkY: number; // Position courante estimée du repère (en coords TRACK_H)
  offsetToDishX: number; // Vecteur (dishCanvasX - landmarkX) au moment du clic sur Fixer
  offsetToDishY: number; // Vecteur (dishCanvasY - landmarkY) au moment du clic sur Fixer
}

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
  const viewportRef = useRef<HTMLDivElement | null>(null);
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

  // Position, échelle 1:1 et angles 3D (Theta = rotation 360°, Phi = inclinaison verticale / vue de dessus)
  const [isPinned, setIsPinned] = useState(false);
  const [scale, setScale] = useState<number>(() => sizeCmToARScale(officialSizeCm));
  const [pos, setPos] = useState({ x: 0, y: 35 });
  const posRef = useRef({ x: 0, y: 35 });
  const [orbitTheta, setOrbitTheta] = useState(0); // Angle horizontal 3D en degrés (0°..360°)
  const [basePhi, setBasePhi] = useState(66); // Angle vertical 3D : 66° = vue sur table, 16° = vue de dessus (mill fo9)
  const [gyroPhiDelta, setGyroPhiDelta] = useState(0); // Inclinaison dynamique Vue de Dessus uniquement

  // Références pour le suivi optique sur vidéo (Optical Flow + Landmark)
  const prevGrayRef = useRef<Uint8Array | null>(null);
  const landmarkRef = useRef<LandmarkAnchor | null>(null);
  const smoothedPhiDeltaRef = useRef(0);
  const baselineBetaRef = useRef<number | null>(null);

  // Synchronise posRef avec pos
  const updatePos = useCallback((next: { x: number; y: number }) => {
    posRef.current = next;
    setPos(next);
  }, []);

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
   * 1. CAPTEUR D'INCLINAISON (BETA UNIQUEMENT) POUR LA VUE DE DESSUS ("MILL FO9")
   * ==========================================================================
   * Note : Le gyroscope n'est JAMAIS utilisé pour déplacer la position (X, Y)
   * afin d'éviter tout Gimbal Lock ou déplacement en sens inverse. Il sert
   * uniquement à incliner l'angle 3D vertical (phi) quand on lève le téléphone
   * au-dessus du plat !
   * ==========================================================================
   */
  useEffect(() => {
    if (!isCameraActive || typeof window === "undefined") return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.beta === undefined) return;
      const beta = Math.max(5, Math.min(85, event.beta));

      if (baselineBetaRef.current === null) {
        baselineBetaRef.current = beta;
      }

      // Si le téléphone est penché à l'horizontale au-dessus de la table (beta -> 10°..25°),
      // l'angle vertical 3D passe automatiquement en vue de dessus ("mill fo9")
      const targetPhiDelta = (beta - 58) * 0.9;
      smoothedPhiDeltaRef.current =
        smoothedPhiDeltaRef.current + (targetPhiDelta - smoothedPhiDeltaRef.current) * 0.25;
      setGyroPhiDelta(Math.round(smoothedPhiDeltaRef.current));
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [isCameraActive]);

  /**
   * ==========================================================================
   * 2. MOTEUR DE SUIVI VISUEL OPTIQUE SUR LA CAMÉRA (OPTICAL TABLE TRACKER)
   * ==========================================================================
   * Lorsque "Fixer sur table" (isPinned) est actif :
   * - Lit chaque image de la caméra (<video>) sur un canvas 96x128 (correspondant
   *   exactement au cadrage object-cover de l'écran).
   * - Détecte les blocs à fort contraste (contours de la table, baffle, tasse...)
   *   et mesure leur déplacement exact (dx, dy) en pixels d'une frame à l'autre.
   * - Verrouille également un repère visuel (Landmark 11x11) proche du plat pour
   *   corriger toute dérive quand la caméra revient vers le point d'origine.
   * ==========================================================================
   */
  useEffect(() => {
    if (!isCameraActive || !isPinned) {
      prevGrayRef.current = null;
      landmarkRef.current = null;
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = TRACK_W;
    canvas.height = TRACK_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let rafId: number;
    let isRunning = true;

    // Calcule le contraste local (gradient) d'un patch centré en (cx, cy)
    const getPatchContrast = (gray: Uint8Array, cx: number, cy: number, half: number): number => {
      let minV = 255;
      let maxV = 0;
      let gradSum = 0;
      for (let dy = -half; dy <= half; dy++) {
        const rowOffset = (cy + dy) * TRACK_W;
        for (let dx = -half; dx <= half; dx++) {
          const idx = rowOffset + (cx + dx);
          const v = gray[idx];
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
          if (dx < half && dy < half) {
            gradSum += Math.abs(v - gray[idx + 1]) + Math.abs(v - gray[idx + TRACK_W]);
          }
        }
      }
      const range = maxV - minV;
      if (range < 16) return 0; // Zone trop plate / unie (ex: table lisse sans contour)
      return gradSum;
    };

    // Extrait un template carré (2*half+1)x(2*half+1)
    const extractPatch = (gray: Uint8Array, cx: number, cy: number, half: number): Uint8Array => {
      const size = half * 2 + 1;
      const out = new Uint8Array(size * size);
      let k = 0;
      for (let dy = -half; dy <= half; dy++) {
        const rowOffset = (cy + dy) * TRACK_W;
        for (let dx = -half; dx <= half; dx++) {
          out[k++] = gray[rowOffset + (cx + dx)];
        }
      }
      return out;
    };

    // Recherche le point de repère (landmark) le plus contrasté autour du plat
    const captureBestLandmark = (gray: Uint8Array, dishCanvasX: number, dishCanvasY: number) => {
      let bestScore = 0;
      let bestX = -1;
      let bestY = -1;
      const margin = LANDMARK_HALF + 14;

      for (let y = margin; y < TRACK_H - margin; y += 4) {
        for (let x = margin; x < TRACK_W - margin; x += 4) {
          const contrast = getPatchContrast(gray, x, y, LANDMARK_HALF);
          if (contrast <= 0) continue;
          // Privilégie les objets proches du plat sur la table (ex: baffle noir à côté)
          const dist = Math.hypot(x - dishCanvasX, y - dishCanvasY);
          const proximityWeight = 1 / (1 + dist * 0.035);
          const score = contrast * proximityWeight;
          if (score > bestScore) {
            bestScore = score;
            bestX = x;
            bestY = y;
          }
        }
      }

      if (bestX !== -1 && bestScore > 180) {
        landmarkRef.current = {
          template: extractPatch(gray, bestX, bestY, LANDMARK_HALF),
          landmarkX: bestX,
          landmarkY: bestY,
          offsetToDishX: dishCanvasX - bestX,
          offsetToDishY: dishCanvasY - bestY,
        };
      }
    };

    const tick = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const viewport = viewportRef.current;

      if (
        video &&
        viewport &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !isDragging.current
      ) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cw = viewport.clientWidth || 360;
        const ch = viewport.clientHeight || 520;

        // Cadrage identique au CSS object-cover de la balise <video>
        const videoAspect = vw / vh;
        const containerAspect = cw / ch;
        let sx = 0;
        let sy = 0;
        let sw = vw;
        let sh = vh;
        if (videoAspect > containerAspect) {
          sw = vh * containerAspect;
          sx = (vw - sw) / 2;
        } else {
          sh = vw / containerAspect;
          sy = (vh - sh) / 2;
        }

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, TRACK_W, TRACK_H);
        const imgData = ctx.getImageData(0, 0, TRACK_W, TRACK_H).data;
        const currGray = new Uint8Array(TRACK_W * TRACK_H);
        for (let i = 0, p = 0; i < currGray.length; i++, p += 4) {
          currGray[i] = (imgData[p] * 77 + imgData[p + 1] * 150 + imgData[p + 2] * 29) >> 8;
        }

        const scaleX = cw / TRACK_W;
        const scaleY = ch / TRACK_H;
        const dishCanvasX = TRACK_W / 2 + posRef.current.x / scaleX;
        const dishCanvasY = TRACK_H / 2 + posRef.current.y / scaleY;

        const prevGray = prevGrayRef.current;
        if (!prevGray) {
          prevGrayRef.current = currGray;
          captureBestLandmark(currGray, dishCanvasX, dishCanvasY);
          rafId = requestAnimationFrame(tick);
          return;
        }

        // --- ÉTAPE A : FLUX OPTIQUE MULTI-BLOCS SUR LES ZONES CONTRASTÉES ---
        const candidates: { x: number; y: number; score: number }[] = [];
        const searchRadius = 7;
        const border = PATCH_HALF + searchRadius + 1;

        for (let gy = border; gy < TRACK_H - border; gy += 11) {
          for (let gx = border; gx < TRACK_W - border; gx += 11) {
            const c = getPatchContrast(prevGray, gx, gy, PATCH_HALF);
            if (c > 220) {
              const dist = Math.hypot(gx - dishCanvasX, gy - dishCanvasY);
              candidates.push({ x: gx, y: gy, score: c / (1 + dist * 0.02) });
            }
          }
        }

        candidates.sort((a, b) => b.score - a.score);
        const topBlocks = candidates.slice(0, 11);

        const dxs: number[] = [];
        const dys: number[] = [];

        for (const blk of topBlocks) {
          let bestSAD = Infinity;
          let bestDx = 0;
          let bestDy = 0;

          for (let sdy = -searchRadius; sdy <= searchRadius; sdy++) {
            for (let sdx = -searchRadius; sdx <= searchRadius; sdx++) {
              let sad = 0;
              for (let py = -PATCH_HALF; py <= PATCH_HALF; py++) {
                const prevRow = (blk.y + py) * TRACK_W + blk.x;
                const currRow = (blk.y + sdy + py) * TRACK_W + (blk.x + sdx);
                for (let px = -PATCH_HALF; px <= PATCH_HALF; px++) {
                  sad += Math.abs(prevGray[prevRow + px] - currGray[currRow + px]);
                }
              }
              // Légère pénalité à distance nulle en cas d'égalité parfaite
              if (sad < bestSAD) {
                bestSAD = sad;
                bestDx = sdx;
                bestDy = sdy;
              }
            }
          }

          const patchArea = (PATCH_HALF * 2 + 1) * (PATCH_HALF * 2 + 1);
          if (bestSAD / patchArea < 18) {
            dxs.push(bestDx);
            dys.push(bestDy);
          }
        }

        let stepCanvasDx = 0;
        let stepCanvasDy = 0;

        if (dxs.length >= 2) {
          dxs.sort((a, b) => a - b);
          dys.sort((a, b) => a - b);
          const mid = Math.floor(dxs.length / 2);
          stepCanvasDx = dxs[mid];
          stepCanvasDy = dys[mid];
        }

        let nextDishCanvasX = dishCanvasX + stepCanvasDx;
        let nextDishCanvasY = dishCanvasY + stepCanvasDy;

        // --- ÉTAPE B : RE-VERROUILLAGE SUR LE REPÈRE VISUEL (LANDMARK) ---
        const lm = landmarkRef.current;
        if (lm) {
          const predX = Math.round(lm.landmarkX + stepCanvasDx);
          const predY = Math.round(lm.landmarkY + stepCanvasDy);
          const lmSearch = 9;
          const lmBorder = LANDMARK_HALF + 1;

          if (
            predX >= lmBorder + lmSearch &&
            predX < TRACK_W - lmBorder - lmSearch &&
            predY >= lmBorder + lmSearch &&
            predY < TRACK_H - lmBorder - lmSearch
          ) {
            let bestLmSAD = Infinity;
            let foundX = predX;
            let foundY = predY;
            const tpl = lm.template;

            for (let sy2 = predY - lmSearch; sy2 <= predY + lmSearch; sy2++) {
              for (let sx2 = predX - lmSearch; sx2 <= predX + lmSearch; sx2++) {
                let sad = 0;
                let k = 0;
                for (let py = -LANDMARK_HALF; py <= LANDMARK_HALF; py++) {
                  const row = (sy2 + py) * TRACK_W + sx2;
                  for (let px = -LANDMARK_HALF; px <= LANDMARK_HALF; px++) {
                    sad += Math.abs(tpl[k++] - currGray[row + px]);
                  }
                }
                if (sad < bestLmSAD) {
                  bestLmSAD = sad;
                  foundX = sx2;
                  foundY = sy2;
                }
              }
            }

            const lmArea = (LANDMARK_HALF * 2 + 1) * (LANDMARK_HALF * 2 + 1);
            if (bestLmSAD / lmArea < 14) {
              lm.landmarkX = foundX;
              lm.landmarkY = foundY;
              const anchorDishX = foundX + lm.offsetToDishX;
              const anchorDishY = foundY + lm.offsetToDishY;
              // Correction douce sans saut vers le repère réel de la table
              nextDishCanvasX = nextDishCanvasX * 0.65 + anchorDishX * 0.35;
              nextDishCanvasY = nextDishCanvasY * 0.65 + anchorDishY * 0.35;
            } else {
              lm.landmarkX += stepCanvasDx;
              lm.landmarkY += stepCanvasDy;
            }
          }
        }

        // Convertit en coordonnées écran (avec bornes de sécurité pour garder le plat visible)
        const rawScreenX = (nextDishCanvasX - TRACK_W / 2) * scaleX;
        const rawScreenY = (nextDishCanvasY - TRACK_H / 2) * scaleY;
        const maxOffsetX = cw * 0.42;
        const maxOffsetY = ch * 0.42;

        const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, rawScreenX));
        const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, rawScreenY));

        if (
          Math.abs(clampedX - posRef.current.x) >= 0.6 ||
          Math.abs(clampedY - posRef.current.y) >= 0.6
        ) {
          updatePos({
            x: Math.round(posRef.current.x * 0.25 + clampedX * 0.75),
            y: Math.round(posRef.current.y * 0.25 + clampedY * 0.75),
          });
        }

        prevGrayRef.current = currGray;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
    };
  }, [isCameraActive, isPinned, updatePos]);

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
    updatePos({ x: 0, y: 35 });
    prevGrayRef.current = null;
    landmarkRef.current = null;
    baselineBetaRef.current = null;
    setScale(officialScale);
    setOrbitTheta(0);
    setBasePhi(66);
    setGyroPhiDelta(0);
  }, [officialScale, updatePos]);

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
      updatePos({ x: 0, y: 35 });
      prevGrayRef.current = null;
      landmarkRef.current = null;
      baselineBetaRef.current = null;
      setScale(officialScale); // Initialise à la taille officielle 1:1 calibrée
      setOrbitTheta(0);
      setBasePhi(66);
      setGyroPhiDelta(0);
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
   * - Fixé sur table (isPinned) : le plat reste ancré visuellement sur la table,
   *   et glisser 1 doigt permet de tourner autour en 3D ou de regarder le plat
   *   par-dessus ("chofou mill fo9") !
   * ==========================================================================
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      isDragging.current = true;
      dragStart.current = {
        x: t.clientX,
        y: t.clientY,
        posX: posRef.current.x,
        posY: posRef.current.y,
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
      } else {
        // Mode placement libre : déplace le plat sur la table
        updatePos({
          x: dragStart.current.posX + dx,
          y: dragStart.current.posY + dy,
        });
      }
    } else if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      const nextScale = Math.min(1.6, Math.max(0.25, pinchStartScale.current * ratio));
      setScale(Number(nextScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    pinchStartDist.current = null;
  };

  const togglePin = () => {
    prevGrayRef.current = null;
    landmarkRef.current = null;
    setIsPinned((prev) => !prev);
  };

  const rotateDish = () => {
    setOrbitTheta((prev) => (prev + 45) % 360);
  };

  const toggleTopDownView = () => {
    setBasePhi((prev) => (prev <= 32 ? 66 : 16));
  };

  const resetToOfficialScale = () => {
    setScale(officialScale);
  };

  const resetPosition = () => {
    prevGrayRef.current = null;
    landmarkRef.current = null;
    updatePos({ x: 0, y: 35 });
    setScale(officialScale);
    setOrbitTheta(0);
    setBasePhi(66);
    setIsPinned(false);
  };

  if (!isOpen) return null;

  // Angle vertical final combinant l'angle choisi et l'inclinaison du téléphone ("mill fo9")
  const effectivePhi = Math.max(12, Math.min(82, basePhi + gyroPhiDelta));
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
                    ? "Réalité Augmentée 1:1 · Levez le tél pour voir du dessus"
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
          ref={viewportRef}
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

          {/* Realistic Contact Shadow on the Table (Centrée sous le plat même en vue de dessus) */}
          {isCameraActive && (
            <div
              className="absolute pointer-events-none"
              style={{
                transform: `translate3d(${pos.x}px, ${
                  pos.y + Math.round((effectivePhi / 70) * 65 * scale)
                }px, 0px) scale(${scale})`,
                width: "230px",
                height: effectivePhi < 35 ? "185px" : "95px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.24) 48%, rgba(0,0,0,0) 72%)",
                transition: isDragging.current ? "none" : "transform 0.05s linear, height 0.2s ease",
                zIndex: 5,
              }}
            />
          )}

          {/* 3D Food Model Container */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: isCameraActive
                ? `translate3d(${pos.x}px, ${pos.y}px, 0px) scale(${scale})`
                : "none",
              transition: isDragging.current ? "none" : "transform 0.05s linear",
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
              interpolation-decay="100"
              bounds="tight"
              min-camera-orbit="auto 0deg auto"
              max-camera-orbit="auto 88deg auto"
              exposure="1.2"
              shadow-intensity={isCameraActive ? "1.8" : "1.2"}
              shadow-softness="0.6"
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

          {/* Top HUD Bar in Camera Mode (Compact pour ne jamais couper les boutons à droite) */}
          {isCameraActive && (
            <div className="absolute top-3 left-2.5 right-2.5 z-30 flex items-center justify-between gap-1.5 pointer-events-none">
              <div
                className={`flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-full text-[11px] font-semibold border shadow-lg max-w-[54%] ${
                  isPinned
                    ? "bg-emerald-950/90 border-emerald-400 text-emerald-100"
                    : "bg-black/75 border-white/20 text-white"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isPinned ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  }`}
                />
                <span className="truncate">
                  {isPinned ? "Fixé sur table ✅" : "Glissez sur la table"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                {/* Bouton Vue de Dessus ("Chofou mill fo9") / Vue Table */}
                <button
                  type="button"
                  onClick={toggleTopDownView}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md flex items-center gap-1 transition-all active:scale-95 ${
                    effectivePhi <= 32
                      ? "bg-amber-500 text-black border-amber-300"
                      : "bg-black/75 hover:bg-black/90 text-white border-white/25"
                  }`}
                  title="Basculer entre Vue de Dessus et Vue sur Table"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>{effectivePhi <= 32 ? "Vue Dessus" : "Vue Table"}</span>
                </button>

                <button
                  type="button"
                  onClick={resetPosition}
                  className="p-2 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/25 shadow-md transition-transform active:scale-90"
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
                  onClick={() => setScale((s) => Math.max(0.25, Number((s - 0.05).toFixed(2))))}
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
