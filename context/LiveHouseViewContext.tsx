'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Mode = 'off' | 'native' | 'window';
interface View { mode: Mode; program: boolean; enter: (button: HTMLButtonElement) => void; exit: () => void; toggleProgram: () => void; }
const ViewContext = createContext<View>({ mode: 'off', program: false, enter: () => {}, exit: () => {}, toggleProgram: () => {} });

export function LiveHouseViewProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(), host = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement | null>(null);
  const generation = useRef(0);
  const [view, setView] = useState<{ path: string; mode: Mode }>({ path: '', mode: 'off' });
  const [program, setProgram] = useState(false);
  if (view.path && view.path !== pathname) { setView({ path: '', mode: 'off' }); setProgram(false); }
  const mode = pathname === '/live-house' && view.path === pathname ? view.mode : 'off';
  const cancelPending = useCallback(() => { generation.current++; }, []);
  const exit = useCallback(() => {
    cancelPending();
    if (document.fullscreenElement === host.current) void document.exitFullscreen().catch(() => {});
    setView({ path: '', mode: 'off' }); setProgram(false); trigger.current?.focus();
  }, [cancelPending]);
  const enter = useCallback((button: HTMLButtonElement) => {
    const element = host.current; if (!element) return;
    trigger.current = button; setProgram(false);
    const request = ++generation.current;
    // Call synchronously within the click's user activation.
    if (element.requestFullscreen) {
      void element.requestFullscreen().then(() => {
        if (generation.current === request) setView({ path: pathname, mode: 'native' });
        else if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {});
      }).catch(() => { if (generation.current === request) setView({ path: pathname, mode: 'window' }); });
    } else setView({ path: pathname, mode: 'window' });
  }, [pathname]);
  useEffect(() => {
    const change = () => { if (!document.fullscreenElement) exit(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && mode !== 'off') { event.preventDefault(); exit(); } };
    document.addEventListener('fullscreenchange', change); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('fullscreenchange', change); document.removeEventListener('keydown', key); };
  }, [exit, mode]);
  useEffect(() => {
    if (mode === 'off') return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mode]);
  useEffect(() => {
    const element = host.current;
    return () => { cancelPending(); if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {}); };
  }, [pathname, cancelPending]);
  return <ViewContext.Provider value={{ mode, program, enter, exit, toggleProgram: () => setProgram(p => !p) }}>
    <div ref={host} data-fullscreen-mode={mode} className={`lh-view-host ${mode !== 'off' ? 'is-theater' : ''} ${program ? 'show-program' : ''}`}>{children}</div>
  </ViewContext.Provider>;
}
export const useLiveHouseView = () => useContext(ViewContext);
