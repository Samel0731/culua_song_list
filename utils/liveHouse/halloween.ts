import { emptyProject, type LiveHouseProject } from './model';

// Whole official MVs. Public player metadata checked 2026-10-24; no live API key.
export function halloweenProject(): LiveHouseProject {
  const project = emptyProject();
  project.title = 'HALLOWEEN · MEDA × CULUA × NEUN';
  project.stage = { ...project.stage, mode: 'text', theme: 'halloween', prompt: 'Halloween', color: '#b875ff', accent: '#ff962f', seed: 1031 };
  project.performers = [
    { id: 'meda', name: 'MEDA', color: '#f35b98', appearance: 'meda', avatar: null, source: 'https://pbs.twimg.com/profile_images/1790306201860980736/QDIjz1FO_400x400.jpg' },
    { id: 'culua', name: 'CULUA', color: '#7971ed', appearance: 'culua', avatar: null, source: 'https://pbs.twimg.com/profile_images/2001619230375186432/qMvbEA5L_400x400.jpg' },
    { id: 'neun', name: 'NEUN', color: '#d2c8e6', appearance: 'neun', avatar: null, source: 'https://pbs.twimg.com/profile_images/1965250262073053184/vSrLNwCL_400x400.jpg' },
  ];
  project.tracks = [
    { id: 'halloween-meda', title: 'Sing-ularity', artist: 'MEDA', performerId: 'meda', guests: [], videoUrl: 'https://www.youtube.com/watch?v=DGyM7Kr1uTs', start: 0, end: 230, mood: 'energy' },
    { id: 'halloween-culua', title: 'ベビ・デビ', artist: 'CULUA', performerId: 'culua', guests: [], videoUrl: 'https://www.youtube.com/watch?v=Hx1KAdapT1M', start: 0, end: 182, mood: 'bright' },
    { id: 'halloween-neun', title: 'Heiliges Requiem', artist: 'NEUN', performerId: 'neun', guests: [], videoUrl: 'https://www.youtube.com/watch?v=niLhHoFSJO8', start: 0, end: 281, mood: 'mystery' },
    { id: 'halloween-meda-trio', title: 'Id-Entity', artist: 'MEDA', performerId: 'meda', guests: ['culua', 'neun'], videoUrl: 'https://www.youtube.com/watch?v=YKx8fWKMyrQ', start: 0, end: 232, mood: 'energy' },
    { id: 'halloween-culua-trio', title: '夢追い人', artist: 'CULUA', performerId: 'culua', guests: ['meda', 'neun'], videoUrl: 'https://www.youtube.com/watch?v=o2Q0hF7aa38', start: 0, end: 268, mood: 'bright' },
    { id: 'halloween-neun-trio', title: 'Engelslied', artist: 'NEUN', performerId: 'neun', guests: ['meda', 'culua'], videoUrl: 'https://www.youtube.com/watch?v=PTUJRM0Ls4s', start: 0, end: 270, mood: 'mystery' },
  ];
  return project;
}
