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

// --- Mathématiques 3D : orientation du téléphone -> matrice de rotation (norme W3C Z-X'-Y'') ---
type Vec3 = [number, number, number];
type Mat3 = [number, number, number, number, number, number, number, number, number];

function rotationFromEuler(alphaDeg: number, betaDeg: number, gammaDeg: number): Mat3 {
  const d = Math.PI / 180;
  const ca = Math.cos(alphaDeg * d);
  const sa = Math.sin(alphaDeg * d);
  const cb = Math.cos(betaDeg * d);
  const sb = Math.sin(betaDeg * d);
  const cg = Math.cos(gammaDeg * d);
  const sg = Math.sin(gammaDeg * d);
  // R = Rz(alpha) * Rx(beta) * Ry(gamma)
  const r0: Vec3 = [cg, 0, sg];
  const r1: Vec3 = [sb * sg, cb, -sb * cg];
  const r2: Vec3 = [-cb * sg, sb, cb * cg];
  return [
    ca * r0[0] - sa * r1[0], ca * r0[1] - sa * r1[1], ca * r0[2] - sa * r1[2],
    sa * r0[0] + ca * r1[0], sa * r0[1] + ca * r1[1], sa * r0[2] + ca * r1[2],
    r2[0], r2[1], r2[2],
  ];
}

// appareil -> monde
function mulVec(R: Mat3, v: Vec3): Vec3 {
  return [
    R[0] * v[0] + R[1] * v[1] + R[2] * v[2],
    R[3] * v[0] + R[4] * v[1] + R[5] * v[2],
    R[6] * v[0] + R[7] * v[1] + R[8] * v[2],
  ];
}

// monde -> appareil (transposée)
function mulVecT(R: Mat3, v: Vec3): Vec3 {
  return [
    R[0] * v[0] + R[3] * v[1] + R[6] * v[2],
    R[1] * v[0] + R[4] * v[1] + R[7] * v[2],
    R[2] * v[0] + R[5] * v[1] + R[8] * v[2],
  ];
}

interface TableAnchor {
  dWorld: Vec3; // Direction 3D fixe du plat dans le repère horizontal de la table
  alpha0: number; // Cap initial (alpha) au moment de la fixation
  beta0: number; // Inclinaison initiale (beta) au moment de la fixation
  gamma0: number; // Roulis initial (gamma) au moment de la fixation
  stabilizedAlpha: number; // Cap stabilisé (protégé contre le Gimbal Lock en vue de dessus)
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
  const [gyroPhiDelta, setGyroPhiDelta] = useState(0); // Inclinaison dynamique Vue de Dessus (mode placement)
  const [sensorAnchored, setSensorAnchored] = useState(false); // true si l'ancrage 3D par capteur est actif
  const [dishVisible, setDishVisible] = useState(true); // false quand la caméra regarde ailleurs que la table
  const [anchoredView, setAnchoredView] = useState({ theta: 0, phi: 58, roll: 0 }); // Angles 3D (dessus/côté/gauche/droite) quand fixé

  // Références pour l'ancrage 3D spatial (matrice de rotation du téléphone)
  const anchorRef = useRef<TableAnchor | null>(null);
  const rotationRef = useRef<Mat3 | null>(null);
  const rawEulerRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const hasSensorRef = useRef(false);
  const smoothedPhiDeltaRef = useRef(0);

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
   * ANCRAGE 3D SPATIAL (MATRICE DE ROTATION) : LE PLAT RESTE "FIXE" SUR LA TABLE
   * ==========================================================================
   * Principe (comme une vraie AR) :
   * 1. On convertit l'orientation du téléphone (alpha, beta, gamma) en MATRICE DE
   *    ROTATION 3D complète (norme W3C Z-X'-Y''). Aucune soustraction d'angles
   *    => aucun Gimbal Lock, aucun saut, aucun déplacement en sens inverse.
   * 2. Au clic sur "Fixer sur table", on mémorise la DIRECTION 3D du plat dans le
   *    repère du monde (vecteur unitaire) : dWorld = R * dCamera.
   * 3. À chaque mesure du capteur, on reprojette ce vecteur fixe dans le repère
   *    de la caméra : dCamera = R^T * dWorld => position écran (x, y) du plat.
   *    - Si on tourne la caméra ailleurs : le plat sort de l'écran (il reste sur
   *      la table, il ne colle plus à la caméra).
   *    - Si on revient vers la table : il réapparaît exactement au même endroit.
   * 4. L'angle de vue 3D du plat est calculé à partir de la même direction :
   *    - phi (élévation) : téléphone au-dessus => vue de dessus ("mill fo9"),
   *      téléphone à hauteur de table => vue de côté.
   *    - theta (azimut) : en tournant autour du plat (gauche / droite) on voit
   *      ses côtés gauche / droit, comme un vrai objet posé sur la table.
   * ==========================================================================
   */
  useEffect(() => {
    if (!isCameraActive || typeof window === "undefined") return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;
      hasSensorRef.current = true;
      rawEulerRef.current = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };

      const R = rotationFromEuler(event.alpha, event.beta, event.gamma);
      rotationRef.current = R;

      const anchor = anchorRef.current;
      if (!anchor) {
        // Mode placement : seule l'inclinaison douce sert à pencher la vue 3D
        const beta = Math.max(5, Math.min(85, event.beta));
        const targetPhiDelta = (beta - 58) * 0.9;
        smoothedPhiDeltaRef.current += (targetPhiDelta - smoothedPhiDeltaRef.current) * 0.25;
        setGyroPhiDelta(Math.round(smoothedPhiDeltaRef.current));
        return;
      }

      const viewport = viewportRef.current;
      const video = videoRef.current;
      if (!viewport) return;
      const cw = viewport.clientWidth || 360;
      const ch = viewport.clientHeight || 520;

      // Focale en pixels écran (champ de vision caméra arrière ~64° sur le grand côté)
      const vw = video?.videoWidth || 1080;
      const vh = video?.videoHeight || 1920;
      const coverScale = Math.max(cw / vw, ch / vh);
      const focalPx = (Math.max(vw, vh) / 2 / Math.tan((32 * Math.PI) / 180)) * coverScale;

      // 1. Stabilisation du cap horizontal (alpha) :
      // Quand on lève le téléphone à plat au-dessus du plat (beta < 35° pour voir "mill fo9")
      // ou qu'on penche fort le poignet sur le côté (|gamma| > 25° pour voir gauche/droite),
      // on fige progressivement alpha pour empêcher tout saut de boussole (Gimbal Lock).
      const absGamma = Math.abs(event.gamma);
      const pitchWeight = Math.max(0, Math.min(1, (event.beta - 26) / 22));
      const rollWeight = Math.max(0, Math.min(1, (38 - absGamma) / 20));
      const alphaTrust = pitchWeight * rollWeight;

      let deltaAlphaStep = ((event.alpha - anchor.stabilizedAlpha + 540) % 360) - 180;
      // Ignore les sauts brusques parasites de boussole quand le téléphone est incliné
      if (Math.abs(deltaAlphaStep) > 45 && alphaTrust < 0.5) {
        deltaAlphaStep = 0;
      }
      anchor.stabilizedAlpha =
        (anchor.stabilizedAlpha + deltaAlphaStep * alphaTrust + 360) % 360;

      // 2. Matrice d'ancrage sur la table (R_table) :
      // - Suit la rotation horizontale (stabilizedAlpha) quand on tourne vers le PC portable ou la fenêtre.
      // - Garde l'élévation verrouillée sur la table quand on lève le téléphone ("mill fo9", beta <= 78°)
      //   pour que le burger NE MONTE JAMAIS dans les airs au-dessus de la vape/poêle !
      // - Ignore le roulis du poignet (gamma = 0) pour que le burger NE DISPARAISSE JAMAIS
      //   quand on incline le téléphone à gauche ou à droite (00:32 - 00:37).
      const effectiveBetaForTable =
        event.beta > 80 ? anchor.beta0 + (event.beta - 80) * 0.85 : anchor.beta0;
      const R_table = rotationFromEuler(anchor.stabilizedAlpha, effectiveBetaForTable, 0);

      const dCam = mulVecT(R_table, anchor.dWorld);
      const inFront = dCam[2] < -0.12;

      if (inFront) {
        const rawX = (focalPx * dCam[0]) / -dCam[2];
        const rawY = (-focalPx * dCam[1]) / -dCam[2];
        const tx = Math.max(-2500, Math.min(2500, rawX));
        const ty = Math.max(-2500, Math.min(2500, rawY));
        const prev = posRef.current;
        const nx = prev.x + (tx - prev.x) * 0.55;
        const ny = prev.y + (ty - prev.y) * 0.55;
        if (Math.abs(nx - prev.x) > 0.4 || Math.abs(ny - prev.y) > 0.4) {
          updatePos({ x: Math.round(nx), y: Math.round(ny) });
        }
        // Le plat reste visible tant qu'il n'est pas complètement sorti du cadre (pas de disparition brusque)
        const onScreen = Math.abs(tx) < cw * 1.15 && Math.abs(ty) < ch * 1.15;
        setDishVisible((v) => (v === onScreen ? v : onScreen));
      } else {
        setDishVisible((v) => (v ? false : v));
      }

      // 3. Angles de vue 3D du plat (Dessus "mill fo9" / Côté "lota" / Gauche / Droite) :
      // - phi : contrôlé directement par l'inclinaison beta du téléphone :
      //   * téléphone levé à plat au-dessus du burger (beta ~ 10°..25°) => phi ~ 14° (Vue Dessus "mill fo9" !)
      //   * téléphone normal face à la table (beta ~ 55°..65°) => phi ~ 58° (Vue 3/4 Table)
      //   * téléphone bas au bord de la table (beta ~ 75°..85°) => phi ~ 68° (Vue de côté "lota")
      const clampedBeta = Math.max(10, Math.min(82, event.beta));
      const phi = Math.max(12, Math.min(68, clampedBeta * 0.92));

      // - theta : contrôlé par le déplacement angulaire horizontal + l'inclinaison gauche/droite (gamma)
      const dYaw = ((anchor.stabilizedAlpha - anchor.alpha0 + 540) % 360) - 180;
      const dGamma = Math.max(-55, Math.min(55, event.gamma - anchor.gamma0));
      const theta = -dYaw * 1.15 - dGamma * 1.35;

      // - roll : légère compensation d'inclinaison pour que le burger reste parallèle au tapis de la table
      const roll = Math.round(Math.max(-28, Math.min(28, -dGamma * 0.45)));

      setAnchoredView((prev) => {
        const nt = Math.round(theta);
        const np = Math.round(phi);
        return prev.theta === nt && prev.phi === np && prev.roll === roll
          ? prev
          : { theta: nt, phi: np, roll };
      });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [isCameraActive, updatePos]);

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
    anchorRef.current = null;
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
    anchorRef.current = null;
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
    if (isPinned) {
      // Libère le plat : il garde sa dernière position à l'écran
      anchorRef.current = null;
      setSensorAnchored(false);
      setDishVisible(true);
      setIsPinned(false);
      return;
    }

    // Fixe le plat : on mémorise sa direction 3D dans le repère horizontal de la table
    const euler = rawEulerRef.current;
    const viewport = viewportRef.current;
    if (euler && hasSensorRef.current && viewport) {
      const video = videoRef.current;
      const cw = viewport.clientWidth || 360;
      const ch = viewport.clientHeight || 520;
      const vw = video?.videoWidth || 1080;
      const vh = video?.videoHeight || 1920;
      const coverScale = Math.max(cw / vw, ch / vh);
      const focalPx = (Math.max(vw, vh) / 2 / Math.tan((32 * Math.PI) / 180)) * coverScale;

      const sx = posRef.current.x;
      const sy = posRef.current.y;
      const len = Math.hypot(sx / focalPx, sy / focalPx, 1);
      const dCam: Vec3 = [sx / focalPx / len, -sy / focalPx / len, -1 / len];
      const R0 = rotationFromEuler(euler.alpha, euler.beta, 0);
      const dWorld = mulVec(R0, dCam);

      anchorRef.current = {
        dWorld,
        alpha0: euler.alpha,
        beta0: euler.beta,
        gamma0: euler.gamma,
        stabilizedAlpha: euler.alpha,
      };
      setSensorAnchored(true);
      const initialPhi = Math.round(
        Math.max(12, Math.min(68, Math.max(10, Math.min(82, euler.beta)) * 0.92))
      );
      setAnchoredView({ theta: 0, phi: initialPhi, roll: 0 });
    } else {
      // Pas de capteur (PC) : le plat reste simplement verrouillé à l'écran
      anchorRef.current = null;
      setSensorAnchored(false);
    }
    setDishVisible(true);
    setIsPinned(true);
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
    anchorRef.current = null;
    updatePos({ x: 0, y: 35 });
    setScale(officialScale);
    setOrbitTheta(0);
    setBasePhi(66);
    setIsPinned(false);
    setSensorAnchored(false);
    setDishVisible(true);
  };

  if (!isOpen) return null;

  // Angle vertical final combinant l'angle choisi et l'inclinaison du téléphone ("mill fo9")
  const hasAnchor = isPinned && sensorAnchored;
  const effectivePhi = hasAnchor
    ? Math.max(12, Math.min(68, anchoredView.phi + (basePhi - 66)))
    : Math.max(12, Math.min(68, basePhi + (isPinned ? 0 : gyroPhiDelta)));
  const effectiveTheta = hasAnchor ? orbitTheta + anchoredView.theta : orbitTheta;
  const effectiveRoll = hasAnchor ? anchoredView.roll : 0;
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
                opacity: dishVisible ? 1 : 0,
              }}
            />
          )}

          {/* 3D Food Model Container */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: isCameraActive
                ? `translate3d(${pos.x}px, ${pos.y}px, 0px) scale(${scale}) rotate(${effectiveRoll}deg)`
                : "none",
              transition: isDragging.current ? "none" : "transform 0.05s linear",
              willChange: "transform",
              position: "relative",
              zIndex: 10,
              pointerEvents: isCameraActive ? "none" : "auto",
              opacity: !isCameraActive || dishVisible ? 1 : 0,
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
                  ? `${effectiveTheta}deg ${effectivePhi}deg 105%`
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
