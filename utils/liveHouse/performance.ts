import * as THREE from 'three';
import type { CharacterRig } from './characters';
import type { stageSlots } from './stageLayout';

type Slot = ReturnType<typeof stageSlots>[number];
export type Pose = 'idle' | 'step' | 'run' | 'wave' | 'jump';

// Independent timing within separate depth lanes keeps the cast apart.
export function performanceAt(slot: Slot, seconds: number, _seed: number, ensemble = false) {
  if (ensemble) {
    const phase = seconds % 24;
    const response = slot.lead ? phase >= 8 && phase < 11 : phase >= 11 && phase < 14;
    const jumping = phase >= 18 && phase < 19.2;
    const moving = phase < 8;
    const offset = moving ? Math.sin(phase / 8 * Math.PI * 2) * .5 : 0;
    const pose: Pose = jumping ? 'jump' : response ? 'wave' : moving ? 'step' : 'idle';
    return { x: slot.x + offset, z: slot.z, jump: jumping ? Math.sin((phase - 18) / 1.2 * Math.PI) * .35 : 0, pose,
      yaw: phase >= 8 && phase < 14 && !slot.lead ? -Math.sign(slot.x) * .4 : 0 };
  }
  const phase = seconds % 24;
  const moving = phase < 8;
  const offset = moving ? Math.sin(phase / 8 * Math.PI * 2) * Math.max(0, Math.min(.6, 4.5 - Math.abs(slot.x))) : 0;
  const jumpPhase = (phase - 15 - (slot.lead ? 0 : slot.x < 0 ? 1.5 : 3));
  const jumping = jumpPhase >= 0 && jumpPhase < 1.2;
  const jump = jumping ? Math.sin(jumpPhase / 1.2 * Math.PI) * .42 : 0;
  const pose: Pose = jumping ? 'jump' : moving ? 'run' : phase < 12 ? 'step' : 'wave';
  return { x: slot.x + offset, z: slot.z, jump, pose, yaw: moving ? Math.cos(phase / 8 * Math.PI * 2) * .18 : 0 };
}

// Wide shots cover travel and full-body actions; only stationary phrases move closer.
export function cameraPhrase(seconds: number, ensemble: boolean) {
  const phase = seconds % 24;
  return { close: !ensemble && phase >= 8 && phase < 15, side: Math.sin(seconds / 18) * .65 };
}

export function createPerformerMotion(rig: CharacterRig) {
  rig.body.name = 'body'; rig.leftArm.name = 'leftArm'; rig.rightArm.name = 'rightArm';
  rig.leftLeg.name = 'leftLeg'; rig.rightLeg.name = 'rightLeg';
  const mixer = new THREE.AnimationMixer(rig.body);
  const track = (name: string, times: number[], values: number[]) => new THREE.NumberKeyframeTrack(name, times, values);
  function clip(name: Pose, amplitude: number, duration: number) {
    const times = [0, duration / 4, duration / 2, duration * .75, duration];
    return new THREE.AnimationClip(name, duration, [
      track('leftLeg.rotation[x]', times, [0, amplitude, 0, -amplitude, 0]),
      track('rightLeg.rotation[x]', times, [0, -amplitude, 0, amplitude, 0]),
      track('.rotation[z]', times, [0, amplitude * .1, 0, -amplitude * .1, 0]),
      track('leftArm.rotation[z]', times, name === 'wave' ? [.5, 1.65, 1.35, 1.65, .5] : [.12, .12 + amplitude, .12, .12 - amplitude, .12]),
      track('.position[y]', times, name === 'jump' ? [0, 0, 0, 0, 0] : [0, amplitude * .07, 0, amplitude * .07, 0]),
      track('.scale[y]', times, name === 'jump' ? [1, .94, 1, .94, 1] : [1, 1, 1, 1, 1]),
    ]);
  }
  const actions = {
    idle: mixer.clipAction(clip('idle', 0, 1)), step: mixer.clipAction(clip('step', .18, 1)),
    run: mixer.clipAction(clip('run', .38, .6)), wave: mixer.clipAction(clip('wave', .08, 2)), jump: mixer.clipAction(clip('jump', .12, 1.2)),
  };
  let current: Pose = 'idle'; actions.idle.play();
  return {
    update(pose: Pose, dt: number, lead: boolean) {
      if (pose !== current) { actions[pose].reset().play().crossFadeFrom(actions[current], .2, true); current = pose; }
      mixer.update(dt);
      rig.rightArm.rotation.set(lead ? -1.5 : -.1, 0, lead ? -.42 : -.12);
    },
    idle(lead: boolean) {
      mixer.stopAllAction(); current = 'idle'; actions.idle.reset().play(); mixer.update(0);
      rig.body.position.y = 0; rig.body.rotation.z = 0; rig.body.scale.y = 1;
      rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; rig.leftArm.rotation.z = .12;
      rig.rightArm.rotation.set(lead ? -1.5 : -.1, 0, lead ? -.42 : -.12);
    },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(rig.body); },
  };
}
