'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { stage3dCopy } from '@/utils/liveHouse/copy';
import type { LiveHouseProject, LiveTrack } from '@/utils/liveHouse/model';
import type { StageInput, StageRuntime } from '@/utils/liveHouse/scene';
import StaticStage from './StaticStage';
import { useLiveHouseView } from '@/context/LiveHouseViewContext';

function subscribeMotion(notify: () => void) {
  const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  query?.addEventListener('change', notify);
  return () => query?.removeEventListener('change', notify);
}
const readMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
export default function Stage({ project, track, active, lang, request }: {
  project: LiveHouseProject; track: LiveTrack | undefined; active: boolean; lang: 'zh' | 'ja' | 'en'; request: number;
}) {
  const copy = stage3dCopy[lang];
  const [automatic, setAutomatic] = useState(false);
  const view = useLiveHouseView();
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, () => false);
  const host = useRef<HTMLDivElement>(null), runtime = useRef<StageRuntime | null>(null);
  const latest = useRef<StageInput>({ project, track, active, reduced, request });
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    latest.current = { project, track, active, reduced, request };
    runtime.current?.update(latest.current);
  }, [project, track, active, reduced, request]);
  useEffect(() => {
    let disposed = false;
    const failure = () => {
      runtime.current?.dispose(); runtime.current = null;
      if (!disposed) setStatus('failed');
    };
    Promise.resolve().then(async () => {
      if (!('WebGL2RenderingContext' in window)) throw new Error('webgl');
      const { mountStage } = await import('@/utils/liveHouse/scene');
      if (disposed || !host.current) return;
      runtime.current = mountStage(host.current, latest.current, failure, () => setAutomatic(false));
      setStatus('ready');
    }).catch(() => { if (!disposed) failure(); });
    return () => { disposed = true; runtime.current?.dispose(); runtime.current = null; };
  }, []);
  return <section className="lh-stage3d" aria-label={copy.stage}>
    <div ref={host} className="lh-canvas" aria-hidden="true"/>
    {status !== 'ready' && <div className="lh-static"><StaticStage project={project} track={track} active={false} lang={lang}/></div>}
    <div className="lh-scene-heading"><span>{project.stage.theme === 'halloween' ? 'HALLOWEEN / LIVE HOUSE' : 'LIVE HOUSE'}</span><strong>{project.title}</strong><small>{project.performers.map(p => p.name).join(' × ')}</small></div>
    <div className="lh-camera" aria-label={copy.camera}>
      <button disabled={status !== 'ready'} aria-pressed={automatic} onClick={() => { runtime.current?.auto(!automatic); setAutomatic(!automatic); }}>{copy.autoCamera}</button>
      <button disabled={status !== 'ready'} onClick={() => runtime.current?.view('wide')}>{copy.wide}</button>
      <button disabled={status !== 'ready'} onClick={() => runtime.current?.view('lead')}>{copy.leadView}</button>
      <button disabled={status !== 'ready'} onClick={() => runtime.current?.view('reset')}>{copy.reset}</button>
      <button onClick={e => view.mode === 'off' ? view.enter(e.currentTarget) : view.exit()} aria-pressed={view.mode !== 'off'}>{view.mode === 'off' ? copy.fullscreen : copy.exitFullscreen}</button>
      {view.mode !== 'off' && <button aria-expanded={view.program} aria-controls="lh-running-order" onClick={view.toggleProgram}>{copy.program}</button>}
    </div>
    {status !== 'ready' && <p className="lh-render-status" role="status">{status === 'failed' ? copy.unavailable3d : copy.loading3d}</p>}
    {view.mode === 'window' && <p className="lh-theater-status" role="status">{copy.windowMode}</p>}
    <div className="lh-cast">{project.performers.filter(p => !track || p.id === track.performerId || track.guests.includes(p.id)).map(p => <span key={p.id} className={p.id === track?.performerId ? 'is-lead' : ''} style={{ borderColor: p.color }}>{p.name}{p.id === track?.performerId && <small>{active ? copy.onStage : copy.standby}</small>}</span>)}</div>
    <p className="lh-camera-hint">{copy.drag}</p>
  </section>;
}
