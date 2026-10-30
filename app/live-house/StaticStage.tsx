'use client';

import { useId, type CSSProperties } from 'react';
import { liveHouseCopy } from '@/utils/liveHouse/copy';
import { moodColors, stagePoints, type LiveHouseProject, type LiveTrack } from '@/utils/liveHouse/model';

export default function StaticStage({ project, track, active, lang }: {
  project: LiveHouseProject; track: LiveTrack | undefined; active: boolean; lang: 'zh' | 'ja' | 'en';
}) {
  const copy = liveHouseCopy[lang], id = useId().replace(/:/g, '');
  const { stage } = project;
  const colors = stage.mode === 'mood' ? moodColors[track?.mood || 'neutral'] : [stage.color, stage.accent];
  // Custom light colors tint mood presets, rather than being lost on a song change.
  const moodSpeed = { neutral: 4, calm: 7, ballad: 6, bright: 3, energy: 2, mystery: 8 }[track?.mood || 'neutral'];
  const style: CSSProperties & { '--light': string; '--accent': string; '--speed': string; '--lift': string } = {
    '--light': stage.color, '--accent': stage.accent,
    '--speed': `${(stage.mode === 'mood' ? moodSpeed : 4) / Math.max(.25, stage.intensity)}s`,
    '--lift': `${(track?.mood === 'energy' ? -10 : -4) * stage.intensity}px`,
  };
  const guests = project.performers.filter(p => p.id !== track?.performerId);
  const visible = project.performers.filter(p => !track || p.id === track.performerId || track.guests.includes(p.id));
  return <div className={`lh-stage theme-${stage.theme} ${active && stage.intensity > 0 ? 'is-active' : ''}`} style={style} role="img" aria-label={`${copy.preview}: ${project.title || copy.untitled}. ${visible.map(p => p.name).join(', ')}. ${active ? copy.performing : copy.idle}`}>
    <svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#100d22"/><stop offset="1" stopColor="#21132f"/></linearGradient>
        <linearGradient id={`${id}-beam`} x2="0" y2="1"><stop stopColor={colors[0]} stopOpacity=".5"/><stop offset="1" stopColor={colors[1]} stopOpacity="0"/></linearGradient></defs>
      <rect width="800" height="480" fill={`url(#${id}-sky)`}/>
      {stagePoints(stage.seed).map((point, i) => <g key={i} className="lh-particle">
        {stage.theme === 'rain' ? <path d={`M${point.x * 8} ${point.y * 4}l-9 25`} stroke={colors[1]} opacity=".45"/>
          : stage.theme === 'forest' ? <path d={`M${point.x * 8} 350l-22 -${50 + point.y * 2}l44 0Z`} fill={colors[i % 2]} opacity=".13"/>
          : <circle cx={point.x * 8} cy={point.y * 4} r={point.size} fill={colors[i % 2]} opacity=".7"/>}
      </g>)}
      <g className="lh-beams" fill={`url(#${id}-beam)`}><path d="M90 25L270 390H0Z"/><path d="M710 25L800 390H530Z"/><path d="M400 25L570 390H230Z"/></g>
      <path d="M30 35H770M90 15V55M250 15V55M400 15V55M550 15V55M710 15V55" stroke="#746186" strokeWidth="7"/>
      <ellipse cx="400" cy="395" rx="380" ry="67" fill="#08070f" stroke={colors[0]} strokeWidth="3"/>
      <ellipse cx="400" cy="395" rx="200" ry="42" fill={colors[1]} opacity=".1"/>
      {stage.theme === 'neon' && <g fill="none" stroke={colors[0]} strokeWidth="4" opacity=".6"><rect x="240" y="90" width="320" height="235" rx="85"/><path d="M270 300V120H530V300"/></g>}
    </svg>
    <div className="lh-stage-caption"><span>{project.title || copy.untitled}</span><small>{active ? copy.performing : copy.idle}</small></div>
    {project.performers.map((person, index) => {
      const lead = person.id === track?.performerId;
      const side = guests.findIndex(p => p.id === person.id);
      const x = !track ? 12 + (index + .5) * 76 / Math.max(1, project.performers.length) : lead ? 50 : side % 2 === 0 ? 8 + Math.floor(side / 2) * 6 : 92 - Math.floor(side / 2) * 6;
      const appearing = !track || lead || track.guests.includes(person.id);
      return <div key={person.id} className={`lh-character ${lead ? 'is-lead' : ''} ${appearing ? '' : 'is-backstage'}`} style={{ left: `${x}%`, bottom: lead ? '14%' : '22%', color: person.color }} aria-hidden="true">
        <div className="lh-puppet"><div className="lh-head">{person.avatar
          // Local, user-supplied data URLs cannot use the remote image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={person.avatar} alt=""/> : <span>{Array.from(person.name).slice(0, 2).join('')}</span>}</div><div className="lh-body"/><div className="lh-arms"/><div className="lh-legs"/></div>
        <span className="lh-name">{person.name}</span>
      </div>;
    })}
  </div>;
}
