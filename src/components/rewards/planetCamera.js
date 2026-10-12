import { Quaternion, Vector3 } from 'three';

// Keyboard and automatic rotation use the camera's screen axes, just like a
// trackball drag. Rotating its up vector too avoids a singularity at either pole.
export function rotatePlanetCamera(camera, target, yaw = 0, pitch = 0) {
  const rotate = (axis, angle) => {
    if (!angle) return;
    axis.applyQuaternion(camera.quaternion).normalize();
    const rotation = new Quaternion().setFromAxisAngle(axis, angle);
    camera.position.sub(target).applyQuaternion(rotation).add(target);
    camera.up.applyQuaternion(rotation).normalize();
    camera.lookAt(target);
  };
  rotate(new Vector3(0, 1, 0), yaw);
  rotate(new Vector3(1, 0, 0), pitch);
}
