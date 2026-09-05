import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Minus, Plus, RotateCcw, Pause, Play } from 'lucide-react';
import { buildPlanetWorld, planetNormal } from './planetScene';
import { getPlanetItem } from './planetConfig';
import { renderPlanetThumbnails } from './planetThumbnails';

export default function PlanetViewer({ visibleItems, focusItemId, resetKey = 0, onThumbnailsReady }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const visibleKey = [...visibleItems].sort().join(',');

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (_) {
      setFailed(true);
      return undefined;
    }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Your 3D little planet. Drag to rotate. Use arrow keys to look around and plus or minus to zoom.');
    host.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
    const home = new THREE.Vector3(0, 2.8, 15);
    camera.position.copy(home);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 7.5;
    controls.maxDistance = 21;
    controls.rotateSpeed = 0.65;
    controls.autoRotateSpeed = 0.5;
    scene.add(new THREE.HemisphereLight('#f8fbff', '#7183a1', 2.2));
    const sun = new THREE.DirectionalLight('#ffffff', 3);
    sun.position.set(-5, 10, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 35 });
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    const planet = buildPlanetWorld();
    scene.add(planet.world);
    if (onThumbnailsReady) {
      try { onThumbnailsReady(renderPlanetThumbnails(renderer, planet.previewGroups)); }
      catch (_) { /* The shop keeps its category icons if image capture is unavailable. */ }
    }
    let targetPosition = null;
    let targetLookAt = null;
    let lost = false;
    let inView = true;
    let ready = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const zoom = (factor) => {
      targetPosition = null;
      targetLookAt = null;
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    const api = {
      setVisible: (ids) => {
        planet.itemGroups.forEach((g, id) => { g.visible = ids.includes(id); });
        canvas.dataset.visibleItems = ids.join(',');
      },
      focus: (id) => {
        const item = getPlanetItem(id);
        if (item) {
          const normal = planetNormal(item.position);
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal));
          const elevation = item.kind === 'balloon' ? 1.4 : 0.4;
          targetLookAt = normal.clone().multiplyScalar(planet.radius + elevation);
          targetPosition = targetLookAt.clone().addScaledVector(normal, 3.1).addScaledVector(forward, 3.2);
          controls.minDistance = 3.2;
        } else {
          targetPosition = home.clone();
          targetLookAt = new THREE.Vector3();
          controls.minDistance = 7.5;
        }
        if (reducedMotion.matches) {
          camera.position.copy(targetPosition);
          controls.target.copy(targetLookAt);
          targetPosition = targetLookAt = null;
          controls.update();
        }
      },
      spin: (value) => { controls.autoRotate = value; },
      zoom,
    };
    apiRef.current = api;
    const stopFocus = () => { targetPosition = targetLookAt = null; };
    controls.addEventListener('start', stopFocus);
    const onKey = (event) => {
      if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); zoom(['+', '='].includes(event.key) ? 0.87 : 1.15); }
      if (event.key === 'Home') { event.preventDefault(); api.focus(null); }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      targetPosition = targetLookAt = null;
      const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      s.theta += event.key === 'ArrowLeft' ? -0.15 : event.key === 'ArrowRight' ? 0.15 : 0;
      s.phi = THREE.MathUtils.clamp(s.phi + (event.key === 'ArrowUp' ? -0.15 : event.key === 'ArrowDown' ? 0.15 : 0), 0.05, Math.PI - 0.05);
      camera.position.setFromSpherical(s).add(controls.target);
      controls.update();
    };
    const onLost = (event) => { event.preventDefault(); lost = true; setFailed(true); };
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('webglcontextlost', onLost);
    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < height ? 46 : 40;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    intersection.observe(host);
    let frame;
    let lastTime = performance.now();
    let time = 0;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (lost || document.hidden || !inView) return;
      if (!reducedMotion.matches) time += dt;
      if (targetPosition) {
        camera.position.lerp(targetPosition, 1 - Math.exp(-dt * 5));
        controls.target.lerp(targetLookAt, 1 - Math.exp(-dt * 5));
        if (camera.position.distanceTo(targetPosition) < 0.015 && controls.target.distanceTo(targetLookAt) < 0.015) targetPosition = targetLookAt = null;
      }
      controls.update(dt);
      // Focused previews can zoom closer to a landmark. Keep the camera above
      // the ground when students orbit around that off-center target.
      if (camera.position.length() < planet.radius + 0.65) {
        camera.position.setLength(planet.radius + 0.65);
        camera.lookAt(controls.target);
      }
      planet.update(time);
      renderer.render(scene, camera);
      if (!ready) { canvas.dataset.ready = 'true'; ready = true; }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      apiRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('webglcontextlost', onLost);
      controls.removeEventListener('start', stopFocus);
      controls.dispose();
      planet.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [attempt, onThumbnailsReady]);

  useEffect(() => { apiRef.current?.setVisible(visibleKey ? visibleKey.split(',') : []); }, [visibleKey, attempt]);
  useEffect(() => { apiRef.current?.focus(focusItemId); }, [focusItemId, resetKey, attempt]);
  useEffect(() => { apiRef.current?.spin(spinning); }, [spinning, attempt]);

  return (
    <div className="planet-stage">
      <div ref={containerRef} className="planet-canvas" data-testid="planet-viewer" />
      {failed && (
        <div className="planet-fallback" role="alert">
          <strong>Your planet needs 3D graphics.</strong>
          <p>Enable graphics acceleration or try another browser. Your collection is saved.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </div>
      )}
      <div className="planet-camera-tools" aria-label="Planet view controls">
        <button type="button" aria-label="Zoom in" onClick={() => apiRef.current?.zoom(0.87)}><Plus size={17} /></button>
        <button type="button" aria-label="Zoom out" onClick={() => apiRef.current?.zoom(1.15)}><Minus size={17} /></button>
        <button type="button" aria-label="Reset planet view" onClick={() => apiRef.current?.focus(null)}><RotateCcw size={16} /></button>
        <button type="button" aria-label={spinning ? 'Pause planet rotation' : 'Rotate planet automatically'} aria-pressed={spinning} onClick={() => setSpinning(!spinning)}>{spinning ? <Pause size={15} /> : <Play size={15} />}</button>
      </div>
    </div>
  );
}
