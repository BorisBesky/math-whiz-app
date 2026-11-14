import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Generated (ComfyUI text-to-3D) accessory GLBs: loaded raw and cached per URL,
// then fitted or custom-tailored onto a generated character using the anchors
// in generatedFits.js. Kept free of React so it can be exercised outside the app.
const accessoryCache = new Map();

export const loadAccessoryModel = (url) => {
  if (!accessoryCache.has(url)) {
    accessoryCache.set(url, new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene));
  }
  return accessoryCache.get(url);
};

const METALLIC_ITEMS = new Set([
  "buddy-medal",
  "milo-medal",
  "leo-medal",
  "milo-wrench",
  "milo-magnet",
  "milo-rocket-boots",
  "rocket-pack",
  "mia-tiara",
]);

// Subtle color multipliers for raw GLBs whose baked textures were washed out
const MATERIAL_TINTS = {
  "buddy-backpack": "#fde047",
  "buddy-straw-hat": "#fef08a",
  "milo-hard-hat": "#facc15",
  "leo-backpack": "#93c5fd",
  "quiz-book": "#60a5fa",
  "heart-necklace": "#f472b6",
};

// Geometry stays shared with the cache unless deformed; materials are per
// instance and tuned so TRELLIS PBR metalness maps don't wash out under the
// viewer's bright RoomEnvironment + 3-point lighting.
const cloneWithOwnMaterials = (source, itemId, { cloneGeometry = false } = {}) => {
  const isMetallic = METALLIC_ITEMS.has(itemId);
  const tintHex = MATERIAL_TINTS[itemId];
  const clone = source.clone(true);
  clone.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (cloneGeometry && child.geometry) {
      child.geometry = child.geometry.clone();
      child.geometry.userData = {
        ...child.geometry.userData,
        willowFaceInstance: true,
      };
    }
    if (child.material) {
      const mat = child.material.clone();
      mat.metalnessMap = null;
      mat.roughnessMap = null;
      if (isMetallic) {
        mat.metalness = 0.32;
        mat.roughness = 0.38;
        mat.envMapIntensity = 0.65;
      } else {
        mat.metalness = 0.04;
        mat.roughness = 0.78;
        mat.envMapIntensity = 0.3;
      }
      if (tintHex && mat.color) {
        mat.color.set(tintHex);
      }
      mat.needsUpdate = true;
      child.material = mat;
    }
  });
  return clone;
};

const markDisposableGeo = (geo) => {
  geo.userData.willowFaceInstance = true;
  return geo;
};

const makeStdMat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    envMapIntensity: opts.envMapIntensity ?? 0.3,
    side: opts.side ?? THREE.FrontSide,
    map: opts.map ?? null,
  });

const makeCanvasTexture = (drawFn, width = 256, height = 256) => {
  if (
    typeof document === "undefined" ||
    (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || ""))
  ) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
};

// Builds a smooth lofted tube/garment mesh from an array of cross-section rings.
const buildLoftedGarment = (rings, radialSegments = 48, closedTop = false, closedBottom = false) => {
  const positions = [];
  const uvs = [];
  const indices = [];
  const rowCount = rings.length;

  for (let r = 0; r < rowCount; r++) {
    const {
      y,
      cx = 0,
      cz = 0,
      rx,
      rz,
      waveAmp = 0,
      waveFreq = 10,
      frontBulge = 0,
      backBulge = 0,
    } = rings[r];
    const v = r / Math.max(rowCount - 1, 1);
    for (let s = 0; s <= radialSegments; s++) {
      const u = s / radialSegments;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const wave = waveAmp ? Math.sin(theta * waveFreq) * waveAmp : 0;
      const extraZ = cosT > 0 ? cosT * frontBulge : -cosT * backBulge;
      const x = cx + (rx + wave) * sinT;
      const z = cz + (rz + wave + extraZ) * cosT;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  for (let r = 0; r < rowCount - 1; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = r * stride + s;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  if (closedTop && rowCount > 0) {
    const topRing = rings[rowCount - 1];
    const centerIdx = positions.length / 3;
    positions.push(topRing.cx || 0, topRing.y, topRing.cz || 0);
    uvs.push(0.5, 1);
    const base = (rowCount - 1) * stride;
    for (let s = 0; s < radialSegments; s++) {
      indices.push(base + s, base + s + 1, centerIdx);
    }
  }

  if (closedBottom && rowCount > 0) {
    const botRing = rings[0];
    const centerIdx = positions.length / 3;
    positions.push(botRing.cx || 0, botRing.y, botRing.cz || 0);
    uvs.push(0.5, 0);
    for (let s = 0; s < radialSegments; s++) {
      indices.push(s + 1, s, centerIdx);
    }
  }

  const geo = markDisposableGeo(new THREE.BufferGeometry());
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

// Builds an angular-arc surface patch (e.g. front bib, back bib, or draped cape)
// parameterized by v in [0..1] (bottom to top) and u in [0..1] (angle0 to angle1).
const buildArcPanel = (rows, segsU = 32, thickness = 0.018) => {
  const positions = [];
  const uvs = [];
  const indices = [];
  const rowCount = rows.length;
  const stride = segsU + 1;

  for (let side = 0; side < 2; side++) {
    const normalSign = side === 0 ? 1 : -1;
    const offsetR = side === 0 ? thickness / 2 : -thickness / 2;
    for (let r = 0; r < rowCount; r++) {
      const { y, cx = 0, cz = 0, rx, rz, angle0, angle1, waveAmp = 0, waveFreq = 6 } = rows[r];
      const v = r / Math.max(rowCount - 1, 1);
      for (let s = 0; s <= segsU; s++) {
        const u = s / segsU;
        const theta = angle0 + (angle1 - angle0) * u;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        const edgeFade = Math.sin(u * Math.PI);
        const wave = waveAmp ? Math.sin(u * Math.PI * waveFreq) * waveAmp * edgeFade : 0;
        const x = cx + (rx + offsetR + wave) * sinT;
        const z = cz + (rz + offsetR + wave) * cosT;
        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }
    const baseOffset = side * rowCount * stride;
    for (let r = 0; r < rowCount - 1; r++) {
      for (let s = 0; s < segsU; s++) {
        const a = baseOffset + r * stride + s;
        const b = a + stride;
        const c = b + 1;
        const d = a + 1;
        if (normalSign > 0) {
          indices.push(a, b, d, b, c, d);
        } else {
          indices.push(a, d, b, b, d, c);
        }
      }
    }
  }

  const frontBase = 0;
  const backBase = rowCount * stride;
  for (let r = 0; r < rowCount - 1; r++) {
    const fl0 = frontBase + r * stride;
    const fl1 = fl0 + stride;
    const bl0 = backBase + r * stride;
    const bl1 = bl0 + stride;
    indices.push(fl0, bl0, fl1, bl0, bl1, fl1);
    const fr0 = frontBase + r * stride + segsU;
    const fr1 = fr0 + stride;
    const br0 = backBase + r * stride + segsU;
    const br1 = br0 + stride;
    indices.push(fr0, fr1, br0, br0, fr1, br1);
  }
  for (let s = 0; s < segsU; s++) {
    const fb0 = frontBase + s;
    const fb1 = fb0 + 1;
    const bb0 = backBase + s;
    const bb1 = bb0 + 1;
    indices.push(fb0, fb1, bb0, bb0, fb1, bb1);
    const ft0 = frontBase + (rowCount - 1) * stride + s;
    const ft1 = ft0 + 1;
    const bt0 = backBase + (rowCount - 1) * stride + s;
    const bt1 = bt0 + 1;
    indices.push(ft0, bt0, ft1, bt0, bt1, ft1);
  }

  const geo = markDisposableGeo(new THREE.BufferGeometry());
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

// Builds a flat ribbon strap along a 3D CatmullRomCurve3 with rectangular cross-section.
const buildRibbonStrap = (points, width = 0.08, thickness = 0.02, segments = 36) => {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const pts = curve.getPoints(segments);
  const positions = [];
  const uvs = [];
  const indices = [];
  const hw = width / 2;
  const ht = thickness / 2;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const tangent = curve.getTangent(i / segments);
    const radial = new THREE.Vector3(p.x, 0.15, p.z).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, radial).normalize();
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();

    const corners = [
      p.clone().addScaledVector(side, -hw).addScaledVector(normal, ht),
      p.clone().addScaledVector(side, hw).addScaledVector(normal, ht),
      p.clone().addScaledVector(side, hw).addScaledVector(normal, -ht),
      p.clone().addScaledVector(side, -hw).addScaledVector(normal, -ht),
    ];
    const v = i / segments;
    corners.forEach((c, idx) => {
      positions.push(c.x, c.y, c.z);
      uvs.push(idx / 3, v);
    });
  }

  for (let i = 0; i < pts.length - 1; i++) {
    const b = i * 4;
    for (let k = 0; k < 4; k++) {
      const k1 = (k + 1) % 4;
      indices.push(b + k, b + 4 + k, b + k1, b + k1, b + 4 + k, b + 4 + k1);
    }
  }

  const geo = markDisposableGeo(new THREE.BufferGeometry());
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

// Builds a 3D contoured neck torus ring following an elliptical cross-section.
const buildNeckCollarRing = ({
  y,
  cx = 0,
  cz = 0,
  rx,
  rz,
  tubeR = 0.025,
  tubeYScale = 1.0,
  tiltX = 0,
  segments = 44,
  tubeSegs = 14,
}) => {
  const geo = markDisposableGeo(new THREE.TorusGeometry(1, tubeR, tubeSegs, segments));
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const cosTilt = Math.cos(tiltX);
  const sinTilt = Math.sin(tiltX);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const angle = Math.atan2(v.y, v.x);
    const ringR = Math.hypot(v.x, v.y);
    const tubeOffsetR = ringR - 1;
    const localX = Math.cos(angle) * (rx + tubeOffsetR);
    const localZ = Math.sin(angle) * (rz + tubeOffsetR);
    const localY = v.z * tubeYScale;
    const tiltedY = localY * cosTilt - localZ * sinTilt;
    const tiltedZ = localY * sinTilt + localZ * cosTilt;
    pos.setXYZ(i, cx + localX, y + tiltedY, cz + tiltedZ);
  }
  geo.computeVertexNormals();
  return geo;
};

// ---------------------------------------------------------------------------
// Custom-Tailored 3D Garment & Accessory Builders
// ---------------------------------------------------------------------------

// 1. Buddy's Denim Overalls — custom tailored to Buddy's exact plush bear contour
const buildBuddyOveralls = () => {
  const group = new THREE.Group();
  const denimTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#2b5b94";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
    for (let i = 0; i < w + h; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
    }
  });
  const denimMat = makeStdMat("#ffffff", { map: denimTex, roughness: 0.78, side: THREE.DoubleSide });
  const cuffMat = makeStdMat("#6b96c9", { roughness: 0.74, side: THREE.DoubleSide });
  const stitchMat = makeStdMat("#f59e0b", { roughness: 0.5, metalness: 0.2 });
  const brassMat = makeStdMat("#fbbf24", { roughness: 0.28, metalness: 0.75 });

  // Left and right plush leg shorts + rolled cuffs (y = 0.095..0.41)
  [-0.24, 0.24].forEach((legX) => {
    const legGeo = buildLoftedGarment([
      { y: 0.11, cx: legX, cz: -0.065, rx: 0.245, rz: 0.248 },
      { y: 0.20, cx: legX, cz: -0.065, rx: 0.252, rz: 0.268 },
      { y: 0.30, cx: legX * 0.96, cz: -0.068, rx: 0.262, rz: 0.31 },
      { y: 0.40, cx: legX * 0.88, cz: -0.072, rx: 0.278, rz: 0.365 },
    ], 36);
    group.add(new THREE.Mesh(legGeo, denimMat));

    const cuffGeo = buildLoftedGarment([
      { y: 0.095, cx: legX, cz: -0.065, rx: 0.252, rz: 0.254 },
      { y: 0.118, cx: legX, cz: -0.065, rx: 0.258, rz: 0.26 },
      { y: 0.142, cx: legX, cz: -0.065, rx: 0.252, rz: 0.255 },
    ], 36);
    group.add(new THREE.Mesh(cuffGeo, cuffMat));
  });

  // Main lower torso & belly wrap (y = 0.37..0.60) — smooth continuous profile from legs to waist
  const torsoGeo = buildLoftedGarment([
    { y: 0.37, cx: 0, cz: -0.07, rx: 0.468, rz: 0.37, frontBulge: 0.015, backBulge: 0.025 },
    { y: 0.43, cx: 0, cz: -0.072, rx: 0.478, rz: 0.41, frontBulge: 0.02, backBulge: 0.035 },
    { y: 0.50, cx: 0, cz: -0.075, rx: 0.482, rz: 0.44, frontBulge: 0.025, backBulge: 0.04 },
    { y: 0.56, cx: 0, cz: -0.075, rx: 0.478, rz: 0.455, frontBulge: 0.025, backBulge: 0.04 },
    { y: 0.60, cx: 0, cz: -0.072, rx: 0.47, rz: 0.455, frontBulge: 0.025, backBulge: 0.035 },
  ], 56, false, true);
  group.add(new THREE.Mesh(torsoGeo, denimMat));

  // Waistband seam ring at y = 0.60
  const waistSeam = buildNeckCollarRing({
    y: 0.60, cx: 0, cz: -0.065, rx: 0.474, rz: 0.475, tubeR: 0.014,
  });
  group.add(new THREE.Mesh(waistSeam, cuffMat));

  // Contoured Front Bib (y = 0.59..0.95) hugging Buddy's upper belly/chest
  const frontBibGeo = buildArcPanel([
    { y: 0.59, cx: 0, cz: -0.055, rx: 0.472, rz: 0.475, angle0: -0.62, angle1: 0.62 },
    { y: 0.68, cx: 0, cz: -0.055, rx: 0.468, rz: 0.48, angle0: -0.55, angle1: 0.55 },
    { y: 0.78, cx: 0, cz: -0.05, rx: 0.455, rz: 0.47, angle0: -0.48, angle1: 0.48 },
    { y: 0.87, cx: 0, cz: -0.05, rx: 0.435, rz: 0.45, angle0: -0.42, angle1: 0.42 },
    { y: 0.94, cx: 0, cz: -0.045, rx: 0.415, rz: 0.428, angle0: -0.38, angle1: 0.38 },
  ], 28, 0.02);
  group.add(new THREE.Mesh(frontBibGeo, denimMat));

  // Front Bib Pocket (y = 0.66..0.83)
  const pocketGeo = buildArcPanel([
    { y: 0.66, cx: 0, cz: -0.045, rx: 0.472, rz: 0.478, angle0: -0.25, angle1: 0.25 },
    { y: 0.75, cx: 0, cz: -0.045, rx: 0.465, rz: 0.474, angle0: -0.26, angle1: 0.26 },
    { y: 0.83, cx: 0, cz: -0.045, rx: 0.45, rz: 0.462, angle0: -0.26, angle1: 0.26 },
  ], 18, 0.018);
  group.add(new THREE.Mesh(pocketGeo, cuffMat));

  // Contoured Back Bib (y = 0.59..0.88)
  const backBibGeo = buildArcPanel([
    { y: 0.59, cx: 0, cz: -0.072, rx: 0.472, rz: 0.485, angle0: Math.PI - 0.55, angle1: Math.PI + 0.55 },
    { y: 0.70, cx: 0, cz: -0.068, rx: 0.465, rz: 0.485, angle0: Math.PI - 0.45, angle1: Math.PI + 0.45 },
    { y: 0.80, cx: 0, cz: -0.062, rx: 0.448, rz: 0.472, angle0: Math.PI - 0.35, angle1: Math.PI + 0.35 },
    { y: 0.88, cx: 0, cz: -0.058, rx: 0.43, rz: 0.455, angle0: Math.PI - 0.28, angle1: Math.PI + 0.28 },
  ], 24, 0.02);
  group.add(new THREE.Mesh(backBibGeo, denimMat));

  // Shoulder straps curving over Buddy's shoulders + brass buttons
  [-1, 1].forEach((side) => {
    const sx = side * 0.15;
    const strapGeo = buildRibbonStrap([
      [sx, 0.91, 0.368],
      [side * 0.19, 1.03, 0.30],
      [side * 0.24, 1.13, 0.12],
      [side * 0.25, 1.14, -0.10],
      [side * 0.21, 1.05, -0.34],
      [side * 0.12, 0.86, -0.502],
    ], 0.088, 0.022, 32);
    group.add(new THREE.Mesh(strapGeo, denimMat));

    const btn = new THREE.Mesh(
      markDisposableGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 20)),
      brassMat
    );
    btn.rotation.x = Math.PI / 2 - 0.2;
    btn.position.set(sx, 0.905, 0.382);
    group.add(btn);

    const hipBtn = new THREE.Mesh(
      markDisposableGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 18)),
      brassMat
    );
    hipBtn.rotation.z = Math.PI / 2;
    hipBtn.position.set(side * 0.475, 0.56, -0.04);
    group.add(hipBtn);
  });

  const stitch = new THREE.Mesh(
    markDisposableGeo(new THREE.SphereGeometry(0.016, 12, 12)),
    stitchMat
  );
  stitch.position.set(0, 0.79, 0.432);
  group.add(stitch);

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 2. Buddy's Royal/Hero Cape — collar wrapping Buddy's neck + draped pleated back cape
const buildBuddyCape = () => {
  const group = new THREE.Group();
  const capeTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 0, w, h);

    // Cute golden bear face emblem centered on the back of the cape
    // Note: v = 0 is bottom of cape, v = 1 is top of cape; canvas y = 0 is v = 1
    const cx = w * 0.5;
    const cy = h * 0.45;
    ctx.fillStyle = "#fbbf24";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 4;

    // Ears
    [
      [cx - 38, cy - 34],
      [cx + 38, cy - 34],
    ].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(ex, ey, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
    });

    // Head circle
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Muzzle oval
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & nose
    ctx.fillStyle = "#451a03";
    [cx - 16, cx + 16].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, cy - 6, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }, 512, 512);

  const redMat = makeStdMat("#ffffff", { map: capeTex, roughness: 0.62, side: THREE.DoubleSide });
  const solidRedMat = makeStdMat("#dc2626", { roughness: 0.62, side: THREE.DoubleSide });
  const creamMat = makeStdMat("#fef3c7", { roughness: 0.8, side: THREE.DoubleSide });
  const goldMat = makeStdMat("#fbbf24", { roughness: 0.3, metalness: 0.7 });

  const capeRows = [
    { y: 0.26, cx: 0, cz: -0.10, rx: 0.68, rz: 0.64, angle0: Math.PI - 1.18, angle1: Math.PI + 1.18, waveAmp: 0.038, waveFreq: 5 },
    { y: 0.44, cx: 0, cz: -0.10, rx: 0.64, rz: 0.62, angle0: Math.PI - 1.12, angle1: Math.PI + 1.12, waveAmp: 0.032, waveFreq: 5 },
    { y: 0.62, cx: 0, cz: -0.09, rx: 0.60, rz: 0.60, angle0: Math.PI - 1.05, angle1: Math.PI + 1.05, waveAmp: 0.025, waveFreq: 5 },
    { y: 0.80, cx: 0, cz: -0.08, rx: 0.56, rz: 0.56, angle0: Math.PI - 0.98, angle1: Math.PI + 0.98, waveAmp: 0.018, waveFreq: 5 },
    { y: 0.98, cx: 0, cz: -0.06, rx: 0.52, rz: 0.50, angle0: Math.PI - 0.92, angle1: Math.PI + 0.92, waveAmp: 0.01, waveFreq: 5 },
    { y: 1.13, cx: 0, cz: -0.04, rx: 0.47, rz: 0.42, angle0: Math.PI - 0.88, angle1: Math.PI + 0.88, waveAmp: 0, waveFreq: 5 },
  ];
  group.add(new THREE.Mesh(buildArcPanel(capeRows, 44, 0.024), redMat));

  const trimRows = [
    { y: 0.235, cx: 0, cz: -0.10, rx: 0.69, rz: 0.65, angle0: Math.PI - 1.20, angle1: Math.PI + 1.20, waveAmp: 0.038, waveFreq: 5 },
    { y: 0.295, cx: 0, cz: -0.10, rx: 0.675, rz: 0.64, angle0: Math.PI - 1.18, angle1: Math.PI + 1.18, waveAmp: 0.036, waveFreq: 5 },
  ];
  group.add(new THREE.Mesh(buildArcPanel(trimRows, 44, 0.036), creamMat));

  const collarRing = buildNeckCollarRing({
    y: 1.135, cx: 0, cz: -0.035, rx: 0.465, rz: 0.405, tubeR: 0.042, tubeYScale: 0.9, tiltX: 0.08,
  });
  group.add(new THREE.Mesh(collarRing, creamMat));

  const innerCollarRing = buildNeckCollarRing({
    y: 1.11, cx: 0, cz: -0.035, rx: 0.475, rz: 0.415, tubeR: 0.032, tubeYScale: 0.85, tiltX: 0.08,
  });
  group.add(new THREE.Mesh(innerCollarRing, solidRedMat));

  const clasp = new THREE.Mesh(
    markDisposableGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 24)),
    goldMat
  );
  clasp.rotation.x = Math.PI / 2 - 0.15;
  clasp.position.set(0, 1.10, 0.385);
  group.add(clasp);

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 3. Buddy's Rainbow/Striped Knitted Scarf — bold red & teal stripes matching thumbnail
const buildRainbowScarf = () => {
  const group = new THREE.Group();
  const stripeTex = makeCanvasTexture((ctx, w, h) => {
    const colors = [
      "#b91c1c", "#047857", "#b91c1c", "#047857",
      "#b91c1c", "#047857", "#b91c1c", "#047857",
      "#b91c1c", "#047857",
    ];
    const bandH = h / colors.length;
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * bandH, w, bandH + 1);
    });
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }, 256, 256);

  const scarfMat = makeStdMat("#ffffff", { map: stripeTex, roughness: 0.65, side: THREE.DoubleSide });
  const fringeMat = makeStdMat("#991b1b", { roughness: 0.72 });

  const lowerWrap = buildNeckCollarRing({
    y: 1.105, cx: 0, cz: -0.035, rx: 0.478, rz: 0.418, tubeR: 0.065, tubeYScale: 0.95, tiltX: 0.1,
  });
  group.add(new THREE.Mesh(lowerWrap, scarfMat));

  const upperWrap = buildNeckCollarRing({
    y: 1.16, cx: 0, cz: -0.035, rx: 0.458, rz: 0.40, tubeR: 0.058, tubeYScale: 0.9, tiltX: 0.08,
  });
  group.add(new THREE.Mesh(upperWrap, scarfMat));

  const leftTail = buildRibbonStrap([
    [-0.07, 1.10, 0.395],
    [-0.12, 0.98, 0.44],
    [-0.15, 0.84, 0.472],
    [-0.16, 0.70, 0.485],
    [-0.16, 0.56, 0.475],
  ], 0.15, 0.038, 28);
  group.add(new THREE.Mesh(leftTail, scarfMat));

  const rightTail = buildRibbonStrap([
    [0.07, 1.11, 0.41],
    [0.12, 1.00, 0.452],
    [0.145, 0.87, 0.48],
    [0.155, 0.74, 0.488],
    [0.155, 0.62, 0.482],
  ], 0.145, 0.038, 28);
  group.add(new THREE.Mesh(rightTail, scarfMat));

  [
    { cx: -0.16, y: 0.53, z: 0.472 },
    { cx: 0.155, y: 0.59, z: 0.48 },
  ].forEach(({ cx, y, z }) => {
    for (let i = -2; i <= 2; i++) {
      const tassel = new THREE.Mesh(
        markDisposableGeo(new THREE.CylinderGeometry(0.01, 0.012, 0.06, 8)),
        fringeMat
      );
      tassel.position.set(cx + i * 0.026, y, z);
      group.add(tassel);
    }
  });

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 4. Leo's Superhero Cape — red collar around neck + blue flared cape with bold yellow lightning bolt
const buildLeoCape = () => {
  const group = new THREE.Group();
  const capeTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.80);
    ctx.lineTo(w * 0.38, h * 0.48);
    ctx.lineTo(w * 0.50, h * 0.48);
    ctx.lineTo(w * 0.42, h * 0.16);
    ctx.lineTo(w * 0.62, h * 0.52);
    ctx.lineTo(w * 0.50, h * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }, 512, 512);

  const blueMat = makeStdMat("#ffffff", { map: capeTex, roughness: 0.62, side: THREE.DoubleSide });
  const redMat = makeStdMat("#dc2626", { roughness: 0.55, side: THREE.DoubleSide });
  const goldMat = makeStdMat("#fbbf24", { roughness: 0.3, metalness: 0.7 });

  const capeRows = [
    { y: 0.25, cx: 0.015, cz: -0.02, rx: 0.36, rz: 0.27, angle0: Math.PI - 0.95, angle1: Math.PI + 0.95, waveAmp: 0.022, waveFreq: 5 },
    { y: 0.45, cx: 0.015, cz: -0.01, rx: 0.32, rz: 0.23, angle0: Math.PI - 0.90, angle1: Math.PI + 0.90, waveAmp: 0.018, waveFreq: 5 },
    { y: 0.65, cx: 0.015, cz: 0.0, rx: 0.28, rz: 0.19, angle0: Math.PI - 0.85, angle1: Math.PI + 0.85, waveAmp: 0.012, waveFreq: 5 },
    { y: 0.85, cx: 0.015, cz: 0.01, rx: 0.24, rz: 0.16, angle0: Math.PI - 0.80, angle1: Math.PI + 0.80, waveAmp: 0.006, waveFreq: 5 },
    { y: 1.01, cx: 0.015, cz: 0.015, rx: 0.185, rz: 0.135, angle0: Math.PI - 0.75, angle1: Math.PI + 0.75, waveAmp: 0, waveFreq: 5 },
  ];
  group.add(new THREE.Mesh(buildArcPanel(capeRows, 40, 0.016), blueMat));

  const collar = buildNeckCollarRing({
    y: 1.015, cx: 0.015, cz: 0.02, rx: 0.175, rz: 0.135, tubeR: 0.024, tubeYScale: 0.85, tiltX: 0.1,
  });
  group.add(new THREE.Mesh(collar, redMat));

  const clasp = new THREE.Mesh(
    markDisposableGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.014, 18)),
    goldMat
  );
  clasp.rotation.x = Math.PI / 2 - 0.15;
  clasp.position.set(0.015, 0.995, 0.162);
  group.add(clasp);

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 5. Leo's Shorts (sport-shorts & comfy-shorts) — contoured waist + tailored thigh tubes
const buildLeoShorts = (variant = "sport") => {
  const group = new THREE.Group();
  const isSport = variant === "sport";

  const bodyTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = isSport ? "#ea580c" : "#1d4ed8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = isSport ? "#ffffff" : "#93c5fd";
    [0.25, 0.75].forEach((uCenter) => {
      const x = uCenter * w;
      ctx.fillRect(x - 8, 0, 6, h);
      if (isSport) ctx.fillRect(x + 2, 0, 6, h);
    });
  }, 256, 256);

  const mainMat = makeStdMat("#ffffff", { map: bodyTex, roughness: 0.76, side: THREE.DoubleSide });
  const trimMat = makeStdMat(isSport ? "#c2410c" : "#3b82f6", { roughness: 0.7, side: THREE.DoubleSide });
  const cordMat = makeStdMat("#f8fafc", { roughness: 0.6 });

  [-0.125, 0.155].forEach((legX) => {
    const legGeo = buildLoftedGarment([
      { y: 0.25, cx: legX, cz: 0.02, rx: 0.118, rz: 0.132 },
      { y: 0.32, cx: legX, cz: 0.02, rx: 0.122, rz: 0.142 },
      { y: 0.40, cx: legX * 0.94, cz: 0.022, rx: 0.128, rz: 0.155 },
      { y: 0.46, cx: legX * 0.78, cz: 0.024, rx: 0.138, rz: 0.168 },
    ], 32);
    group.add(new THREE.Mesh(legGeo, mainMat));

    const cuffGeo = buildLoftedGarment([
      { y: 0.238, cx: legX, cz: 0.02, rx: 0.12, rz: 0.134 },
      { y: 0.258, cx: legX, cz: 0.02, rx: 0.122, rz: 0.136 },
    ], 32);
    group.add(new THREE.Mesh(cuffGeo, isSport ? cordMat : trimMat));
  });

  const hipGeo = buildLoftedGarment([
    { y: 0.42, cx: 0.015, cz: 0.022, rx: 0.228, rz: 0.172 },
    { y: 0.48, cx: 0.015, cz: 0.024, rx: 0.232, rz: 0.185 },
    { y: 0.54, cx: 0.015, cz: 0.025, rx: 0.225, rz: 0.192 },
    { y: 0.58, cx: 0.015, cz: 0.025, rx: 0.215, rz: 0.192 },
  ], 44, true, true);
  group.add(new THREE.Mesh(hipGeo, mainMat));

  const waistGeo = buildLoftedGarment([
    { y: 0.555, cx: 0.015, cz: 0.025, rx: 0.222, rz: 0.195, waveAmp: 0.003, waveFreq: 24 },
    { y: 0.58, cx: 0.015, cz: 0.025, rx: 0.22, rz: 0.196, waveAmp: 0.003, waveFreq: 24 },
    { y: 0.605, cx: 0.015, cz: 0.025, rx: 0.212, rz: 0.192, waveAmp: 0.003, waveFreq: 24 },
  ], 44);
  group.add(new THREE.Mesh(waistGeo, trimMat));

  [-0.022, 0.022].forEach((dx, idx) => {
    const cord = buildRibbonStrap([
      [0.015 + dx, 0.585, 0.22],
      [0.015 + dx * 1.4, 0.53, 0.225],
      [0.015 + dx * 1.5, idx === 0 ? 0.47 : 0.485, 0.218],
    ], 0.014, 0.012, 12);
    group.add(new THREE.Mesh(cord, cordMat));
  });

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 6. Mia's Skirts (twirl-skirt & sport-skirt) — snug waist + pleated flared skirt
const buildMiaSkirt = (variant = "twirl") => {
  const group = new THREE.Group();
  const isSport = variant === "sport";

  const skirtTex = makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = isSport ? "#15803d" : "#0284c7";
    ctx.fillRect(0, 0, w, h);
    if (isSport) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, h * 0.82, w, h * 0.048);
      ctx.fillRect(0, h * 0.90, w, h * 0.048);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 4;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }
  }, 256, 256);

  const skirtMat = makeStdMat("#ffffff", { map: skirtTex, roughness: 0.72, side: THREE.DoubleSide });
  const waistMat = makeStdMat(isSport ? "#166534" : "#eab308", { roughness: 0.6, side: THREE.DoubleSide });

  const waveFreq = isSport ? 20 : 12;
  const maxWave = isSport ? 0.016 : 0.024;

  const skirtGeo = buildLoftedGarment([
    { y: 0.22, cx: 0.02, cz: 0.06, rx: 0.35, rz: 0.30, waveAmp: maxWave, waveFreq },
    { y: 0.31, cx: 0.02, cz: 0.06, rx: 0.315, rz: 0.27, waveAmp: maxWave * 0.8, waveFreq },
    { y: 0.40, cx: 0.02, cz: 0.06, rx: 0.28, rz: 0.24, waveAmp: maxWave * 0.55, waveFreq },
    { y: 0.49, cx: 0.02, cz: 0.06, rx: 0.248, rz: 0.21, waveAmp: maxWave * 0.3, waveFreq },
    { y: 0.58, cx: 0.02, cz: 0.06, rx: 0.218, rz: 0.182, waveAmp: 0.003, waveFreq },
  ], 72, true, false);
  group.add(new THREE.Mesh(skirtGeo, skirtMat));

  const waistGeo = buildLoftedGarment([
    { y: 0.57, cx: 0.02, cz: 0.06, rx: 0.222, rz: 0.186 },
    { y: 0.60, cx: 0.02, cz: 0.06, rx: 0.218, rz: 0.184 },
    { y: 0.628, cx: 0.02, cz: 0.06, rx: 0.212, rz: 0.18 },
  ], 48, true, false);
  group.add(new THREE.Mesh(waistGeo, waistMat));

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 7. Mia's Lilac Pinafore Dress — fitted bodice + heart bib + shoulder straps + ruffled skirt
const buildMiaPinafore = () => {
  const group = new THREE.Group();
  const lilacMat = makeStdMat("#9333ea", { roughness: 0.72, side: THREE.DoubleSide });
  const trimMat = makeStdMat("#a855f7", { roughness: 0.66, side: THREE.DoubleSide });
  const heartMat = makeStdMat("#ec4899", { roughness: 0.5 });
  const buttonMat = makeStdMat("#f8fafc", { roughness: 0.3, metalness: 0.2 });

  const skirtGeo = buildLoftedGarment([
    { y: 0.21, cx: 0.02, cz: 0.06, rx: 0.36, rz: 0.31, waveAmp: 0.022, waveFreq: 16 },
    { y: 0.26, cx: 0.02, cz: 0.06, rx: 0.335, rz: 0.285, waveAmp: 0.014, waveFreq: 16 },
    { y: 0.36, cx: 0.02, cz: 0.06, rx: 0.30, rz: 0.255, waveAmp: 0.012, waveFreq: 14 },
    { y: 0.48, cx: 0.02, cz: 0.06, rx: 0.255, rz: 0.215, waveAmp: 0.006, waveFreq: 14 },
    { y: 0.59, cx: 0.02, cz: 0.06, rx: 0.218, rz: 0.185, waveAmp: 0, waveFreq: 14 },
  ], 64, true, false);
  group.add(new THREE.Mesh(skirtGeo, lilacMat));

  const ruffleGeo = buildLoftedGarment([
    { y: 0.185, cx: 0.02, cz: 0.06, rx: 0.375, rz: 0.322, waveAmp: 0.028, waveFreq: 20 },
    { y: 0.225, cx: 0.02, cz: 0.06, rx: 0.355, rz: 0.305, waveAmp: 0.02, waveFreq: 20 },
  ], 64);
  group.add(new THREE.Mesh(ruffleGeo, trimMat));

  const waistGeo = buildLoftedGarment([
    { y: 0.575, cx: 0.02, cz: 0.06, rx: 0.224, rz: 0.19 },
    { y: 0.60, cx: 0.02, cz: 0.06, rx: 0.222, rz: 0.188 },
    { y: 0.622, cx: 0.02, cz: 0.06, rx: 0.216, rz: 0.184 },
  ], 48);
  group.add(new THREE.Mesh(waistGeo, trimMat));

  const frontBibGeo = buildArcPanel([
    { y: 0.61, cx: 0.02, cz: 0.06, rx: 0.216, rz: 0.19, angle0: -0.66, angle1: 0.66 },
    { y: 0.72, cx: 0.02, cz: 0.055, rx: 0.21, rz: 0.195, angle0: -0.58, angle1: 0.58 },
    { y: 0.83, cx: 0.02, cz: 0.045, rx: 0.20, rz: 0.185, angle0: -0.52, angle1: 0.52 },
    { y: 0.92, cx: 0.02, cz: 0.035, rx: 0.19, rz: 0.168, angle0: -0.48, angle1: 0.48 },
  ], 24, 0.016);
  group.add(new THREE.Mesh(frontBibGeo, lilacMat));

  const heartGroup = new THREE.Group();
  heartGroup.position.set(0.02, 0.78, 0.242);
  [-0.022, 0.022].forEach((hx) => {
    const lobe = new THREE.Mesh(markDisposableGeo(new THREE.SphereGeometry(0.028, 14, 14)), heartMat);
    lobe.scale.set(1, 1, 0.45);
    lobe.position.set(hx, 0.012, 0);
    heartGroup.add(lobe);
  });
  const tip = new THREE.Mesh(markDisposableGeo(new THREE.ConeGeometry(0.042, 0.055, 16)), heartMat);
  tip.scale.set(1, 1, 0.42);
  tip.rotation.z = Math.PI;
  tip.position.set(0, -0.018, 0);
  heartGroup.add(tip);
  group.add(heartGroup);

  [-1, 1].forEach((side) => {
    const sx = 0.02 + side * 0.078;
    const strapGeo = buildRibbonStrap([
      [sx, 0.91, 0.205],
      [0.02 + side * 0.095, 1.00, 0.14],
      [0.02 + side * 0.105, 1.035, 0.04],
      [0.02 + side * 0.095, 0.98, -0.07],
      [0.02 + side * 0.075, 0.80, -0.115],
      [0.02 + side * 0.065, 0.61, -0.12],
    ], 0.044, 0.014, 28);
    group.add(new THREE.Mesh(strapGeo, lilacMat));

    const btn = new THREE.Mesh(
      markDisposableGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16)),
      buttonMat
    );
    btn.rotation.x = Math.PI / 2 - 0.15;
    btn.position.set(sx, 0.90, 0.212);
    group.add(btn);
  });

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// ---------------------------------------------------------------------------
// Mesh Surgical Refinements & Augmentations for Existing GLBs
// ---------------------------------------------------------------------------

const trimUpperRibbonVertices = (root, cutFrac = 0.58) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const cutY = box.min.y + (box.max.y - box.min.y) * cutFrac;
  const topClampY = box.min.y + (box.max.y - box.min.y) * (cutFrac - 0.03);

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      if (v.y > cutY) {
        v.y = topClampY;
        v.x *= 0.15;
        v.applyMatrix4(invMat);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

// Trims vertices below a given fraction of the raw bounding box and pulls them
// toward the center so dangling cords or internal harness blobs vanish completely.
const trimLowerVertices = (root, minFrac = 0.28, pullToCenter = false) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const cutY = box.min.y + (box.max.y - box.min.y) * minFrac;
  const clampY = cutY + 0.02;

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      if (v.y < cutY) {
        v.y = clampY;
        if (pullToCenter) {
          v.x = center.x + (v.x - center.x) * 0.2;
          v.z = center.z + (v.z - center.z) * 0.2;
        }
        v.applyMatrix4(invMat);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

const widenBootShaft = (root) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const minY = box.min.y;
  const spanY = box.max.y - box.min.y || 1;
  const shaftCx = -0.18;
  const shaftCz = 0.02;

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      const t = Math.max(0, Math.min(1, (v.y - minY) / spanY));
      if (t > 0.35) {
        const w = (t - 0.35) / 0.65;
        const expandX = 1 + w * 0.14;
        const expandZ = 1 + w * 0.20;
        v.x = shaftCx + (v.x - shaftCx) * expandX;
        v.z = shaftCz + (v.z - shaftCz) * expandZ;
        v.applyMatrix4(invMat);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

const contourHeroMaskStrap = (root) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      if (v.z < center.z) {
        const backT = Math.min(1, (center.z - v.z) / 0.45);
        v.x *= 1 + backT * 0.12;
        v.z = center.z + (v.z - center.z) * (1 + backT * 0.16);
        v.applyMatrix4(invMat);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

const curveFlowerCrown = (root) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      const dy = v.y - center.y;
      const dx = v.x - center.x;
      v.z -= (dy * dy) * 0.55 + (dx * dx) * 0.18;
      v.applyMatrix4(invMat);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

const contourVisorArms = (root) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    const v = new THREE.Vector3();
    const invMat = child.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      if (v.z < center.z + 0.12) {
        const backT = Math.min(1, (center.z + 0.12 - v.z) / 0.5);
        v.x *= 1 - backT * 0.25;
        v.y += backT * 0.06;
        if (v.z < center.z - 0.18) {
          v.z = center.z - 0.18;
        }
        v.applyMatrix4(invMat);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
};

const buildMedalNeckRibbon = (itemId) => {
  const group = new THREE.Group();
  const configs = {
    "buddy-medal": {
      color: "#dc2626",
      neckY: 1.115, cx: 0, cz: -0.035, rx: 0.465, rz: 0.405, tubeR: 0.022, tiltX: 0.08,
      leftStart: [-0.14, 1.08, 0.36], rightStart: [0.14, 1.08, 0.36],
      midLeft: [-0.07, 0.99, 0.43], midRight: [0.07, 0.99, 0.43],
      bail: [0, 0.90, 0.462], width: 0.045,
    },
    "milo-medal": {
      color: "#0284c7",
      neckY: 1.26, cx: 0, cz: 0.03, rx: 0.39, rz: 0.38, tubeR: 0.02, tiltX: 0.05,
      leftStart: [-0.13, 1.24, 0.40], rightStart: [0.13, 1.24, 0.40],
      midLeft: [-0.065, 1.15, 0.46], midRight: [0.065, 1.15, 0.46],
      bail: [0, 1.07, 0.478], width: 0.04,
    },
    "leo-medal": {
      color: "#2563eb",
      accentColor: "#f97316",
      neckY: 1.02, cx: 0.015, cz: 0.02, rx: 0.165, rz: 0.13, tubeR: 0.015, tiltX: 0.1,
      leftStart: [-0.055, 1.00, 0.14], rightStart: [0.085, 1.00, 0.14],
      midLeft: [-0.02, 0.93, 0.18], midRight: [0.05, 0.93, 0.18],
      bail: [0.015, 0.87, 0.205], width: 0.028,
    },
    "heart-necklace": {
      color: "#fbbf24",
      metalness: 0.7,
      roughness: 0.3,
      neckY: 1.025, cx: 0.015, cz: 0.04, rx: 0.15, rz: 0.125, tubeR: 0.01, tiltX: 0.12,
      leftStart: [-0.05, 1.00, 0.155], rightStart: [0.08, 1.00, 0.155],
      midLeft: [-0.015, 0.95, 0.215], midRight: [0.045, 0.95, 0.215],
      bail: [0.015, 0.905, 0.245], width: 0.014,
    },
  };
  const cfg = configs[itemId];
  if (!cfg) return group;

  const mat = makeStdMat(cfg.color, {
    roughness: cfg.roughness ?? 0.6,
    metalness: cfg.metalness ?? 0.08,
  });
  const rightMat = cfg.accentColor
    ? makeStdMat(cfg.accentColor, { roughness: 0.6 })
    : mat;

  const collar = buildNeckCollarRing({
    y: cfg.neckY, cx: cfg.cx, cz: cfg.cz, rx: cfg.rx, rz: cfg.rz, tubeR: cfg.tubeR, tiltX: cfg.tiltX,
  });
  group.add(new THREE.Mesh(collar, mat));

  const leftStrap = buildRibbonStrap([cfg.leftStart, cfg.midLeft, cfg.bail], cfg.width, 0.012, 16);
  const rightStrap = buildRibbonStrap([cfg.rightStart, cfg.midRight, cfg.bail], cfg.width, 0.012, 16);
  group.add(new THREE.Mesh(leftStrap, mat));
  group.add(new THREE.Mesh(rightStrap, rightMat));

  return group;
};

const buildBackpackStraps = (itemId) => {
  const group = new THREE.Group();
  if (itemId === "buddy-backpack") {
    const strapMat = makeStdMat("#5c3a21", { roughness: 0.72 });
    [-1, 1].forEach((side) => {
      const strap = buildRibbonStrap([
        [side * 0.18, 1.02, -0.49],
        [side * 0.25, 1.12, -0.25],
        [side * 0.28, 1.12, 0.08],
        [side * 0.34, 0.98, 0.34],
        [side * 0.38, 0.78, 0.32],
        [side * 0.34, 0.66, -0.05],
        [side * 0.25, 0.68, -0.52],
      ], 0.065, 0.02, 28);
      group.add(new THREE.Mesh(strap, strapMat));
    });
  } else if (itemId === "leo-backpack") {
    const strapMat = makeStdMat("#1e40af", { roughness: 0.68 });
    [-1, 1].forEach((side) => {
      const cx = 0.015;
      const strap = buildRibbonStrap([
        [cx + side * 0.11, 0.95, -0.13],
        [cx + side * 0.15, 1.02, -0.02],
        [cx + side * 0.16, 0.99, 0.12],
        [cx + side * 0.17, 0.85, 0.18],
        [cx + side * 0.17, 0.70, 0.12],
        [cx + side * 0.13, 0.68, -0.14],
      ], 0.038, 0.014, 24);
      group.add(new THREE.Mesh(strap, strapMat));
    });
  } else if (itemId === "rocket-pack") {
    const strapMat = makeStdMat("#475569", { roughness: 0.4, metalness: 0.5 });
    [-1, 1].forEach((side) => {
      const strap = buildRibbonStrap([
        [side * 0.18, 1.12, -0.49],
        [side * 0.28, 1.20, -0.18],
        [side * 0.30, 1.16, 0.28],
        [side * 0.32, 0.98, 0.46],
        [side * 0.32, 0.78, 0.38],
        [side * 0.24, 0.76, -0.49],
      ], 0.05, 0.018, 24);
      group.add(new THREE.Mesh(strap, strapMat));
    });
  }
  return group;
};

const buildGlassesTempleArms = (itemId) => {
  const group = new THREE.Group();
  const configs = {
    "round-sky-glasses": { color: "#3b82f6", x: 0.32, y: 1.38, z0: 0.34, z1: -0.02 },
    "star-spark-glasses": { color: "#f472b6", x: 0.31, y: 1.40, z0: 0.33, z1: -0.02 },
    "mia-heart-sunglasses": { color: "#ec4899", x: 0.31, y: 1.40, z0: 0.33, z1: -0.02 },
  };
  const cfg = configs[itemId];
  if (!cfg) return group;
  const mat = makeStdMat(cfg.color, { roughness: 0.45 });
  [-1, 1].forEach((side) => {
    const arm = buildRibbonStrap([
      [side * cfg.x, cfg.y, cfg.z0],
      [side * (cfg.x + 0.02), cfg.y + 0.01, (cfg.z0 + cfg.z1) / 2],
      [side * cfg.x, cfg.y - 0.02, cfg.z1],
    ], 0.018, 0.014, 12);
    group.add(new THREE.Mesh(arm, mat));
  });
  return group;
};

// Adjusts the character's cloned mesh when equipping hats, shorts/skirts/dresses, or shoes
// so underlying hair clumps, baggy pant cuffs, or wide default shoes don't poke through.
export const tailorCharacterMeshForAccessory = (characterRoot, characterId, itemId) => {
  if (!characterRoot || !itemId) return;

  const ensureClonedGeo = (mesh) => {
    if (!mesh.userData.tailoredClone) {
      mesh.geometry = mesh.geometry.clone();
      mesh.geometry.userData = {
        ...mesh.geometry.userData,
        tailoredClone: true,
        willowFaceInstance: true,
      };
      mesh.userData.tailoredClone = true;
    }
    return mesh.geometry;
  };

  characterRoot.updateMatrixWorld(true);

  // 1. Compress Leo's protruding top hair spikes under caps/hats
  if (characterId === "leo-boy" && (itemId === "sunny-red-cap" || itemId === "leo-explorer-hat")) {
    characterRoot.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geo = ensureClonedGeo(child);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const invMat = child.matrixWorld.clone().invert();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        if (v.y > 1.46) {
          const t = Math.min(1, (v.y - 1.46) / 0.36);
          v.x *= 1 - t * 0.42;
          v.z = -0.02 + (v.z + 0.02) * (1 - t * 0.44);
          v.y = 1.46 + (v.y - 1.46) * 0.62;
          v.applyMatrix4(invMat);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }

  // 2. Tuck Buddy's belly and back fur under buddy-overalls so no fur tufts poke out
  if (characterId === "buddy-bear" && itemId === "buddy-overalls") {
    characterRoot.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geo = ensureClonedGeo(child);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const invMat = child.matrixWorld.clone().invert();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        const inLowerLegs = v.y >= 0.11 && v.y <= 0.44;
        const inWaist = v.y > 0.44 && v.y <= 0.60 && Math.abs(v.x) < 0.495;
        if (inLowerLegs || inWaist) {
          v.x *= 0.86;
          v.z = -0.07 + (v.z + 0.07) * 0.84;
          v.applyMatrix4(invMat);
          pos.setXYZ(i, v.x, v.y, v.z);
        } else if (v.y > 0.60 && v.y <= 0.92 && Math.abs(v.x) < 0.36 && (v.z > 0.28 || v.z < -0.35)) {
          v.z = -0.06 + (v.z + 0.06) * 0.86;
          v.applyMatrix4(invMat);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }

  // 3. Tuck baggy lower pant legs on Leo (shorts) & Mia (skirts/pinafore)
  const isLeoShorts = characterId === "leo-boy" && (itemId === "sport-shorts" || itemId === "comfy-shorts");
  const isMiaSkirtOrDress =
    characterId === "mia-girl" &&
    (itemId === "twirl-skirt" || itemId === "sport-skirt" || itemId === "mia-pinafore");

  if (isLeoShorts || isMiaSkirtOrDress) {
    const legCenters = characterId === "leo-boy" ? [-0.125, 0.155] : [-0.125, 0.17];
    const legCz = characterId === "leo-boy" ? 0.02 : 0.075;

    characterRoot.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geo = ensureClonedGeo(child);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const invMat = child.matrixWorld.clone().invert();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        // Below y = 0.42, hands are not present so we can tuck the full pant width (|x| < 0.36).
        // Between y = 0.42 and 0.60, keep |x - 0.015| < 0.245 so hands at |x| >= 0.26 are untouched.
        const inLowerLeg = v.y >= 0.09 && v.y <= 0.42 && Math.abs(v.x) < 0.36;
        const inHipBand = v.y > 0.42 && v.y <= 0.60 && Math.abs(v.x - 0.015) < 0.245;
        if (inLowerLeg || inHipBand) {
          const cx = v.x < 0.015 ? legCenters[0] : legCenters[1];
          const shrink = v.y <= 0.42 ? 0.16 : 0.45;
          v.x = cx + (v.x - cx) * shrink;
          v.z = legCz + (v.z - legCz) * shrink;
          v.applyMatrix4(invMat);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }

  // 4. Compress underlying default shoe/ankle vertices when footwear accessories are worn
  if (itemId === "leo-sneakers" || itemId === "mia-sneakers" || itemId === "milo-rocket-boots") {
    const isMilo = itemId === "milo-rocket-boots";
    const maxShoeY = isMilo ? 0.35 : 0.15;
    const maxAbsX = isMilo ? 0.44 : 0.36;
    characterRoot.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geo = ensureClonedGeo(child);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const invMat = child.matrixWorld.clone().invert();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        if (v.y <= maxShoeY && Math.abs(v.x) < maxAbsX) {
          const cx = isMilo ? (v.x < 0 ? -0.27 : 0.275) : (v.x < 0 ? -0.17 : 0.20);
          const cz = isMilo ? -0.06 : 0.08;
          v.x = cx + (v.x - cx) * (isMilo ? 0.42 : 0.5);
          v.z = cz + (v.z - cz) * (isMilo ? 0.45 : 0.55);
          v.applyMatrix4(invMat);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }
};

// Builds clean bare calves + white athletic socks for Leo (under shorts) and Mia (under skirts/pinafore)
const buildLowerLegsAndSocks = (characterId) => {
  const group = new THREE.Group();
  const skinMat = makeStdMat("#f3c6a5", { roughness: 0.65 });
  const sockMat = makeStdMat("#ffffff", { roughness: 0.75 });
  const stripeMat = makeStdMat(characterId === "leo-boy" ? "#3b82f6" : "#ec4899", { roughness: 0.7 });

  const legXs = characterId === "leo-boy" ? [-0.125, 0.155] : [-0.125, 0.17];
  const legZ = characterId === "leo-boy" ? 0.02 : 0.075;

  legXs.forEach((lx) => {
    const calfGeo = buildLoftedGarment([
      { y: 0.155, cx: lx, cz: legZ, rx: 0.065, rz: 0.067 },
      { y: 0.21, cx: lx, cz: legZ, rx: 0.072, rz: 0.074 },
      { y: 0.28, cx: lx, cz: legZ, rx: 0.078, rz: 0.080 },
    ], 24);
    group.add(new THREE.Mesh(calfGeo, skinMat));

    const sockGeo = buildLoftedGarment([
      { y: 0.09, cx: lx, cz: legZ, rx: 0.070, rz: 0.072 },
      { y: 0.135, cx: lx, cz: legZ, rx: 0.068, rz: 0.070 },
      { y: 0.16, cx: lx, cz: legZ, rx: 0.069, rz: 0.071 },
    ], 24);
    group.add(new THREE.Mesh(sockGeo, sockMat));

    const stripeGeo = buildLoftedGarment([
      { y: 0.146, cx: lx, cz: legZ, rx: 0.071, rz: 0.073 },
      { y: 0.156, cx: lx, cz: legZ, rx: 0.071, rz: 0.073 },
    ], 24);
    group.add(new THREE.Mesh(stripeGeo, stripeMat));
  });

  return group;
};

// 8. Leo's Round Sky Glasses — centered open-frame round glasses on Leo's eyes & nose bridge
const buildRoundSkyGlasses = () => {
  const group = new THREE.Group();
  const frameMat = makeStdMat("#2563eb", { roughness: 0.35, metalness: 0.1 });
  const rimHighlightMat = makeStdMat("#3b82f6", { roughness: 0.32, metalness: 0.1 });

  // Leo's exact face/nose bridge center: x = +0.013, y = 1.350, z = 0.366 (left pupil -0.118, right pupil +0.142)
  const cx = 0.013;
  const cy = 1.350;
  const cz = 0.366;
  const eyeOffset = 0.130;

  [-1, 1].forEach((side) => {
    const rimGroup = new THREE.Group();
    rimGroup.position.set(cx + side * eyeOffset, cy, cz);
    rimGroup.rotation.y = -side * 0.14;

    const rim = new THREE.Mesh(
      markDisposableGeo(new THREE.TorusGeometry(0.092, 0.016, 20, 48)),
      rimHighlightMat
    );
    rim.scale.set(1, 1, 0.65);
    rimGroup.add(rim);

    const hinge = new THREE.Mesh(
      markDisposableGeo(new THREE.BoxGeometry(0.024, 0.020, 0.022)),
      frameMat
    );
    hinge.position.set(side * 0.098, 0.010, -0.005);
    rimGroup.add(hinge);

    group.add(rimGroup);

    const arm = buildRibbonStrap([
      [cx + side * (eyeOffset + 0.098), cy + 0.010, cz - 0.015],
      [cx + side * 0.305, cy + 0.012, 0.20],
      [cx + side * 0.325, cy + 0.006, 0.04],
      [cx + side * 0.312, cy - 0.028, -0.04],
    ], 0.020, 0.014, 16);
    group.add(new THREE.Mesh(arm, frameMat));
  });

  // Arched nose bridge centered on Leo's nose bridge
  const bridge = new THREE.Mesh(
    markDisposableGeo(new THREE.TorusGeometry(0.038, 0.013, 14, 24, Math.PI)),
    frameMat
  );
  bridge.position.set(cx, cy + 0.006, cz + 0.008);
  bridge.scale.set(1, 0.72, 0.75);
  group.add(bridge);

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 9. Leo's Hero Mask — symmetrical contoured domino mask centered on Leo's eyes & nose
const buildLeoHeroMask = () => {
  const group = new THREE.Group();
  const maskMat = makeStdMat("#dc2626", { roughness: 0.38, metalness: 0.08, side: THREE.DoubleSide });
  const rimMat = makeStdMat("#b91c1c", { roughness: 0.42, side: THREE.DoubleSide });
  const strapMat = makeStdMat("#1e293b", { roughness: 0.7, side: THREE.DoubleSide });

  const cx = 0.013;
  const cy = 1.350;
  const cz = 0.012;
  const baseR = 0.372;
  const thickness = 0.022;

  // Parametric radial grid per side (side = -1, +1) around each eye hole so every quad curves smoothly on the cylinder
  const mapToFace = (u, v, w) => {
    const theta = u / 0.365;
    const r = (baseR - 0.026 * theta * theta) + w;
    return [cx + Math.sin(theta) * r, cy + v, cz + Math.cos(theta) * r];
  };

  [-1, 1].forEach((side) => {
    const eyeU = side * 0.128;
    const eyeV = 0.0;
    const holeRx = 0.068;
    const holeRy = 0.044;
    const tilt = side * 0.06;

    const aSteps = 56;
    const rSteps = 8;
    const positions = [];
    const indices = [];

    const getInnerOuter = (a) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Inner eye opening point
      const lx = ca * holeRx;
      const ly = sa * holeRy;
      const uIn = eyeU + lx * Math.cos(tilt) - ly * Math.sin(tilt);
      const vIn = eyeV + lx * Math.sin(tilt) + ly * Math.cos(tilt);

      // Outer domino mask contour point along ray from eye center
      const rayX = ca * 0.186;
      const rayY = sa * 0.115;
      let uOut = eyeU + rayX;
      let vOut = eyeV + rayY;

      // Clamp to vertical centerline u = 0 so left and right halves meet seamlessly at the nose bridge
      if (side > 0 && uOut < 0) {
        const tClamp = -eyeU / (rayX || -1e-5);
        uOut = 0;
        vOut = eyeV + rayY * tClamp;
      } else if (side < 0 && uOut > 0) {
        const tClamp = -eyeU / (rayX || 1e-5);
        uOut = 0;
        vOut = eyeV + rayY * tClamp;
      }

      // Sculpt classic superhero brow arch on top and nose notch on bottom near u = 0
      const absU = Math.abs(uOut);
      if (sa > 0) {
        const browArch = 0.016 * Math.sin(Math.min(1, absU / 0.24) * Math.PI);
        const centerDip = -0.010 * Math.exp(-Math.pow(absU / 0.075, 2));
        vOut += browArch + centerDip;
      } else {
        const noseNotch = 0.042 * Math.exp(-Math.pow(absU / 0.085, 2));
        const cheekDrop = -0.010 * Math.sin(Math.min(1, absU / 0.25) * Math.PI);
        vOut += noseNotch + cheekDrop;
      }

      return { uIn, vIn, uOut, vOut };
    };

    // Front and back surfaces (layer 0 = outer, layer 1 = inner)
    for (let layer = 0; layer < 2; layer++) {
      for (let r = 0; r <= rSteps; r++) {
        const s = r / rSteps;
        // Smooth bevel profile at inner and outer edges
        const edgeBevel = Math.sin(s * Math.PI);
        const w = layer === 0 ? thickness * (0.65 + 0.35 * edgeBevel) : 0;
        for (let i = 0; i <= aSteps; i++) {
          const a = (i / aSteps) * Math.PI * 2;
          const { uIn, vIn, uOut, vOut } = getInnerOuter(a);
          const u = uIn + (uOut - uIn) * s;
          const v = vIn + (vOut - vIn) * s;
          const [px, py, pz] = mapToFace(u, v, w);
          positions.push(px, py, pz);
        }
      }
    }

    const ringStride = aSteps + 1;
    const layerStride = (rSteps + 1) * ringStride;

    for (let r = 0; r < rSteps; r++) {
      for (let i = 0; i < aSteps; i++) {
        const a0 = r * ringStride + i;
        const a1 = a0 + 1;
        const b0 = (r + 1) * ringStride + i;
        const b1 = b0 + 1;
        indices.push(a0, a1, b1, a0, b1, b0);

        const ia0 = layerStride + a0;
        const ia1 = layerStride + a1;
        const ib0 = layerStride + b0;
        const ib1 = layerStride + b1;
        indices.push(ia0, ib1, ia1, ia0, ib0, ib1);
      }
    }

    // Stitch inner eye rim and outer mask perimeter between outer and inner layers
    for (let i = 0; i < aSteps; i++) {
      const fIn0 = i;
      const fIn1 = i + 1;
      const bIn0 = layerStride + i;
      const bIn1 = layerStride + i + 1;
      indices.push(fIn0, bIn0, bIn1, fIn0, bIn1, fIn1);

      const fOut0 = rSteps * ringStride + i;
      const fOut1 = fOut0 + 1;
      const bOut0 = layerStride + fOut0;
      const bOut1 = bOut0 + 1;
      indices.push(fOut0, fOut1, bOut1, fOut0, bOut1, bOut0);
    }

    const sideGeo = new THREE.BufferGeometry();
    sideGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    sideGeo.setIndex(indices);
    sideGeo.computeVertexNormals();
    markDisposableGeo(sideGeo);
    group.add(new THREE.Mesh(sideGeo, maskMat));

    // Raised eye-rim accent around each eye opening
    const rimPts = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const { uIn, vIn } = getInnerOuter(a);
      const [px, py, pz] = mapToFace(uIn, vIn, thickness * 0.85);
      rimPts.push(new THREE.Vector3(px, py, pz));
    }
    const curve = new THREE.CatmullRomCurve3(rimPts, true);
    const rimGeo = markDisposableGeo(new THREE.TubeGeometry(curve, 36, 0.006, 8, true));
    group.add(new THREE.Mesh(rimGeo, rimMat));
  });

  // Black elastic strap wrapping around the back of Leo's head
  const backStrap = buildArcPanel([
    { y: cy - 0.022, cx, cz: -0.025, rx: 0.388, rz: 0.415, angle0: 0.78, angle1: Math.PI * 2 - 0.78 },
    { y: cy + 0.020, cx, cz: -0.025, rx: 0.388, rz: 0.415, angle0: 0.78, angle1: Math.PI * 2 - 0.78 },
  ], 36, 0.016);
  group.add(new THREE.Mesh(backStrap, strapMat));

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 10. Mia's Star Spark Glasses — symmetrical open-frame 5-pointed star glasses centered on Mia's eyes
const buildStarSparkGlasses = () => {
  const group = new THREE.Group();
  const frameMat = makeStdMat("#f472b6", { roughness: 0.35, metalness: 0.08 });

  const makeStarPolygon = (outerR, innerR) => {
    const pts = [];
    const total = 10;
    for (let i = 0; i < total; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
    return pts;
  };

  const makeRoundedPath = (pts, isHole = false) => {
    const p = isHole ? new THREE.Path() : new THREE.Shape();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      const p0 = new THREE.Vector2().lerpVectors(curr, prev, 0.22);
      const p1 = new THREE.Vector2().lerpVectors(curr, next, 0.22);
      if (i === 0) p.moveTo(p0.x, p0.y);
      else p.lineTo(p0.x, p0.y);
      p.quadraticCurveTo(curr.x, curr.y, p1.x, p1.y);
    }
    p.closePath();
    return p;
  };

  const starShape = makeRoundedPath(makeStarPolygon(0.122, 0.066), false);
  const starHole = makeRoundedPath(makeStarPolygon(0.086, 0.048), true);
  starShape.holes.push(starHole);

  const starFrameGeo = markDisposableGeo(
    new THREE.ExtrudeGeometry(starShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 16,
    })
  );

  // Centered on Mia's exact pupil midpoint: cx = +0.020, cy = 1.375, cz = 0.352 (left pupil -0.112, right pupil +0.152)
  const cx = 0.020;
  const cy = 1.375;
  const cz = 0.352;
  const eyeOffset = 0.132;

  const glassesPivot = new THREE.Group();
  glassesPivot.position.set(cx, cy, cz);
  glassesPivot.rotation.z = -0.012;

  [-1, 1].forEach((side) => {
    const sideGroup = new THREE.Group();
    sideGroup.position.set(side * eyeOffset, 0, 0);
    sideGroup.rotation.y = -side * 0.14;

    const frameMesh = new THREE.Mesh(starFrameGeo, frameMat);
    frameMesh.position.z = -0.008;
    sideGroup.add(frameMesh);

    glassesPivot.add(sideGroup);

    const arm = buildRibbonStrap([
      [side * (eyeOffset + 0.095), 0.018, -0.015],
      [side * 0.295, 0.016, -0.16],
      [side * 0.305, 0.006, -0.32],
      [side * 0.292, -0.025, -0.39],
    ], 0.018, 0.013, 14);
    glassesPivot.add(new THREE.Mesh(arm, frameMat));
  });

  const bridge = new THREE.Mesh(
    markDisposableGeo(new THREE.TorusGeometry(0.042, 0.013, 14, 24, Math.PI)),
    frameMat
  );
  bridge.position.set(0, 0.010, 0.008);
  bridge.scale.set(1, 0.65, 0.7);
  glassesPivot.add(bridge);

  group.add(glassesPivot);
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 11. Mia's Heart Sunglasses — symmetrical open-frame 3D heart glasses centered on Mia's eyes
const buildMiaHeartSunglasses = () => {
  const group = new THREE.Group();
  const frameMat = makeStdMat("#ec4899", { roughness: 0.34, metalness: 0.08 });

  const makeHeartPts = (scale) => {
    const pts = [];
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      pts.push(new THREE.Vector2(x * scale, (y + 2.4) * scale));
    }
    return pts;
  };

  const heartOuter = new THREE.Shape(makeHeartPts(0.0066));
  const heartInner = new THREE.Path(makeHeartPts(0.0048).reverse());
  heartOuter.holes.push(heartInner);

  const heartFrameGeo = markDisposableGeo(
    new THREE.ExtrudeGeometry(heartOuter, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 3,
      curveSegments: 24,
    })
  );

  // Centered on Mia's exact pupil midpoint: cx = +0.020, cy = 1.375, cz = 0.352 (left pupil -0.112, right pupil +0.152)
  const cx = 0.020;
  const cy = 1.375;
  const cz = 0.352;
  const eyeOffset = 0.132;

  const glassesPivot = new THREE.Group();
  glassesPivot.position.set(cx, cy, cz);
  glassesPivot.rotation.z = -0.012;

  [-1, 1].forEach((side) => {
    const sideGroup = new THREE.Group();
    sideGroup.position.set(side * eyeOffset, 0, 0);
    sideGroup.rotation.y = -side * 0.14;

    const frameMesh = new THREE.Mesh(heartFrameGeo, frameMat);
    frameMesh.position.z = -0.008;
    sideGroup.add(frameMesh);

    glassesPivot.add(sideGroup);

    const arm = buildRibbonStrap([
      [side * (eyeOffset + 0.098), 0.020, -0.015],
      [side * 0.295, 0.016, -0.16],
      [side * 0.305, 0.006, -0.32],
      [side * 0.292, -0.025, -0.39],
    ], 0.018, 0.013, 14);
    glassesPivot.add(new THREE.Mesh(arm, frameMat));
  });

  const bridge = new THREE.Mesh(
    markDisposableGeo(new THREE.TorusGeometry(0.038, 0.013, 14, 24, Math.PI)),
    frameMat
  );
  bridge.position.set(0, 0.014, 0.008);
  bridge.scale.set(1, 0.65, 0.7);
  glassesPivot.add(bridge);

  group.add(glassesPivot);
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 12. Milo's Glow Visor — symmetrical wrap-around cyber/goggle visor centered over Milo's eye screen
const buildMiloVisor = () => {
  const group = new THREE.Group();
  const frameMat = makeStdMat("#06b6d4", {
    roughness: 0.30,
    metalness: 0.18,
    emissive: 0x0891b2,
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
  });
  const rimAccentMat = makeStdMat("#22d3ee", {
    roughness: 0.28,
    metalness: 0.22,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });
  const strapMat = makeStdMat("#0891b2", { roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide });
  const lensMat = new THREE.MeshBasicMaterial({
    color: "#22d3ee",
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Milo's eye screen center: x = -0.002, y = 1.576, head center cz = 0.05
  const cx = -0.002;
  const cy = 1.576;
  const cz = 0.05;
  const baseRx = 0.456;
  const baseRz = 0.474;

  const mapCyl = (theta, dy, dr) => [
    cx + Math.sin(theta) * (baseRx + dr),
    cy + dy,
    cz + Math.cos(theta) * (baseRz + dr),
  ];

  // Parametric closed loop around the visor opening in (theta, dy)
  const uMax = 0.68;
  const getVisorLoopPt = (angle, inset = 0) => {
    // Parameterize a stadium/goggle loop with a central nose notch along the bottom edge
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const theta = ca * (uMax - inset * 1.15);
    const halfH = 0.136 - inset;
    // Slight rounded rectangle / stadium shaping
    const superSin = Math.sign(sa) * Math.pow(Math.abs(sa), 0.72);
    let dy = superSin * halfH;
    // Brow arch across the top and ski-goggle nose notch in the bottom middle
    const normU = theta / uMax;
    if (sa >= 0) {
      dy -= 0.010 * normU * normU;
    } else {
      const notch = 0.048 * Math.exp(-Math.pow(theta / 0.17, 2)) * Math.pow(Math.abs(sa), 1.4);
      dy += notch;
    }
    return { theta, dy };
  };

  // 1. Curved semi-transparent cyan lens grid mapped directly onto Milo's head cylinder (zero chord clipping)
  const uSteps = 44;
  const vSteps = 14;
  const lensPos = [];
  const lensIdx = [];
  for (let iv = 0; iv <= vSteps; iv++) {
    const sv = iv / vSteps;
    for (let iu = 0; iu <= uSteps; iu++) {
      const su = iu / uSteps;
      const theta = -0.62 + su * 1.24;
      const yTop = 0.114 - 0.010 * Math.pow(theta / uMax, 2);
      const yBot = -0.114 + 0.046 * Math.exp(-Math.pow(theta / 0.17, 2));
      const dy = yBot + sv * (yTop - yBot);
      const bulge = 0.010 + 0.006 * Math.sin(sv * Math.PI) * Math.cos((theta / 0.62) * (Math.PI / 2));
      const [px, py, pz] = mapCyl(theta, dy, bulge);
      lensPos.push(px, py, pz);
    }
  }
  const lStride = uSteps + 1;
  for (let iv = 0; iv < vSteps; iv++) {
    for (let iu = 0; iu < uSteps; iu++) {
      const a0 = iv * lStride + iu;
      const a1 = a0 + 1;
      const b0 = (iv + 1) * lStride + iu;
      const b1 = b0 + 1;
      lensIdx.push(a0, a1, b1, a0, b1, b0);
    }
  }
  const lensGeo = new THREE.BufferGeometry();
  lensGeo.setAttribute("position", new THREE.Float32BufferAttribute(lensPos, 3));
  lensGeo.setIndex(lensIdx);
  lensGeo.computeVertexNormals();
  markDisposableGeo(lensGeo);
  group.add(new THREE.Mesh(lensGeo, lensMat));

  // 2. Sculpted 3D visor frame (annular radial grid between inner rim inset=0.024 and outer rim inset=0)
  const loopSteps = 80;
  const radSteps = 6;
  const frameDepth = 0.028;
  const framePos = [];
  const frameIdx = [];

  for (let layer = 0; layer < 2; layer++) {
    for (let ir = 0; ir <= radSteps; ir++) {
      const sr = ir / radSteps;
      const inset = (1 - sr) * 0.028;
      const bevel = Math.sin(sr * Math.PI);
      const dr = layer === 0 ? frameDepth * (0.72 + 0.28 * bevel) : -0.004;
      for (let i = 0; i <= loopSteps; i++) {
        const a = (i / loopSteps) * Math.PI * 2;
        const { theta, dy } = getVisorLoopPt(a, inset);
        const [px, py, pz] = mapCyl(theta, dy, dr);
        framePos.push(px, py, pz);
      }
    }
  }

  const fRingStride = loopSteps + 1;
  const fLayerStride = (radSteps + 1) * fRingStride;
  for (let ir = 0; ir < radSteps; ir++) {
    for (let i = 0; i < loopSteps; i++) {
      const a0 = ir * fRingStride + i;
      const a1 = a0 + 1;
      const b0 = (ir + 1) * fRingStride + i;
      const b1 = b0 + 1;
      frameIdx.push(a0, a1, b1, a0, b1, b0);

      const ia0 = fLayerStride + a0;
      const ia1 = fLayerStride + a1;
      const ib0 = fLayerStride + b0;
      const ib1 = fLayerStride + b1;
      frameIdx.push(ia0, ib1, ia1, ia0, ib0, ib1);
    }
  }
  for (let i = 0; i < loopSteps; i++) {
    const fIn0 = i;
    const fIn1 = i + 1;
    const bIn0 = fLayerStride + i;
    const bIn1 = fLayerStride + i + 1;
    frameIdx.push(fIn0, bIn0, bIn1, fIn0, bIn1, fIn1);

    const fOut0 = radSteps * fRingStride + i;
    const fOut1 = fOut0 + 1;
    const bOut0 = fLayerStride + fOut0;
    const bOut1 = bOut0 + 1;
    frameIdx.push(fOut0, fOut1, bOut1, fOut0, bOut1, bOut0);
  }

  const frameGeo = new THREE.BufferGeometry();
  frameGeo.setAttribute("position", new THREE.Float32BufferAttribute(framePos, 3));
  frameGeo.setIndex(frameIdx);
  frameGeo.computeVertexNormals();
  markDisposableGeo(frameGeo);
  group.add(new THREE.Mesh(frameGeo, frameMat));

  // Glowing inner rim tube around the visor lens perimeter
  const rimPts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const { theta, dy } = getVisorLoopPt(a, 0.024);
    const [px, py, pz] = mapCyl(theta, dy, frameDepth * 0.85);
    rimPts.push(new THREE.Vector3(px, py, pz));
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const rimGeo = markDisposableGeo(new THREE.TubeGeometry(rimCurve, 64, 0.006, 8, true));
  group.add(new THREE.Mesh(rimGeo, rimAccentMat));

  // Side straps curving from the visor frame into Milo's ear pods (z = 0.06)
  [-1, 1].forEach((side) => {
    const strap = buildArcPanel([
      { y: cy - 0.032, cx, cz, rx: 0.456, rz: 0.470, angle0: side > 0 ? 0.64 : -1.45, angle1: side > 0 ? 1.45 : -0.64 },
      { y: cy + 0.032, cx, cz, rx: 0.456, rz: 0.470, angle0: side > 0 ? 0.64 : -1.45, angle1: side > 0 ? 1.45 : -0.64 },
    ], 16, 0.020);
    group.add(new THREE.Mesh(strap, strapMat));
  });

  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 13. Leo's Sport Wristband — braided royal-blue & orange cord wrapping outside Leo's left wrist with a 3D soccer ball charm
const buildLeoBracelet = () => {
  const group = new THREE.Group();
  const blueMat = makeStdMat("#1d4ed8", { roughness: 0.30, metalness: 0.08 });
  const orangeMat = makeStdMat("#ea580c", { roughness: 0.30, metalness: 0.08 });
  const whiteMat = makeStdMat("#ffffff", { roughness: 0.25 });
  const blackMat = makeStdMat("#0f172a", { roughness: 0.35 });

  // Leo's left wrist at y = 0.62: outer x reaches -0.360, inner x reaches -0.245, z spans [0.002, 0.158]
  const wristGroup = new THREE.Group();
  wristGroup.position.set(-0.305, 0.620, 0.078);
  wristGroup.rotation.z = -0.10;
  wristGroup.rotation.x = 0.14;

  const rx = 0.082;
  const rz = 0.098;
  const beadCount = 16;
  const beadGeo = markDisposableGeo(new THREE.SphereGeometry(0.026, 16, 14));

  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    const x = Math.sin(a) * rx;
    const z = Math.cos(a) * rz;
    const y = Math.sin(a * 4) * 0.004;
    const bead = new THREE.Mesh(beadGeo, i % 2 === 0 ? blueMat : orangeMat);
    bead.position.set(x, y, z);
    bead.scale.set(1.15, 1.32, 1.15);
    wristGroup.add(bead);
  }

  // Underlying solid band so there are zero gaps between braided beads
  const ringPts = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.sin(a) * rx, 0, Math.cos(a) * rz));
  }
  const ringCurve = new THREE.CatmullRomCurve3(ringPts, true);
  const bandGeo = markDisposableGeo(new THREE.TubeGeometry(ringCurve, 36, 0.020, 10, true));
  wristGroup.add(new THREE.Mesh(bandGeo, blueMat));

  // Prominent 3D soccer ball charm on the front-outer (-X/+Z) side of Leo's wrist
  const charmAngle = -0.36;
  const charmGroup = new THREE.Group();
  charmGroup.position.set(
    Math.sin(charmAngle) * (rx + 0.024),
    0,
    Math.cos(charmAngle) * (rz + 0.024)
  );
  charmGroup.rotation.y = charmAngle;
  const ballGeo = markDisposableGeo(new THREE.SphereGeometry(0.040, 20, 16));
  charmGroup.add(new THREE.Mesh(ballGeo, whiteMat));

  const spotGeo = markDisposableGeo(new THREE.SphereGeometry(0.015, 10, 8));
  const spotDirs = [
    [0, 0, 1],
    [0.72, 0.52, 0.45],
    [-0.72, 0.52, 0.45],
    [0.45, -0.72, 0.52],
    [-0.45, -0.72, 0.52],
    [-0.85, 0, 0.52],
  ];
  spotDirs.forEach(([dx, dy, dz]) => {
    const len = Math.hypot(dx, dy, dz) || 1;
    const spot = new THREE.Mesh(spotGeo, blackMat);
    spot.position.set((dx / len) * 0.031, (dy / len) * 0.031, (dz / len) * 0.031);
    charmGroup.add(spot);
  });
  wristGroup.add(charmGroup);

  group.add(wristGroup);
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

// 14. Mia's Charm Bracelet — vibrant magenta, violet & pearl beads wrapping outside Mia's left wrist with a bold 3D heart charm
const buildMiaBracelet = () => {
  const group = new THREE.Group();
  const pinkMat = makeStdMat("#db2777", { roughness: 0.28, metalness: 0.08 });
  const purpleMat = makeStdMat("#9333ea", { roughness: 0.28, metalness: 0.08 });
  const whiteMat = makeStdMat("#ffffff", { roughness: 0.22, metalness: 0.1 });
  const heartMat = makeStdMat("#e11d48", { roughness: 0.25, metalness: 0.12 });
  const goldMat = makeStdMat("#fbbf24", { roughness: 0.25, metalness: 0.6 });

  const wristGroup = new THREE.Group();
  wristGroup.position.set(-0.312, 0.630, 0.082);
  wristGroup.rotation.z = -0.10;
  wristGroup.rotation.x = 0.14;

  const rx = 0.082;
  const rz = 0.098;
  const beadCount = 16;
  const beadGeo = markDisposableGeo(new THREE.SphereGeometry(0.026, 16, 14));
  const mats = [pinkMat, purpleMat, whiteMat];

  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    const bead = new THREE.Mesh(beadGeo, mats[i % mats.length]);
    bead.position.set(Math.sin(a) * rx, 0, Math.cos(a) * rz);
    bead.scale.set(1.12, 1.22, 1.12);
    wristGroup.add(bead);
  }

  // Underlying solid band so the bracelet forms a bold continuous cuff
  const ringPts = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.sin(a) * rx, 0, Math.cos(a) * rz));
  }
  const ringCurve = new THREE.CatmullRomCurve3(ringPts, true);
  const bandGeo = markDisposableGeo(new THREE.TubeGeometry(ringCurve, 36, 0.018, 10, true));
  wristGroup.add(new THREE.Mesh(bandGeo, pinkMat));

  // Bold 3D heart charm on the front-outer (-X/+Z) side of Mia's wrist
  const charmAngle = -0.35;
  const charmGroup = new THREE.Group();
  charmGroup.position.set(
    Math.sin(charmAngle) * (rx + 0.024),
    -0.016,
    Math.cos(charmAngle) * (rz + 0.024)
  );
  charmGroup.rotation.y = charmAngle;

  const ring = new THREE.Mesh(
    markDisposableGeo(new THREE.TorusGeometry(0.012, 0.0045, 8, 16)),
    goldMat
  );
  ring.position.set(0, 0.024, 0);
  charmGroup.add(ring);

  const heartPts = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - 1 * Math.cos(4 * t);
    heartPts.push(new THREE.Vector2(hx * 0.0023, (hy + 2.2) * 0.0023));
  }
  const heartGeo = markDisposableGeo(
    new THREE.ExtrudeGeometry(new THREE.Shape(heartPts), {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
    })
  );
  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.position.set(0, -0.012, -0.008);
  charmGroup.add(heartMesh);
  wristGroup.add(charmGroup);

  group.add(wristGroup);
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
};

const CUSTOM_BUILDERS = {
  "buddy-overalls": () => buildBuddyOveralls(),
  "buddy-cape": () => buildBuddyCape(),
  "rainbow-scarf": () => buildRainbowScarf(),
  "leo-cape": () => buildLeoCape(),
  "round-sky-glasses": () => buildRoundSkyGlasses(),
  "leo-hero-mask": () => buildLeoHeroMask(),
  "star-spark-glasses": () => buildStarSparkGlasses(),
  "mia-heart-sunglasses": () => buildMiaHeartSunglasses(),
  "milo-visor": () => buildMiloVisor(),
  "leo-bracelet": () => buildLeoBracelet(),
  "mia-bracelet": () => buildMiaBracelet(),
  "sport-shorts": () => {
    const g = buildLeoShorts("sport");
    g.add(buildLowerLegsAndSocks("leo-boy"));
    return g;
  },
  "comfy-shorts": () => {
    const g = buildLeoShorts("comfy");
    g.add(buildLowerLegsAndSocks("leo-boy"));
    return g;
  },
  "twirl-skirt": () => {
    const g = buildMiaSkirt("twirl");
    g.add(buildLowerLegsAndSocks("mia-girl"));
    return g;
  },
  "sport-skirt": () => {
    const g = buildMiaSkirt("sport");
    g.add(buildLowerLegsAndSocks("mia-girl"));
    return g;
  },
  "mia-pinafore": () => {
    const g = buildMiaPinafore();
    g.add(buildLowerLegsAndSocks("mia-girl"));
    return g;
  },
};

export const fitGeneratedAccessory = (source, fit, anchors, characterRoot = null) => {
  const itemId = fit?.itemId || null;
  const characterId = fit?.characterId || null;

  if (characterRoot && characterId && itemId) {
    tailorCharacterMeshForAccessory(characterRoot, characterId, itemId);
  }

  if (itemId && CUSTOM_BUILDERS[itemId]) {
    return [CUSTOM_BUILDERS[itemId]()];
  }

  const needsGeoClone =
    itemId === "buddy-medal" ||
    itemId === "milo-medal" ||
    itemId === "leo-medal" ||
    itemId === "heart-necklace" ||
    itemId === "milo-hard-hat" ||
    itemId === "milo-visor" ||
    itemId === "milo-rocket-boots" ||
    itemId === "leo-explorer-hat" ||
    itemId === "leo-hero-mask" ||
    itemId === "mia-flower-crown";

  const place = (mirror = false) => {
    const inner = cloneWithOwnMaterials(source, itemId, { cloneGeometry: needsGeoClone });

    if (
      itemId === "buddy-medal" ||
      itemId === "milo-medal" ||
      itemId === "leo-medal" ||
      itemId === "heart-necklace"
    ) {
      trimUpperRibbonVertices(inner, 0.58);
    } else if (itemId === "leo-explorer-hat") {
      trimLowerVertices(inner, 0.45, true);
    } else if (itemId === "milo-hard-hat") {
      trimLowerVertices(inner, 0.38, true);
    } else if (itemId === "milo-rocket-boots") {
      widenBootShaft(inner);
    } else if (itemId === "mia-flower-crown") {
      curveFlowerCrown(inner);
    } else if (itemId === "milo-visor") {
      contourVisorArms(inner);
    } else if (itemId === "leo-hero-mask") {
      contourHeroMaskStrap(inner);
    }

    if (itemId === "sparkle-wand") {
      inner.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color?.set("#ec4899");
          if (child.material.emissive) {
            child.material.emissive.set("#f59e0b");
            child.material.emissiveIntensity = 0.22;
          }
          child.material.roughness = 0.4;
        }
      });
    }

    inner.rotation.set(fit.rotationX || 0, fit.rotationY || 0, fit.rotationZ || 0, "XYZ");
    const pivot = new THREE.Group();
    pivot.add(inner);
    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    inner.position.sub(center);
    const rawSizeZ = size.z;

    const widthScale = fit.widthScale || 1;
    const heightScale = fit.heightScale || 1;
    const depthScale = fit.depthScale || 1;
    size.y *= heightScale;
    size.z *= depthScale;

    const a = anchors;
    const bodyZ = a.bodyZ ?? (a.chestFrontZ + a.backZ) / 2;
    const byWidth = (measure) => (measure * fit.size) / (size.x || 1);
    let scale = 1;
    let x = 0;
    let y = 0;
    let z = bodyZ;
    switch (fit.anchor) {
      case "head": {
        scale = byWidth(a.headWidth);
        const h = size.y * scale;
        y = (a.crownY ?? 2.0) - (fit.sink ?? 0.3) * h + h / 2;
        z = a.headZ;
        break;
      }
      case "eyes":
        scale = byWidth(a.headWidth);
        x = a.eyeX || 0;
        y = a.eyeY;
        z = a.faceZ + 0.06 - (size.z * scale) / 2;
        break;
      case "neckFront":
        scale = byWidth(a.torsoWidth);
        y = a.neckY - (size.y * scale) / 2;
        z = a.chestFrontZ + (size.z * scale) / 2;
        break;
      case "chest":
        scale = byWidth(a.torsoWidth);
        y = a.chestY;
        z = a.chestFrontZ + (size.z * scale) / 2;
        break;
      case "neckWrap":
        scale = byWidth(a.torsoWidth);
        y = a.neckY;
        break;
      case "back":
        scale = byWidth(a.torsoWidth);
        y = a.chestY - 0.1;
        z = a.backZ - (size.z * scale) / 2 + 0.04;
        break;
      case "backTop":
        scale = byWidth(a.torsoWidth);
        y = a.neckY - (size.y * scale) / 2;
        z = a.backZ - (size.z * scale) / 2 + 0.04;
        break;
      case "dress":
        scale = byWidth(a.torsoWidth);
        y = a.neckY - 0.02 - (size.y * scale) / 2;
        y = Math.max(y, (size.y * scale) / 2 + 0.04);
        break;
      case "waist":
        scale = byWidth(a.hipWidth);
        y = a.waistY + 0.06 - (size.y * scale) / 2;
        y = Math.max(y, (size.y * scale) / 2 + 0.04);
        break;
      case "feet": {
        const foot = mirror ? a.footLeft : a.footRight;
        scale = (a.footLength * fit.size) / (rawSizeZ || 1);
        [x, , z] = foot;
        y = (size.y * scale) / 2;
        break;
      }
      case "handLeft":
      case "handRight":
        scale = fit.size / (Math.max(size.x, size.y, size.z) || 1);
        [x, y, z] = fit.anchor === "handLeft" ? a.handLeft : a.handRight;
        break;
      default:
        break;
    }
    pivot.scale.set(
      scale * widthScale * (mirror ? -1 : 1),
      scale * heightScale,
      scale * depthScale
    );
    const offsetX = (fit.offsetX || 0) * (mirror ? -1 : 1);
    pivot.position.set(x + offsetX, y + (fit.offsetY || 0), z + (fit.offsetZ || 0));

    if (
      !mirror &&
      (itemId === "buddy-medal" ||
        itemId === "milo-medal" ||
        itemId === "leo-medal" ||
        itemId === "heart-necklace" ||
        itemId === "buddy-backpack" ||
        itemId === "leo-backpack" ||
        itemId === "rocket-pack" ||
        itemId === "buddy-bow-tie" ||
        itemId === "milo-bow-tie" ||
        itemId === "round-sky-glasses" ||
        itemId === "star-spark-glasses" ||
        itemId === "mia-heart-sunglasses")
    ) {
      const wrapper = new THREE.Group();
      wrapper.add(pivot);
      if (
        itemId === "buddy-medal" ||
        itemId === "milo-medal" ||
        itemId === "leo-medal" ||
        itemId === "heart-necklace"
      ) {
        wrapper.add(buildMedalNeckRibbon(itemId));
      } else if (
        itemId === "buddy-backpack" ||
        itemId === "leo-backpack" ||
        itemId === "rocket-pack"
      ) {
        wrapper.add(buildBackpackStraps(itemId));
      } else if (itemId === "buddy-bow-tie") {
        const collar = buildNeckCollarRing({
          y: 1.11, cx: 0, cz: -0.035, rx: 0.46, rz: 0.398, tubeR: 0.018, tiltX: 0.08,
        });
        wrapper.add(new THREE.Mesh(collar, makeStdMat("#dc2626", { roughness: 0.65 })));
      } else if (itemId === "milo-bow-tie") {
        const collar = buildNeckCollarRing({
          y: 1.26, cx: 0, cz: 0.03, rx: 0.385, rz: 0.375, tubeR: 0.016, tiltX: 0.05,
        });
        wrapper.add(new THREE.Mesh(collar, makeStdMat("#0284c7", { roughness: 0.4, metalness: 0.3 })));
      } else if (
        itemId === "round-sky-glasses" ||
        itemId === "star-spark-glasses" ||
        itemId === "mia-heart-sunglasses"
      ) {
        wrapper.add(buildGlassesTempleArms(itemId));
      }
      return wrapper;
    }

    return pivot;
  };
  return fit.anchor === "feet" ? [place(false), place(true)] : [place(false)];
};

// Dressed-character models (built by the ComfyUI + Blender "dressed" pipeline) carry
// their accessories as named nodes: `item__<id>` is the accessory, made together with
// the body so it already fits, and `body__<id>` is the body region it replaces (e.g. the
// hair under a hat), hidden while the item is worn. Returns the ids handled this way so
// callers don't also fit a separate accessory GLB for them.
export const applyDressedParts = (root, equippedIds = []) => {
  const worn = new Set(equippedIds);
  const handled = new Set();
  root.traverse((child) => {
    const match = /^(item|body)__(.+)$/.exec(child.name);
    if (!match) return;
    const [, kind, id] = match;
    if (kind === "item") {
      child.visible = worn.has(id);
      if (worn.has(id)) handled.add(id);
    } else {
      child.visible = !worn.has(id);
    }
  });
  return handled;
};
