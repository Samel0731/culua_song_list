import type { LiveTrack, Performer } from './model';

export type CameraView = 'wide' | 'lead' | 'reset';
export const cameraLimits = { minAzimuth: -.75, maxAzimuth: .75, minPolar: .82, maxPolar: 1.37, minDistance: 5.5, maxDistance: 17 };
export function stageSlots(performers: Performer[], track: LiveTrack | undefined) {
  const others = performers.filter(p => p.id !== track?.performerId);
  return performers.map((person, index) => {
    const lead = person.id === track?.performerId, sideIndex = others.findIndex(p => p.id === person.id);
    const x = !track ? (index - (performers.length - 1) / 2) * Math.min(2.6, 9 / Math.max(1, performers.length - 1))
      : lead ? 0 : (sideIndex % 2 ? 1 : -1) * (2.6 + Math.floor(sideIndex / 2) * .65);
    return { id: person.id, x: Math.max(-4.5, Math.min(4.5, x)), z: lead ? 1.35 : -.65 - Math.floor(Math.max(0, sideIndex) / 4) * .6,
      lead, visible: !track || lead || track.guests.includes(person.id) };
  });
}
