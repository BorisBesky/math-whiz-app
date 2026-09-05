import * as THREE from 'three';

let cachedThumbnails;

// Use the actual scenery models, with a camera fitted to each reward. Reuse
// the viewer's renderer instead of allocating eighteen extra WebGL contexts.
export function renderPlanetThumbnails(renderer, previewGroups) {
  if (cachedThumbnails) return cachedThumbnails;
  const thumbnails = {};
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  scene.add(new THREE.HemisphereLight('#ffffff', '#8097a3', 2.4));
  const light = new THREE.DirectionalLight('#ffffff', 3);
  light.position.set(-3, 6, 5);
  scene.add(light);
  const pixelRatio = renderer.getPixelRatio();
  const size = renderer.getSize(new THREE.Vector2());
  const shadows = renderer.shadowMap.enabled;
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(256, 192, false);
    renderer.shadowMap.enabled = false;
    previewGroups.forEach((model, id) => {
      model.visible = true;
      scene.add(model);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      camera.position.copy(center).add(new THREE.Vector3(3, 2.6, 4));
      camera.lookAt(center);
      camera.updateMatrixWorld();
      const projected = bounds.clone().applyMatrix4(camera.matrixWorldInverse);
      const extent = projected.getSize(new THREE.Vector3());
      const height = Math.max(extent.y, extent.x * 3 / 4) * 1.2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.left = -height * 2 / 3;
      camera.right = height * 2 / 3;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      thumbnails[id] = renderer.domElement.toDataURL('image/webp', 0.88);
      scene.remove(model);
    });
    cachedThumbnails = thumbnails;
    return thumbnails;
  } finally {
    scene.clear();
    renderer.shadowMap.enabled = shadows;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(size.x, size.y, false);
  }
}
