// Local-only visual QA of the real character factory. No archive/database access.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.argv[2] || 3010);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Character color QA</title>
<style>body{margin:0;background:#171923;color:#eee;font:14px system-ui}header{padding:12px;display:flex;gap:12px;align-items:center}button{padding:8px}canvas{display:block;width:960px;max-width:100%}.labels{display:grid;grid-template-columns:repeat(3,1fr);width:960px;max-width:100%;text-align:center}</style>
<header><strong>NEUN → MEDA → CULUA · front / 60° / back</strong><button id="white">Neutral white</button><button id="stage">Stage colors</button><button id="motion">Animate</button><span id="status">Neutral white</span></header>
<div class="labels"><span>Front</span><span>60°</span><span>Back</span></div><canvas id="view" width="960" height="1080"></canvas>
<script type="module">
import * as T from '/three.js';
import {createCharacter,disposeObject} from '/characters.js';
import {createPerformerMotion} from '/performance.js';
const canvas=document.querySelector('canvas'), renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setSize(960,1080); renderer.setScissorTest(true); renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
const camera=new T.OrthographicCamera(-1.35,1.35,1.52,-1.52,.1,30);camera.position.set(0,1.55,7);camera.lookAt(0,1.42,0);
const cast=['neun','meda','culua'].map(appearance=>{
 const scene=new T.Scene();scene.background=new T.Color('#353744');
 const rig=createCharacter({id:appearance,name:appearance,appearance,color:'#a78bfa',avatar:null,source:''},()=>{}); scene.add(rig.root);
 const fill=new T.HemisphereLight('#ffffff','#81818a',1.6);scene.add(fill);
 const key=new T.DirectionalLight('#ffffff',2.4);key.position.set(1,7,9);scene.add(key);
 const purple=new T.PointLight('#a15bff',0,18);purple.position.set(-5,3,1);scene.add(purple);
 const orange=new T.PointLight('#ff8a38',0,18);orange.position.set(5,3,2);scene.add(orange);
 const floor=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshStandardMaterial({color:'#454653'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
 return {scene,rig,purple,orange,motion:createPerformerMotion(rig)};
});
let active=false,frame=0,last=0,time=0;
function draw(now=0){const dt=last?Math.min((now-last)/1000,.05):.016;last=now;if(active)time+=dt;
 cast.forEach(({scene,rig,motion},row)=>{if(active){motion.update(time%5<1.2?'jump':'wave',dt,true);rig.root.position.y=time%5<1.2?Math.sin(time%5/1.2*Math.PI)*.42:0;}else{motion.idle(true);rig.root.position.y=0;}
 [0,Math.PI/3,Math.PI].forEach((angle,col)=>{rig.root.rotation.y=angle;renderer.setViewport(col*320,(2-row)*360,320,360);renderer.setScissor(col*320,(2-row)*360,320,360);renderer.render(scene,camera);});});
 frame=active?requestAnimationFrame(draw):0;}
function invalidate(){if(!frame)draw();}
for(const id of ['white','stage'])document.getElementById(id).onclick=()=>{cast.forEach(c=>{c.purple.intensity=id==='stage'?55:0;c.orange.intensity=id==='stage'?65:0;});document.getElementById('status').textContent=id==='stage'?'Stage colors':'Neutral white';invalidate();};
document.getElementById('motion').onclick=()=>{active=!active;last=0;document.getElementById('motion').textContent=active?'Freeze':'Animate';if(!frame)draw();};
addEventListener('pagehide',()=>{cancelAnimationFrame(frame);cast.forEach(c=>{c.motion.dispose();disposeObject(c.scene);});renderer.dispose();});draw();
</script></html>`;
http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  if (name === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); return; }
  const sources = { '/characters.js': 'utils/liveHouse/characters.ts', '/characterLooks.js': 'utils/liveHouse/characterLooks.ts', '/performance.js': 'utils/liveHouse/performance.ts', '/three.js': 'node_modules/three/build/three.module.js', '/three.core.js': 'node_modules/three/build/three.core.js' };
  if (!Object.hasOwn(sources, name)) { res.writeHead(404); res.end(); return; }
  let code = fs.readFileSync(path.join(root, sources[name]), 'utf8');
  if (sources[name].endsWith('.ts')) code = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll("from 'three'", "from '/three.js'").replaceAll("from './characterLooks'", "from '/characterLooks.js'");
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(code);
}).listen(port, '127.0.0.1', () => console.log('Character QA: http://127.0.0.1:' + port));
