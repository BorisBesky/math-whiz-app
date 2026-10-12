import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Ray, Raycaster, SphereGeometry, Vector3 } from 'three';
import { createPlanetTerrainSampler, groundPlanetScenery } from '../planetGrounding';

function makeTerrain(nonIndexed = false) {
  let geometry = new SphereGeometry(4, 40, 24);
  if (nonIndexed) geometry = geometry.toNonIndexed();
  geometry.userData.surfaceGrid = { widthSegments: 40, heightSegments: 24 };
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i += 1) {
    const p = new Vector3().fromBufferAttribute(vertices, i).normalize();
    p.multiplyScalar(4 + Math.sin(p.x * 19) * Math.cos(p.z * 15) * 0.014);
    vertices.setXYZ(i, p.x, p.y, p.z);
  }
  const terrain = new Mesh(geometry, new MeshBasicMaterial());
  terrain.updateWorldMatrix(true, false);
  return terrain;
}

test.each([false, true])('terrain sampling matches rendered triangles across the globe (non-indexed: %s)', (nonIndexed) => {
  const terrain = makeTerrain(nonIndexed);
  terrain.position.set(1, -2, 3);
  terrain.rotation.y = 0.35;
  terrain.updateWorldMatrix(true, false);
  const sample = createPlanetTerrainSampler(terrain);
  const reference = new Raycaster();
  for (let i = 0; i < 51; i += 1) {
    const y = -1 + i * 2 / 50;
    const longitude = i * 2.4;
    const normal = new Vector3(Math.sqrt(1 - y * y) * Math.cos(longitude), y, Math.sqrt(1 - y * y) * Math.sin(longitude));
    const origin = normal.clone().multiplyScalar(8).add(new Vector3(0.12, 0, -0.08)).applyMatrix4(terrain.matrixWorld);
    const direction = normal.clone().negate().transformDirection(terrain.matrixWorld);
    const ray = new Ray(origin, direction);
    reference.ray.copy(ray);
    const actual = reference.intersectObject(terrain, false)[0].point;
    expect(sample(ray).distanceTo(actual)).toBeLessThan(1e-6);
  }
});

test('scaled house foundations, fence posts and stepping stones contact the curved terrain', () => {
  const terrain = makeTerrain();
  const root = new Group();
  root.position.y = 4;
  const house = new Group();
  house.position.set(0.65, 0, -0.4);
  house.scale.setScalar(0.75);
  root.add(house);
  const foundation = new Mesh(new BoxGeometry(0.66, 0.075, 0.55), new MeshBasicMaterial());
  foundation.position.y = 0.025;
  house.add(foundation);
  const post = new Mesh(new BoxGeometry(0.035, 0.29, 0.035), new MeshBasicMaterial());
  post.position.set(-0.8, 0.13, 0.7);
  root.add(post);
  const stone = new Mesh(new BoxGeometry(0.09, 0.025, 0.07), new MeshBasicMaterial());
  stone.position.set(0.6, 0.006, 0.9);
  root.add(stone);
  root.updateWorldMatrix(true, true);

  const supports = [foundation, post, stone].map((mesh) => {
    const original = mesh.geometry;
    const vertices = original.attributes.position;
    const indices = [];
    for (let i = 0; i < vertices.count; i += 1) {
      if (vertices.getY(i) < 0) indices.push(i);
    }
    return { mesh, original, indices };
  });
  const ground = new Raycaster();
  const gap = (mesh, i) => {
    const p = new Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld);
    ground.set(p.clone().add(new Vector3(0, 1, 0)), new Vector3(0, -1, 0));
    return p.y - ground.intersectObject(terrain, false)[0].point.y;
  };
  const before = supports.flatMap(({ mesh, indices }) => indices.map((i) => gap(mesh, i)));
  expect(Math.max(...before)).toBeGreaterThan(0.1);

  groundPlanetScenery(root, terrain);
  const after = supports.flatMap(({ mesh, indices }) => indices.map((i) => gap(mesh, i)));
  expect(Math.max(...after)).toBeLessThan(-0.005);
  expect(Math.min(...after)).toBeGreaterThan(-0.035);
  supports.forEach(({ mesh, original }) => expect(mesh.geometry).not.toBe(original));
});

test('grounding preserves shared source geometry and the height of above-ground parts', () => {
  const terrain = makeTerrain();
  const root = new Group();
  root.position.y = 4;
  const original = new BoxGeometry(0.4, 0.2, 0.3);
  const before = Array.from(original.attributes.position.array);
  const seat = new Mesh(original, new MeshBasicMaterial());
  seat.position.set(0.9, 0.3, -0.5);
  root.add(seat);
  const cloned = groundPlanetScenery(root, terrain);
  const ground = new Raycaster();
  const heights = [];
  for (let i = 0; i < seat.geometry.attributes.position.count; i += 1) {
    const p = new Vector3().fromBufferAttribute(seat.geometry.attributes.position, i).applyMatrix4(seat.matrixWorld);
    ground.set(p.clone().add(new Vector3(0, 1, 0)), new Vector3(0, -1, 0));
    heights.push(p.y - ground.intersectObject(terrain, false)[0].point.y);
  }
  expect(Math.min(...heights)).toBeCloseTo(0.192, 5);
  expect(Math.max(...heights)).toBeCloseTo(0.392, 5);
  expect(Array.from(original.attributes.position.array)).toEqual(before);
  expect(cloned).toEqual([seat.geometry]);
});
