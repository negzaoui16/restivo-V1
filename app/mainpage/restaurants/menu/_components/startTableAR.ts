/**
 * Custom WebXR "place on table" experience (three.js loaded lazily from esm.sh).
 *
 * Why not only <model-viewer>? It gives no feedback when ARCore plane detection
 * is slow/unavailable, so the user sees the camera but never the dish.
 * This viewer shows live status messages, a reticle on the detected surface,
 * and falls back to placing the dish ~1 m in front of the camera when no
 * surface is detected (ARCore 6DoF tracking keeps it anchored in the room).
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

/**
 * Pre-loads three.js and the GLB so that the later click -> requestSession()
 * happens within the browser's short "user activation" window.
 */
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
  // Clone so the cached GLB can be reused for several sessions
  const gltf = { scene: loaded.scene.clone(true) };
  log("Modèle prêt ✅ — démarrage de la session AR...");

  // ---------- DOM overlay (status + controls) ----------
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:system-ui,sans-serif;color:#fff;";
  overlay.innerHTML = `
    <button data-act="close" style="pointer-events:auto;position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:22px">✕</button>
    <div data-role="status" style="position:absolute;top:18px;left:14px;right:70px;padding:10px 14px;border-radius:16px;background:rgba(0,0,0,.65);font-size:13px;line-height:1.35">Initialisation...</div>
    <div style="pointer-events:auto;position:absolute;bottom:22px;left:0;right:0;display:flex;gap:10px;justify-content:center">
      <button data-act="smaller" style="width:52px;height:52px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:26px">−</button>
      <button data-act="rotate" style="padding:0 18px;height:52px;border-radius:26px;border:0;background:rgba(181,82,52,.95);color:#fff;font-size:14px;font-weight:700">⟳ Tourner</button>
      <button data-act="bigger" style="width:52px;height:52px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:26px">+</button>
    </div>`;
  document.body.appendChild(overlay);
  const statusEl = overlay.querySelector('[data-role="status"]') as HTMLElement;
  const setStatus = (text: string) => {
    statusEl.textContent = text;
  };
  // Taps on the overlay controls must not place the dish
  overlay.addEventListener("beforexrselect", (e) => e.preventDefault());

  // ---------- three.js scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.cssText = "position:fixed;inset:0;z-index:2147483000;";
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(1, 3, 2);
  scene.add(sun);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 36).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const dish = gltf.scene;
  dish.visible = false;
  scene.add(dish);
  let dishScale = 1;

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
  const startedAt = performance.now();
  let placed = false;

  setStatus("Bougez lentement le téléphone pour scanner la table...");

  const rotateStep = Math.PI / 6;
  const onControlClick = (e: Event) => {
    const act = (e.target as HTMLElement)?.getAttribute("data-act");
    if (act === "close") session.end();
    if (act === "bigger") dishScale = Math.min(3, dishScale * 1.15);
    if (act === "smaller") dishScale = Math.max(0.3, dishScale / 1.15);
    if (act === "rotate") dish.rotation.y += rotateStep;
    dish.scale.setScalar(dishScale);
  };
  overlay.addEventListener("click", onControlClick);

  session.addEventListener("select", () => {
    if (reticle.visible) {
      dish.position.setFromMatrixPosition(reticle.matrix);
      log("Plat posé sur la surface détectée ✅");
    } else {
      // Fallback: 1 m ahead of the camera, ~45 cm below it
      const xrCam = renderer.xr.getCamera();
      const pos = new THREE.Vector3().setFromMatrixPosition(xrCam.matrixWorld);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
        new THREE.Quaternion().setFromRotationMatrix(xrCam.matrixWorld)
      );
      dir.y = 0;
      dir.normalize();
      dish.position.set(pos.x + dir.x * 1.0, pos.y - 0.45, pos.z + dir.z * 1.0);
      log("Plat posé devant vous (aucune surface détectée)");
    }
    dish.scale.setScalar(dishScale);
    dish.visible = true;
    placed = true;
    setStatus("Plat posé ✅ — touchez ailleurs pour le déplacer, ⟳ pour tourner, ± pour la taille.");
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

  renderer.setAnimationLoop((_time: number, frame: any) => {
    if (frame) {
      const refSpace = renderer.xr.getReferenceSpace();

      if (!hitTestRequested) {
        hitTestRequested = true;
        session
          .requestReferenceSpace("viewer")
          .then((viewerSpace: any) => session.requestHitTestSource({ space: viewerSpace }))
          .then((src: any) => {
            hitTestSource = src;
            log("Détection de surface (hit-test) active ✅");
          })
          .catch((err: any) => log(`❌ hit-test indisponible: ${err?.message || err}`));
      }

      if (hitTestSource) {
        const results = frame.getHitTestResults(hitTestSource);
        if (results.length > 0) {
          const pose = results[0].getPose(refSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            if (!hasEverHit) {
              hasEverHit = true;
              log("Surface détectée ✅");
            }
            if (!placed) setStatus(`Table détectée ✅ — touchez l'écran pour poser « ${title} ».`);
          }
        } else {
          reticle.visible = false;
        }
      }

      if (!placed && !hasEverHit && performance.now() - startedAt > 6000) {
        setStatus("Surface non détectée. Touchez l'écran pour poser le plat devant vous.");
      }
    }
    renderer.render(scene, camera);
  });
}
