/**
 * Custom WebXR "place on table" experience (three.js loaded lazily from esm.sh).
 *
 * Guarantees the food is ALWAYS visible from second 1:
 * - Before tap: follows the camera view or surface reticle so the user immediately sees the dish.
 * - On tap: locks (anchors) the dish firmly on the table in 6DoF space so the user can walk around it.
 */

const THREE_URL = "https://esm.sh/three@0.160.0";
const GLTF_URL = "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

interface StartTableAROptions {
  modelUrl: string;
  title: string;
  log: (message: string) => void;
  onEnd: () => void;
}

const assetCache = new Map<string, Promise<{ THREE: any; gltf: any }>>();

export function prepareTableAR(modelUrl: string): Promise<{ THREE: any; gltf: any }> {
  let cached = assetCache.get(modelUrl);
  if (!cached) {
    cached = (async () => {
      const THREE: any = await import(/* webpackIgnore: true */ THREE_URL);
      const { GLTFLoader }: any = await import(/* webpackIgnore: true */ GLTF_URL);
      const gltf: any = await new Promise((resolve, reject) => {
        new GLTFLoader().load(modelUrl, resolve, undefined, (e: any) =>
          reject(new Error(`Modèle illisible: ${e?.message || e}`))
        );
      });
      return { THREE, gltf };
    })();
    cached.catch(() => assetCache.delete(modelUrl));
    assetCache.set(modelUrl, cached);
  }
  return cached;
}

export async function startTableAR({ modelUrl, title, log, onEnd }: StartTableAROptions): Promise<void> {
  const xr = (navigator as any).xr;
  if (!xr) throw new Error("navigator.xr absent (WebXR non exposé par ce navigateur)");

  log("Chargement du moteur 3D et du modèle...");
  const { THREE, gltf: loaded } = await prepareTableAR(modelUrl);
  // Clone so the cached GLB can be reused across sessions
  const gltf = { scene: loaded.scene.clone(true) };
  log("Modèle prêt ✅ — démarrage de la session AR...");

  // ---------- DOM overlay (status + controls) ----------
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;color:#fff;";
  overlay.innerHTML = `
    <button data-act="close" style="pointer-events:auto;position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.4)">✕</button>
    <div data-role="status" style="position:absolute;top:18px;left:16px;right:76px;padding:12px 16px;border-radius:18px;background:rgba(0,0,0,.75);font-size:13px;font-weight:600;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,.4);backdrop-filter:blur(8px)">Initialisation...</div>
    <div style="pointer-events:auto;position:absolute;bottom:85px;left:0;right:0;display:flex;gap:12px;justify-content:center;align-items:center;padding:0 16px">
      <button data-act="smaller" style="width:50px;height:50px;border-radius:50%;border:0;background:rgba(0,0,0,.75);color:#fff;font-size:26px;box-shadow:0 4px 12px rgba(0,0,0,.4);backdrop-filter:blur(8px)">−</button>
      <button data-act="pin" data-role="pin-btn" style="padding:0 20px;height:50px;border-radius:25px;border:0;background:#B55234;color:#fff;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(181,82,52,.6)">📍 Fixer sur table</button>
      <button data-act="rotate" style="padding:0 16px;height:50px;border-radius:25px;border:0;background:rgba(0,0,0,.75);color:#fff;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.4);backdrop-filter:blur(8px)">⟳ Tourner</button>
      <button data-act="bigger" style="width:50px;height:50px;border-radius:50%;border:0;background:rgba(0,0,0,.75);color:#fff;font-size:26px;box-shadow:0 4px 12px rgba(0,0,0,.4);backdrop-filter:blur(8px)">+</button>
    </div>`;
  document.body.appendChild(overlay);

  const statusEl = overlay.querySelector('[data-role="status"]') as HTMLElement;
  const pinBtn = overlay.querySelector('[data-role="pin-btn"]') as HTMLElement;
  const setStatus = (text: string) => {
    statusEl.textContent = text;
  };
  overlay.addEventListener("beforexrselect", (e) => e.preventDefault());

  // ---------- three.js scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.cssText = "position:fixed;inset:0;z-index:2147483000;";
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

  // Bright, appetizing lighting
  scene.add(new THREE.AmbientLight(0xffffff, 2.5));
  const sun1 = new THREE.DirectionalLight(0xffffff, 2.5);
  sun1.position.set(1, 4, 2);
  scene.add(sun1);
  const sun2 = new THREE.DirectionalLight(0xffffff, 1.5);
  sun2.position.set(-1, 2, -1);
  scene.add(sun2);

  // Visible green target reticle for surfaces
  const reticle = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.10, 0.13, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide })
  );
  const centerDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.02, 16).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide })
  );
  reticle.add(ring);
  reticle.add(centerDot);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Food Model setup
  const dish = gltf.scene;
  // Ensure all mesh parts are double-sided and well-lit
  dish.traverse((child: any) => {
    if (child.isMesh && child.material) {
      child.material.side = THREE.DoubleSide;
      child.material.needsUpdate = true;
    }
  });

  // Calculate actual bounding box to normalize scale if needed
  const initialBox = new THREE.Box3().setFromObject(dish);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
  // Default ideal plate size ~ 28cm
  let baseScale = maxDim > 0 ? (0.28 / maxDim) : 1;
  let userScaleMult = 1.0;
  dish.scale.setScalar(baseScale * userScaleMult);

  // Dish is VISIBLE from frame 1
  dish.visible = true;
  scene.add(dish);

  // ---------- XR session ----------
  let session: any;
  try {
    session = await xr.requestSession("immersive-ar", {
      optionalFeatures: ["hit-test", "dom-overlay", "local-floor"],
      domOverlay: { root: overlay },
    });
  } catch (err: any) {
    renderer.dispose();
    renderer.domElement.remove();
    overlay.remove();
    throw new Error(`Session AR refusée: ${err?.message || err}`);
  }
  log("Session WebXR démarrée ✅");

  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  let hitTestSource: any = null;
  let hitTestRequested = false;
  let hasEverHit = false;
  let placed = false;

  setStatus("Visez votre table et touchez pour déposer le plat !");

  const rotateStep = Math.PI / 6;
  const onControlClick = (e: Event) => {
    const act = (e.target as HTMLElement)?.getAttribute("data-act");
    if (act === "close") session.end();
    if (act === "bigger") {
      userScaleMult = Math.min(3.0, userScaleMult * 1.15);
      dish.scale.setScalar(baseScale * userScaleMult);
    }
    if (act === "smaller") {
      userScaleMult = Math.max(0.3, userScaleMult / 1.15);
      dish.scale.setScalar(baseScale * userScaleMult);
    }
    if (act === "rotate") {
      dish.rotation.y += rotateStep;
    }
    if (act === "pin") {
      placed = !placed;
      if (placed) {
        pinBtn.textContent = "🔓 Déplacer";
        pinBtn.style.background = "#15803d";
        setStatus("Plat fixé sur la table ✅ — Tournez autour pour admirer !");
        log("Plat fixé sur la table ✅");
      } else {
        pinBtn.textContent = "📍 Fixer sur table";
        pinBtn.style.background = "#B55234";
        setStatus("Déplacez le téléphone vers la table puis cliquez Fixer.");
      }
    }
  };
  overlay.addEventListener("click", onControlClick);

  // Tap on screen to fix/place dish
  session.addEventListener("select", () => {
    placed = true;
    pinBtn.textContent = "🔓 Déplacer";
    pinBtn.style.background = "#15803d";
    setStatus("Plat fixé sur la table ✅ — Tournez autour pour admirer !");
    log("Plat fixé sur la table ✅");
  });

  session.addEventListener("end", () => {
    renderer.setAnimationLoop(null);
    hitTestSource?.cancel?.();
    renderer.dispose();
    renderer.domElement.remove();
    overlay.remove();
    log("Session AR terminée");
    onEnd();
  });

  // Main AR Render Loop
  renderer.setAnimationLoop((_time: number, frame: any) => {
    if (frame) {
      const refSpace = renderer.xr.getReferenceSpace();

      // Request hit-test source once
      if (!hitTestRequested) {
        hitTestRequested = true;
        session
          .requestReferenceSpace("viewer")
          .then((viewerSpace: any) => session.requestHitTestSource({ space: viewerSpace }))
          .then((src: any) => {
            hitTestSource = src;
            log("Détection de table (hit-test) active ✅");
          })
          .catch((err: any) => log(`❌ hit-test indisponible: ${err?.message || err}`));
      }

      // Check hit-test surface results
      let foundSurface = false;
      if (hitTestSource) {
        const results = frame.getHitTestResults(hitTestSource);
        if (results.length > 0) {
          const pose = results[0].getPose(refSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            foundSurface = true;
            if (!hasEverHit) {
              hasEverHit = true;
              log("Surface de table détectée ✅");
            }
          }
        } else {
          reticle.visible = false;
        }
      }

      // If dish is NOT yet pinned by user:
      // Keep it smoothly following either the detected table surface or the camera sightline!
      if (!placed) {
        if (foundSurface && reticle.visible) {
          // Snap directly on top of the physical table surface
          dish.position.setFromMatrixPosition(reticle.matrix);
          setStatus(`Table détectée ✅ — Touchez l'écran pour fixer « ${title} »`);
        } else {
          // Follow the camera sightline directly at comfortable table distance (0.7m)
          const xrCam = renderer.xr.getCamera();
          const camPos = new THREE.Vector3();
          const camQuat = new THREE.Quaternion();
          xrCam.getWorldPosition(camPos);
          xrCam.getWorldQuaternion(camQuat);
          // Direction the user is looking (takes full pitch into account!)
          const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat).normalize();
          dish.position.copy(camPos).addScaledVector(lookDir, 0.70);
          setStatus("Visez votre table et touchez pour déposer le plat !");
        }
      }
    }

    renderer.render(scene, camera);
  });
}
