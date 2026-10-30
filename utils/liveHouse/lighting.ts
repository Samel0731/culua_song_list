import * as THREE from 'three';
import { disposeObject } from './characters';

export function createStageLights(scene: THREE.Scene) {
  const group = new THREE.Group(); scene.add(group);
  let displayedTime = 0;
  const axis = new THREE.Vector3(0, -1, 0), direction = new THREE.Vector3(), midpoint = new THREE.Vector3();
  const lamps = [-1, 1].map(side => {
    const light = new THREE.SpotLight('#b875ff', 70, 15, .23, .7);
    light.position.set(side * 4, 5.3, -1.5); group.add(light, light.target);
    const material = new THREE.MeshBasicMaterial({ color: light.color, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24, 1, true), material); group.add(beam);
    const poolMaterial = new THREE.MeshBasicMaterial({ color: light.color, transparent: true, opacity: .13, depthWrite: false, blending: THREE.AdditiveBlending });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 32), poolMaterial); pool.rotation.x = -Math.PI / 2; group.add(pool);
    const rim = new THREE.PointLight('#b875ff', 28, 7); rim.position.set(side * 3, 2.7, -2.5); group.add(rim);
    return { side, light, beam, material, pool, poolMaterial, rim, targetColor: light.color.clone() };
  });
  return {
    colors(color: string, accent: string) {
      lamps.forEach(lamp => {
        const value = lamp.side < 0 ? color : accent;
        lamp.targetColor.set(value);
      });
    },
    update(time: number | null, trio: boolean) {
      if (time !== null) displayedTime = time;
      lamps.forEach(({ side, light, beam, pool, rim, targetColor, material, poolMaterial }) => {
        light.color.lerp(targetColor, time === null ? 1 : .06);
        material.color.copy(light.color); poolMaterial.color.copy(light.color); rim.color.copy(light.color);
        const t = displayedTime;
        light.target.position.set(side * 1.8 + Math.sin(t * .24 + side) * 1.2, .03, .7 + Math.cos(t * .2 + side) * .5);
        direction.copy(light.target.position).sub(light.position);
        const length = direction.length(), radius = Math.tan(light.angle) * length;
        midpoint.copy(light.position).add(light.target.position).multiplyScalar(.5);
        beam.position.copy(midpoint); beam.quaternion.setFromUnitVectors(axis, direction.normalize()); beam.scale.set(radius, length, radius);
        pool.position.copy(light.target.position); pool.scale.setScalar(radius);
        rim.intensity = trio ? 38 : 22;
      });
    },
    dispose() { disposeObject(group); },
  };
}
