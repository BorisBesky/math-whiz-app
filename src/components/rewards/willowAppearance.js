import * as THREE from "three";

export const WILLOW_CHARACTER_ID = "willow-wizard";

const FACE_WINDOW = { minX: -0.3, maxX: 0.5, minY: -0.05, maxY: 0.45 };

// Traced on wizard_parts.glb in head LOCAL coordinates, before normalization.
// The carved face is asymmetric; mirrored ellipses miss the lids and brows.
export const WILLOW_FACE_LANDMARKS = {
  leftEye: [[-0.186, 0.2722], [-0.1431, 0.2787], [-0.0989, 0.2826], [-0.0677, 0.2774], [-0.0352, 0.2591], [-0.0118, 0.2306], [0.0077, 0.1955], [0.0142, 0.1747], [-0.0326, 0.1734], [-0.0742, 0.1799], [-0.1145, 0.1968], [-0.147, 0.2215], [-0.1678, 0.2488]],
  rightEye: [[0.2053, 0.1812], [0.2118, 0.2202], [0.2287, 0.2527], [0.2586, 0.2747], [0.2937, 0.2813], [0.3483, 0.2761], [0.3873, 0.28], [0.3782, 0.2462], [0.3652, 0.2111], [0.3392, 0.1864], [0.3002, 0.1721], [0.2495, 0.1669], [0.217, 0.1708]],
  leftBrow: [[-0.2445, 0.4022], [-0.225, 0.3775], [-0.186, 0.3684], [-0.1405, 0.3697], [-0.1067, 0.3619], [-0.0703, 0.3424], [-0.0313, 0.3176]],
  rightBrow: [[0.2066, 0.3164], [0.243, 0.3397], [0.2755, 0.3567], [0.3145, 0.3658], [0.3678, 0.367], [0.4094, 0.3814], [0.4341, 0.4022]],
  leftShadow: [[-0.225, 0.3294], [-0.1873, 0.3216], [-0.1353, 0.3306], [-0.1015, 0.3268], [-0.0638, 0.3059], [-0.0339, 0.2839]],
  rightShadow: [[0.2352, 0.2917], [0.269, 0.3176], [0.3015, 0.3268], [0.3509, 0.3241], [0.3873, 0.3294], [0.4224, 0.3359]],
  lips: [[0.0506, 0.0044], [0.0714, 0.0122], [0.0935, 0.0161], [0.1117, 0.0109], [0.1299, 0.0161], [0.152, 0.0109], [0.1676, 0.0031], [0.1455, -0.0047], [0.1143, -0.006], [0.0805, -0.0047]],
  leftIris: { x: -0.09, y: 0.233, rx: 0.04, ry: 0.049 },
  rightIris: { x: 0.3, y: 0.234, rx: 0.04, ry: 0.049 },
  leftBlush: { x: -0.17, y: 0.075, rx: 0.072, ry: 0.034 },
  rightBlush: { x: 0.36, y: 0.075, rx: 0.072, ry: 0.034 },
};

const smoothstep = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const mix = (base, tint, weight) => base.map((value, i) => value + (tint[i] - value) * weight);
// BufferAttribute colors, unlike CSS/material colors, must already be linear.
const linearRgb = (hex) => new THREE.Color(hex).toArray();
const sclera = linearRgb("#fff4e6");
const pupil = linearRgb("#111827");

const segmentDistance = (x, y, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = THREE.MathUtils.clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
};

const contourWeight = (x, y, points, feather = 0.006) => {
  let inside = false;
  let distance = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    distance = Math.min(distance, segmentDistance(x, y, a, b));
  }
  return smoothstep(-feather, feather, inside ? distance : -distance);
};

const strokeWeight = (x, y, points, width) => {
  let distance = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    distance = Math.min(distance, segmentDistance(x, y, points[i - 1], points[i]));
  }
  return 1 - smoothstep(width * 0.3, width, distance);
};

const ellipseRadius = (x, y, { x: cx, y: cy, rx, ry }) => Math.hypot((x - cx) / rx, (y - cy) / ry);

export const paintWillowFaceVertexColor = (x, y, z, skinRgb, tints) => {
  // Exclude the back of the head and ears, with a soft depth boundary.
  const front = smoothstep(0.035, 0.09, z);
  if (!front || y < -0.03 || y > 0.43 || x < -0.29 || x > 0.47) return skinRgb;
  let color = skinRgb;
  const layer = (tint, weight) => { color = mix(color, tint, weight * front); };
  const features = WILLOW_FACE_LANDMARKS;
  [features.leftBlush, features.rightBlush].forEach((cheek) => {
    layer(tints.blush, (1 - smoothstep(0, 1, ellipseRadius(x, y, cheek))) * 0.32);
  });
  [features.leftShadow, features.rightShadow].forEach((path) => layer(tints.shadow, strokeWeight(x, y, path, 0.021) * 0.48));
  [features.leftBrow, features.rightBrow].forEach((path) => layer(tints.brows, strokeWeight(x, y, path, 0.012) * 0.95));
  layer(tints.lips, contourWeight(x, y, features.lips, 0.005) * 0.9);
  [[features.leftEye, features.leftIris], [features.rightEye, features.rightIris]].forEach(([outline, iris]) => {
    const eye = contourWeight(x, y, outline);
    if (!eye) return;
    layer(sclera, eye);
    const radius = ellipseRadius(x, y, iris);
    layer(tints.eyes, eye * (1 - smoothstep(0.85, 1, radius)));
    layer(pupil, eye * (1 - smoothstep(0.36, 0.48, radius)));
  });
  return color;
};

const facePalette = (colors) => ({
  eyes: linearRgb(colors.eyes || "#2563eb"),
  brows: linearRgb(colors.brows || "#4a044e"),
  lips: linearRgb(colors.lips || "#db2777"),
  blush: linearRgb(colors.blush || "#fb7185"),
  shadow: linearRgb(colors.eyeshadow || "#a78bfa"),
});

const createFaceTexture = (colors) => {
  // Paint at texture resolution: the sculpt has sparse triangles inside the
  // eyes, so vertex colors produce jagged irises even with correct landmarks.
  const width = 768;
  const height = 480;
  const skin = linearRgb(colors.head || "#f2c7a0");
  const tints = facePalette(colors);
  const data = new Uint8Array(width * height * 4);
  const pixel = new THREE.Color();
  for (let row = 0; row < height; row += 1) {
    const y = FACE_WINDOW.minY + (row + 0.5) / height * (FACE_WINDOW.maxY - FACE_WINDOW.minY);
    for (let col = 0; col < width; col += 1) {
      const x = FACE_WINDOW.minX + (col + 0.5) / width * (FACE_WINDOW.maxX - FACE_WINDOW.minX);
      pixel.fromArray(paintWillowFaceVertexColor(x, y, 1, skin, tints)).convertLinearToSRGB();
      const offset = (row * width + col) * 4;
      data[offset] = Math.round(pixel.r * 255);
      data[offset + 1] = Math.round(pixel.g * 255);
      data[offset + 2] = Math.round(pixel.b * 255);
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

export const applyWillowHeadFaceUVs = (geometry) => {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    // Continuous projection on ALL vertices. No abrupt UV island boundary that
    // could smear a painted feature across triangles at the face's edge.
    uv[i * 2] = (position.getX(i) - FACE_WINDOW.minX) / (FACE_WINDOW.maxX - FACE_WINDOW.minX);
    uv[i * 2 + 1] = (position.getY(i) - FACE_WINDOW.minY) / (FACE_WINDOW.maxY - FACE_WINDOW.minY);
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
};

export const applyWillowHeadTexture = (root, colors = {}) => {
  root.traverse((child) => {
    if (!child.isMesh || child.name !== "part_0_head") return;
    // Do not mutate shared cached GLB geometry or another viewer's face colors.
    // The viewer disposes this private copy when the instance is unmounted.
    if (!child.geometry.userData.willowFaceInstance) {
      child.geometry = child.geometry.clone();
      child.geometry.userData.willowFaceInstance = true;
    }
    applyWillowHeadFaceUVs(child.geometry);
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.userData.willowFaceMap) material.map?.dispose();
      material.map = createFaceTexture(colors);
      material.userData.willowFaceMap = true;
      material.vertexColors = false;
      material.color.set("#ffffff");
      material.roughness = 0.78;
      material.metalness = 0;
      material.onBeforeCompile = (shader) => {
        shader.uniforms.willowSkin = { value: new THREE.Color(colors.head || "#f2c7a0") };
        shader.vertexShader = `varying float vWillowDepth;\n${shader.vertexShader}`
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWillowDepth = position.z;");
        shader.fragmentShader = `varying float vWillowDepth;\nuniform vec3 willowSkin;\n${shader.fragmentShader}`
          .replace("#include <map_fragment>", `
            #include <map_fragment>
            diffuseColor.rgb = mix(willowSkin, diffuseColor.rgb, smoothstep(0.035, 0.09, vWillowDepth));
          `);
      };
      material.customProgramCacheKey = () => "willow-sculpt-face-v1";
      material.needsUpdate = true;
    });
  });
};

export const improveWillowMaterials = (root) => {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const name = child.name || "";
      material.roughness = 0.8;
      material.metalness = 0;
      if (name.includes("orb")) {
        material.roughness = 0.25;
        material.metalness = 0.15;
        material.userData.glow = true;
        material.emissive.copy(material.color);
        material.emissiveIntensity = 0.25;
      } else if (name.includes("staff")) {
        material.roughness = 0.45;
        material.metalness = 0.2;
      }
    });
  });
};
