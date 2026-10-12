import { Matrix4, Raycaster, Sphere, Vector3 } from 'three';

const samplers = new WeakMap();

// Sphere UVs identify the handful of terrain triangles below a scenery point.
// Test those exact triangles, rather than raycasting the whole globe per vertex.
export function createPlanetTerrainSampler(terrain) {
  const geometry = terrain.geometry;
  const grid = geometry.userData.surfaceGrid || geometry.parameters;
  const fallback = new Raycaster();
  const slowSample = (ray) => {
    fallback.ray.copy(ray);
    return fallback.intersectObject(terrain, false)[0]?.point;
  };
  if (!grid?.widthSegments || !grid?.heightSegments || !geometry.attributes.uv) return slowSample;

  const width = grid.widthSegments;
  const height = grid.heightSegments;
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const index = geometry.index;
  const triangles = new Map();
  const cellKey = (x, y) => `${(x % width + width) % width},${Math.max(0, Math.min(height - 1, y))}`;
  let radius = 0;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let i = 0; i < positions.count; i += 1) radius = Math.max(radius, a.fromBufferAttribute(positions, i).length());
  const sphere = new Sphere(new Vector3(), radius);
  const count = index ? index.count : positions.count;
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map((j) => index ? index.getX(i + j) : i + j);
    const x = Math.floor(ids.reduce((sum, id) => sum + uv.getX(id), 0) * width / 3);
    const y = Math.floor((1 - ids.reduce((sum, id) => sum + uv.getY(id), 0) / 3) * height);
    const key = cellKey(x, y);
    if (!triangles.has(key)) triangles.set(key, []);
    triangles.get(key).push(ids);
  }

  return (ray) => {
    const localRay = ray.clone().applyMatrix4(terrain.matrixWorld.clone().invert());
    const approximate = localRay.intersectSphere(sphere, new Vector3());
    if (!approximate) return undefined;
    approximate.normalize();
    const phi = (Math.atan2(approximate.z, -approximate.x) + Math.PI * 2) % (Math.PI * 2);
    const x = Math.floor(phi * width / (Math.PI * 2));
    const y = Math.floor(Math.acos(Math.max(-1, Math.min(1, approximate.y))) * height / Math.PI);
    let nearest;
    let distance = Infinity;
    const hit = new Vector3();
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      for (const ids of triangles.get(cellKey(x + dx, y + dy)) || []) {
        a.fromBufferAttribute(positions, ids[0]);
        b.fromBufferAttribute(positions, ids[1]);
        c.fromBufferAttribute(positions, ids[2]);
        if (!localRay.intersectTriangle(a, b, c, true, hit)) continue;
        const d = localRay.origin.distanceToSquared(hit);
        if (d < distance) { distance = d; nearest = hit.clone(); }
      }
    }
    return nearest ? nearest.applyMatrix4(terrain.matrixWorld) : slowSample(ray);
  };
}

// Conform a static scenery assembly to the actual terrain triangles. Every
// point keeps its height above the ground, so foundations, posts, paths and
// roots follow the globe while roofs and branches remain above them.
export function groundPlanetScenery(root, terrain, embed = 0.008) {
  root.updateWorldMatrix(true, true);
  terrain.updateWorldMatrix(true, false);
  const toRoot = root.matrixWorld.clone().invert();
  const down = new Vector3(0, -1, 0).transformDirection(root.matrixWorld);
  const raycaster = new Raycaster();
  if (!samplers.has(terrain)) samplers.set(terrain, createPlanetTerrainSampler(terrain));
  const sampleTerrain = samplers.get(terrain);
  const heights = new Map();
  const geometries = [];
  const point = new Vector3();
  const origin = new Vector3();

  root.traverse((object) => {
    if (!object.isMesh) return;
    const meshToRoot = new Matrix4().multiplyMatrices(toRoot, object.matrixWorld);
    const rootToMesh = meshToRoot.clone().invert();
    const geometry = object.geometry.clone();
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i += 1) {
      point.fromBufferAttribute(vertices, i).applyMatrix4(meshToRoot);
      const key = `${point.x.toFixed(6)},${point.z.toFixed(6)}`;
      if (!heights.has(key)) {
        origin.set(point.x, 2, point.z).applyMatrix4(root.matrixWorld);
        raycaster.set(origin, down);
        const hit = sampleTerrain(raycaster.ray);
        if (!hit) throw new Error('Planet scenery extends beyond the terrain.');
        heights.set(key, hit.applyMatrix4(toRoot).y);
      }
      point.y += heights.get(key) - embed;
      point.applyMatrix4(rootToMesh);
      vertices.setXYZ(i, point.x, point.y, point.z);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    object.geometry = geometry;
    geometries.push(geometry);
  });
  return geometries;
}
