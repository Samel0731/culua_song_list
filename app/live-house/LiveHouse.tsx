'use client';

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { liveHouseCopy, stage3dCopy } from '@/utils/liveHouse/copy';
import { stageCopy } from '@/utils/stageCopy';
import { archiveTrack, appearances, emptyProject, exportProject, formatTime, matchTheme, MAX_IMPORT_BYTES, moods, moveTrack, parseProject, parseTime, safeSource, themeColors, themes, youtubeUrl, type LiveHouseProject, type LiveTrack, type Performer } from '@/utils/liveHouse/model';
import { halloweenProject } from '@/utils/liveHouse/halloween';
import { characterLook } from '@/utils/liveHouse/characterLooks';
import { prepareImage, readProject, saveProject, validateProjectImages } from '@/utils/liveHouse/storage';
import Stage from './Stage';

type ErrorKey = 'invalid' | 'invalidPerformer' | 'imageError' | 'importError' | 'exportError' | 'limit' | 'usedPerformer' | 'unmatched';
type SaveStatus = 'loading' | 'pending' | 'saving' | 'saved' | 'storageError';
const field = (data: FormData, name: string) => String(data.get(name) || '').trim();

export default function LiveHouse() {
  const { lang } = useLanguage(), copy = liveHouseCopy[lang];
  const extra = stage3dCopy[lang], playerCopy = stageCopy[lang];
  const { allSongs, startLive, liveSession, isPlaying, isBuffering, closePlayer, togglePlay, playNext, playPrev, currentSong, playbackRequest } = usePlayer();
  const [project, setProject] = useState<LiveHouseProject>(emptyProject);
  const [ready, setReady] = useState(false), [revision, setRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const [step, setStep] = useState(0), [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(''), [selectedVersion, setSelectedVersion] = useState(0);
  const [lead, setLead] = useState(''), [editing, setEditing] = useState<LiveTrack | null>(null);
  const [formLead, setFormLead] = useState('');
  const [error, setError] = useState<ErrorKey | null>(null), [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null), [incoming, setIncoming] = useState<LiveHouseProject | null>(null);
  const [editorOpen, setEditorOpen] = useState(false), [missing, setMissing] = useState<string[]>([]);
  const [incomingKind, setIncomingKind] = useState<'import' | 'preset'>('import');
  const editor = useRef<HTMLDialogElement>(null), editorToggle = useRef<HTMLButtonElement>(null), editorClose = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), cancelImport = useRef<HTMLButtonElement>(null);
  const errorBox = useRef<HTMLParagraphElement>(null), trackForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let disposed = false;
    readProject().then(({ project: saved, persisted }) => {
      if (disposed) return;
      if (saved) setProject(saved);
      else { setProject(halloweenProject()); setRevision(1); }
      setSaveStatus(persisted ? 'saved' : saved ? 'storageError' : 'pending');
    }).catch(() => { if (!disposed) { setProject(halloweenProject()); setSaveStatus('storageError'); } }).finally(() => { if (!disposed) setReady(true); });
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    if (!ready || revision === 0) return;
    let disposed = false;
    // Saves already queued survive route changes. Only the newest mounted revision updates the label.
    const save = saveProject(project);
    Promise.resolve().then(() => { if (!disposed) setSaveStatus('saving'); });
    save.then(() => { if (!disposed) setSaveStatus('saved'); }).catch(() => { if (!disposed) setSaveStatus('storageError'); });
    return () => { disposed = true; };
  }, [project, ready, revision]);
  useEffect(() => {
    if (saveStatus === 'saved' || !revision) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [saveStatus, revision]);
  useEffect(() => {
    if (incoming) { dialog.current?.showModal(); cancelImport.current?.focus(); }
    else dialog.current?.close();
  }, [incoming]);
  useEffect(() => {
    if (editorOpen) { editor.current?.showModal(); editorClose.current?.focus(); }
    else editor.current?.close();
  }, [editorOpen]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  useEffect(() => { if (editing && editorOpen) trackForm.current?.querySelector<HTMLInputElement>(missing.includes(editing.id) ? 'input[name=end]' : 'input')?.focus(); }, [editing, editorOpen, missing]);

  function change(update: (p: LiveHouseProject) => LiveHouseProject) {
    setProject(update); setRevision(n => n + 1); setSaveStatus('pending');
  }
  function editTrack(track: LiveTrack) {
    setEditorOpen(true); setEditing(track); setFormLead(track.performerId); setStep(0); setError(null);
  }
  function closeEditor() { setEditorOpen(false); editorToggle.current?.focus(); }
  function begin() {
    const result = startLive(project);
    if (!result.ok) {
      setMissing(result.ids); setEditorOpen(true);
      const first = project.tracks.find(t => result.ids.includes(t.id));
      if (first) editTrack(first); else setError('invalid');
      return;
    }
    setMissing([]); setEditorOpen(false);
  }
  function addTrack(track: LiveTrack) {
    if (project.tracks.length >= 200) { setError('limit'); return; }
    change(p => ({ ...p, tracks: [...p.tracks, track] })); setError(null);
  }
  function reorder(event: MouseEvent<HTMLButtonElement>, index: number, direction: -1 | 1) {
    const button = event.currentTarget;
    change(p => ({ ...p, tracks: moveTrack(p.tracks, index, direction) }));
    window.requestAnimationFrame(() => {
      if (!button.isConnected) return;
      if (!button.disabled) button.focus();
      else button.parentElement?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    });
  }
  function addPerformer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    const name = field(data, 'person'), source = field(data, 'source');
    if (!name || !safeSource(source) || project.performers.length >= 12) { setError('invalidPerformer'); return; }
    const appearance = appearances.find(kind => kind === field(data, 'appearance')) || 'generic';
    const person: Performer = { id: crypto.randomUUID(), name, source, color: field(data, 'color'), avatar, appearance };
    change(p => ({ ...p, performers: [...p.performers, person] }));
    setLead(person.id); setAvatar(null); form.reset(); setError(null);
  }
  function removePerformer(id: string) {
    if (project.tracks.some(t => t.performerId === id)) { setError('usedPerformer'); return; }
    change(p => ({ ...p, performers: p.performers.filter(a => a.id !== id), tracks: p.tracks.map(t => ({ ...t, guests: t.guests.filter(g => g !== id) })) }));
    setError(null);
  }
  function saveTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    const start = parseTime(field(data, 'start')), endText = field(data, 'end'), end = endText ? parseTime(endText) : null;
    const url = youtubeUrl(field(data, 'video')), title = field(data, 'title'), performerId = field(data, 'lead');
    const mood = moods.find(m => m === field(data, 'mood')) || 'neutral';
    if (!title || !url || !project.performers.some(a => a.id === performerId) || start === null || start > 604800 || end === null || end <= start || end > 604800) { setError('invalid'); return; }
    const guests = data.getAll('guests').filter((g): g is string => typeof g === 'string' && g !== performerId && project.performers.some(p => p.id === g));
    const track: LiveTrack = { id: editing?.id || crypto.randomUUID(), title, artist: field(data, 'artist'), videoUrl: url, start, end, performerId, guests, mood };
    setMissing(ids => ids.filter(id => id !== track.id));
    if (editing) { change(p => ({ ...p, tracks: p.tracks.map(t => t.id === editing.id ? track : t) })); setEditing(null); setFormLead(''); setError(null); }
    else { addTrack(track); if (project.tracks.length < 200) form.reset(); }
  }
  async function image(file: File | undefined, target: 'avatar' | 'stage') {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const prepared = await prepareImage(file);
      if (target === 'avatar') setAvatar(prepared.data);
      else change(p => ({ ...p, stage: { ...p.stage, reference: prepared.data, color: prepared.palette[0], accent: prepared.palette[1] } }));
    } catch { setError('imageError'); } finally { setBusy(false); }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('size');
      const parsed = parseProject(JSON.parse(await file.text()));
      await validateProjectImages(parsed);
      setIncomingKind('import'); setIncoming(parsed); setError(null);
    } catch { setEditorOpen(true); setError('importError'); }
  }
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([exportProject(project)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'live-house.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setError(null);
    } catch { setEditorOpen(true); setError('exportError'); }
  }
  const performerId = project.performers.some(p => p.id === lead) ? lead : project.performers[0]?.id || '';
  const matches = allSongs.filter(s => `${s.songName} ${s.artist}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const song = allSongs.find(s => s.songName === selectedSong);
  const scene = liveSession?.project || project;
  const currentTrack = liveSession ? scene.tracks[liveSession.index] : project.tracks[0];

  return <main className="lh-page">
    <header className="lh-header"><div><h1>{copy.title}<span>{extra.beta}</span></h1><small>{scene.performers.map(p => p.name).join(' × ') || copy.local}</small></div><div className="lh-actions"><button disabled={!ready} onClick={() => { setIncomingKind('preset'); setIncoming(halloweenProject()); }}>{extra.loadHalloween}</button><button ref={editorToggle} disabled={!ready} onClick={() => setEditorOpen(true)}>{extra.openEditor}</button></div></header>
    {!ready ? <p>{copy.loading}</p> : <div className="lh-workspace">
      <section className="lh-preview" aria-label={copy.preview}>
        <Stage project={scene} track={currentTrack} active={!!liveSession && isPlaying && !isBuffering} lang={lang} request={playbackRequest}/>
        <div className="lh-performance-bar"><p className="lh-current" role="status">{liveSession?.finished ? copy.completed : copy.now}: {currentTrack?.title || '—'}<small>{liveSession ? copy.live : copy.draft}</small></p><div className="lh-actions"><button className="lh-primary" disabled={!project.tracks.length || busy} onClick={begin}>{copy.startLive}</button>{liveSession && <><button onClick={playPrev} aria-label={playerCopy.previous}>◀</button><button onClick={togglePlay}>{isPlaying ? playerCopy.pause : playerCopy.play}</button><button onClick={playNext} aria-label={playerCopy.next}>▶</button><button onClick={closePlayer}>{copy.stop}</button></>}</div></div>
      </section>
      <aside id="lh-running-order" className="lh-running-order" aria-label={extra.program}>
        {currentSong ? <div className="lh-media-slot" aria-hidden="true"/> : <div className="lh-ready-card"><span>LIVE HOUSE</span><p>{copy.startHelp}</p></div>}
        <h2>{extra.program}<small>{scene.tracks.length} · {formatTime(scene.tracks.reduce((total, t) => total + (t.end === null ? 0 : t.end - t.start), 0))}</small></h2>
        <ol>{scene.tracks.map((t, i) => <li key={t.id} className={liveSession?.index === i ? 'is-current' : ''}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{scene.performers.find(p => p.id === t.performerId)?.name}</strong><a href={t.videoUrl} target="_blank" rel="noopener noreferrer">{t.title} ↗</a><small>{formatTime(t.start)} → {t.end === null ? copy.manual : formatTime(t.end)}</small></div></li>)}</ol>
      </aside>
    </div>}
    <details className="lh-info"><summary>{extra.details} · <span role="status">{copy[saveStatus]}</span></summary><p className="lh-disclaimer">{copy.disclaimer}</p><p className="lh-note">{copy.local} · {copy.snapshot}</p><div className="lh-toolbar"><button disabled={!ready} onClick={download}>{copy.export}</button><label className="lh-file-button">{copy.import}<input disabled={!ready || busy} type="file" accept="application/json,.json" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }}/></label></div><ul className="lh-credits">{scene.performers.filter(p => p.source || characterLook(p.appearance, p.color).source).map(p => <li key={p.id}>{p.source ? <a href={p.source} target="_blank" rel="noopener noreferrer">{p.name} · {copy.sourceLink} ↗</a> : p.name}{characterLook(p.appearance, p.color).source && <span> · <a href={characterLook(p.appearance, p.color).source} target="_blank" rel="noopener noreferrer">{extra.lookReference} ↗</a></span>}</li>)}</ul></details>
      <dialog ref={editor} className="lh-editor" aria-label={extra.openEditor} onCancel={closeEditor} onClose={() => { if (editorOpen) closeEditor(); }}>
        <div className="lh-editor-top"><h2>{extra.openEditor}</h2><button ref={editorClose} onClick={closeEditor}>{extra.closeEditor} ×</button></div>
        <nav className="lh-steps" aria-label={copy.title}>{copy.steps.map((label, index) => <button key={index} aria-current={step === index ? 'step' : undefined} onClick={() => { setStep(index); setError(null); }}>{label}</button>)}</nav>
        {missing.length > 0 && <div className="lh-missing" role="alert"><p>{extra.missing}</p>{project.tracks.filter(t => missing.includes(t.id) && t.end === null).map(t => <button key={t.id} onClick={() => editTrack(t)}>{t.title}</button>)}</div>}
        {error && <p ref={errorBox} tabIndex={-1} className="lh-error" role="alert">{copy[error]}</p>}
        <label>{copy.name}<input maxLength={100} value={project.title} onChange={e => change(p => ({ ...p, title: e.target.value }))}/></label>
        <div hidden={step !== 0}>
          <h2>{copy.performers}</h2>
          <ul className="lh-people">{project.performers.map(p => <li key={p.id}><span style={{ borderColor: p.color }}>{p.name}</span><button onClick={() => removePerformer(p.id)} aria-label={`${copy.remove} ${p.name}`}>{copy.remove}</button></li>)}</ul>
          <form onSubmit={addPerformer} className="lh-card">
            <label>{copy.performerName}<input name="person" required maxLength={100}/></label>
            <label>{copy.source}<input type="url" name="source" maxLength={2000}/></label>
            <label>{extra.appearance}<select name="appearance">{appearances.map(kind => <option key={kind} value={kind}>{kind === 'generic' ? extra.generic : kind.toUpperCase()}</option>)}</select></label>
            <div className="lh-inline"><label>{copy.color}<input type="color" name="color" defaultValue="#c084fc"/></label><label>{copy.avatar}<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e => { void image(e.target.files?.[0], 'avatar'); }}/></label></div>
            {avatar && <span className="lh-avatar-ready" aria-label={copy.avatar}>✓</span>}
            <p className="lh-note">{copy.imageHelp}</p><button disabled={busy}>{copy.addPerformer}</button>
          </form>
          {!project.performers.length && <p className="lh-note">{copy.needPerformer}</p>}
          <h2>{copy.archive}</h2>
          <div className="lh-card">
            <label>{copy.lead}<select value={performerId} onChange={e => setLead(e.target.value)}><option value="" disabled>—</option>{project.performers.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
            <label>{copy.search}<input type="search" value={query} onChange={e => { setQuery(e.target.value); setSelectedSong(''); }}/></label>
            <label>{copy.results} ({matches.length})<select size={5} value={selectedSong} onChange={e => { setSelectedSong(e.target.value); setSelectedVersion(0); }}><option value="" disabled>—</option>{matches.slice(0, 30).map(s => <option key={s.songName} value={s.songName}>{s.songName} · {s.artist}</option>)}</select></label>
            {!matches.length && <p>{copy.emptySearch}</p>}{matches.length > 30 && <small>{copy.more}</small>}
            {song && <label>{copy.choose}<select value={selectedVersion} onChange={e => setSelectedVersion(Number(e.target.value))}>{song.versions.map((v, i) => <option key={i} value={i}>{v.date} · {v.streamTitle} · {v.timestamp}</option>)}</select></label>}
            <button disabled={!performerId || !song} onClick={() => { if (song) { try { addTrack(archiveTrack(song, song.versions[selectedVersion], performerId, crypto.randomUUID())); } catch { setError('invalid'); } } }}>{copy.add}</button>
          </div>
        </div>
        <div hidden={step !== 0 && !editing}>
          <h2>{editing ? copy.edit : copy.external}</h2>
          <form ref={trackForm} className="lh-card" onSubmit={saveTrack} key={editing?.id || 'new'}>
            <label>{copy.song}<input name="title" required maxLength={300} defaultValue={editing?.title || ''}/></label>
            <label>{copy.artist}<input name="artist" maxLength={300} defaultValue={editing?.artist || ''}/></label>
            <label>{copy.video}<input name="video" required type="url" maxLength={2000} defaultValue={editing?.videoUrl || ''}/></label>
            <div className="lh-inline"><label>{copy.start}<input name="start" required defaultValue={editing ? formatTime(editing.start) : '0:00'}/></label><label>{copy.end}<input name="end" required defaultValue={editing?.end != null ? formatTime(editing.end) : ''}/></label></div>
            <p className="lh-note">{copy.timeHelp}</p>
            <label>{copy.lead}<select name="lead" required value={project.performers.some(p => p.id === formLead) ? formLead : editing?.performerId || performerId} onChange={e => setFormLead(e.target.value)}><option value="" disabled>—</option>{project.performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <fieldset><legend>{copy.guests}</legend><p className="lh-note">{copy.guestsHelp}</p>{project.performers.map(p => <label className="lh-checkbox" key={p.id}><input type="checkbox" name="guests" value={p.id} defaultChecked={editing?.guests.includes(p.id) || false}/>{p.name}</label>)}</fieldset>
            <label>{copy.mood}<select name="mood" defaultValue={editing?.mood || 'neutral'}>{moods.map((m, i) => <option key={m} value={m}>{copy.moods[i]}</option>)}</select></label>
            <div className="lh-actions"><button disabled={!project.performers.length}>{editing ? copy.update : copy.add}</button>{editing && <button type="button" onClick={() => { setEditing(null); setFormLead(''); }}>{copy.cancel}</button>}</div>
          </form>
        </div>
        <div hidden={step !== 1} className="lh-card">
          <h2>{copy.steps[1]}</h2>
          <label>{copy.mode}<select value={project.stage.mode} onChange={e => { const mode = e.target.value; if (mode === 'mood' || mode === 'text' || mode === 'image') change(p => ({ ...p, stage: { ...p.stage, mode } })); }}>{copy.modes.map((label, i) => <option value={['mood', 'text', 'image'][i]} key={label}>{label}</option>)}</select></label>
          {project.stage.mode === 'text' && <><label>{copy.prompt}<input maxLength={300} value={project.stage.prompt} placeholder={copy.promptPlaceholder} onChange={e => change(p => ({ ...p, stage: { ...p.stage, prompt: e.target.value } }))}/></label><button onClick={() => { const theme = matchTheme(project.stage.prompt); if (!theme) { setError('unmatched'); return; } setError(null); change(p => ({ ...p, stage: { ...p.stage, theme, color: themeColors[theme][0], accent: themeColors[theme][1] } })); }}>{copy.generate}</button></>}
          {project.stage.mode === 'image' && <><label>{copy.reference}<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e => { void image(e.target.files?.[0], 'stage'); e.target.value = ''; }}/></label><p className="lh-note">{copy.referenceHelp}</p></>}
          <label>{copy.theme}<select value={project.stage.theme} onChange={e => { const theme = themes.find(t => t === e.target.value); if (theme) change(p => ({ ...p, stage: { ...p.stage, theme } })); }}>{themes.map((t, i) => <option value={t} key={t}>{copy.themes[i]}</option>)}</select></label>
          <div className="lh-inline"><label>{copy.primary}<input type="color" value={project.stage.color} onChange={e => change(p => ({ ...p, stage: { ...p.stage, color: e.target.value } }))}/></label><label>{copy.accent}<input type="color" value={project.stage.accent} onChange={e => change(p => ({ ...p, stage: { ...p.stage, accent: e.target.value } }))}/></label></div>
          <label>{copy.intensity}: {project.stage.intensity}<input type="range" min="0" max="2" step="0.25" value={project.stage.intensity} onChange={e => change(p => ({ ...p, stage: { ...p.stage, intensity: Number(e.target.value) } }))}/></label>
          <button onClick={() => change(p => ({ ...p, stage: { ...p.stage, seed: (p.stage.seed + 1) >>> 0 } }))}>{copy.regenerate}</button><small>{copy.seed}: {project.stage.seed}</small>
        </div>
        <section className="lh-setlist" aria-label={copy.queue}>
          <h2>{copy.queue} ({project.tracks.length})</h2>
          {!project.tracks.length && <p className="lh-note">{copy.emptyQueue}</p>}
          <ol>{project.tracks.map((track, index) => <li key={track.id} className={liveSession?.project.tracks[liveSession.index]?.id === track.id ? 'lh-current-track' : ''}>
            <strong>{index + 1}. {track.title}</strong><small>{track.artist} · {project.performers.find(p => p.id === track.performerId)?.name}</small>
            <small>{formatTime(track.start)}{track.end !== null ? ` → ${formatTime(track.end)} · ${copy.auto}` : ` · ${copy.manual}`} · {copy.moods[moods.indexOf(track.mood)]}</small>
            <div className="lh-actions"><button disabled={index === 0} aria-label={`${copy.up} ${track.title}`} onClick={e => reorder(e, index, -1)}>↑</button><button disabled={index === project.tracks.length - 1} aria-label={`${copy.down} ${track.title}`} onClick={e => reorder(e, index, 1)}>↓</button><button onClick={() => editTrack(track)}>{copy.edit}</button><button onClick={() => { change(p => ({ ...p, tracks: p.tracks.filter(t => t.id !== track.id) })); if (editing?.id === track.id) { setEditing(null); setFormLead(''); } }}>{copy.remove}</button></div>
          </li>)}</ol>
        </section>
      </dialog>
    <dialog ref={dialog} className="lh-dialog" onCancel={() => setIncoming(null)} aria-labelledby="lh-import-title">
      <h2 id="lh-import-title">{incomingKind === 'preset' ? extra.preset : copy.import}</h2><p>{incomingKind === 'preset' ? extra.halloweenConfirm : copy.importConfirm}</p><p>{incoming?.title || copy.untitled} · {incoming?.tracks.length} / {copy.queue}</p>
      <div className="lh-actions"><button ref={cancelImport} onClick={() => setIncoming(null)}>{copy.cancel}</button><button onClick={() => { if (incoming) change(() => incoming); setIncoming(null); setEditing(null); setLead(''); setFormLead(''); setMissing([]); }}>{copy.replace}</button></div>
    </dialog>
  </main>;
}
