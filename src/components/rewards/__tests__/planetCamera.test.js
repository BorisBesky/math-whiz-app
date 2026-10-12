import { PerspectiveCamera, Vector3 } from 'three';
import { rotatePlanetCamera } from '../planetCamera';

function createView(target = new Vector3()) {
  const camera = new PerspectiveCamera();
  camera.position.copy(target).add(new Vector3(0, 0, 15));
  camera.lookAt(target);
  return camera;
}

test.each([-1, 1])('horizontal rotation moves away from pole %s instead of spinning in place', (pole) => {
  const target = new Vector3();
  const camera = createView();
  rotatePlanetCamera(camera, target, 0, pole * Math.PI / 2);
  expect(Math.abs(camera.position.y)).toBeCloseTo(15);

  rotatePlanetCamera(camera, target, Math.PI / 6);
  expect(Math.abs(camera.position.x)).toBeCloseTo(7.5);
  expect(Math.abs(camera.position.y)).toBeLessThan(14);
  expect(camera.position.length()).toBeCloseTo(15);
});

test('vertical rotation continues beyond both poles and completes a full revolution', () => {
  const target = new Vector3();
  const camera = createView();
  const positions = [];
  for (let i = 0; i < 24; i += 1) {
    rotatePlanetCamera(camera, target, 0, Math.PI / 12);
    positions.push(camera.position.clone());
  }
  expect(positions[6].z).toBeLessThan(-3);
  expect(positions[16].z).toBeLessThan(-3);
  expect(camera.position.distanceTo(new Vector3(0, 0, 15))).toBeLessThan(1e-10);
  expect(camera.up.distanceTo(new Vector3(0, 1, 0))).toBeLessThan(1e-10);
});

test('right stays relative to the screen when the planet is upside down', () => {
  const target = new Vector3();
  const camera = createView();
  rotatePlanetCamera(camera, target, 0, Math.PI);
  const before = camera.position.clone();
  const screenRight = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  rotatePlanetCamera(camera, target, 0.15);
  expect(camera.position.clone().sub(before).dot(screenRight)).toBeGreaterThan(2);
});

test('mixed rotations preserve the distance to a focused item and a valid camera orientation', () => {
  const target = new Vector3(3, -2, 4);
  const camera = createView(target);
  for (let i = 0; i < 300; i += 1) rotatePlanetCamera(camera, target, 0.09, -0.13);
  expect(camera.position.distanceTo(target)).toBeCloseTo(15, 10);
  expect(camera.up.length()).toBeCloseTo(1, 10);
  expect(camera.quaternion.length()).toBeCloseTo(1, 10);
  expect(camera.getWorldDirection(new Vector3()).dot(target.clone().sub(camera.position).normalize())).toBeCloseTo(1, 10);
});
