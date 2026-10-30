import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCharacter, disposeObject, type CharacterRig } from './characters';
import { createStageLights } from './lighting';
import { cameraPhrase, createPerformerMotion, performanceAt } from './performance';
import { cameraLimits, stageSlots, type CameraView } from './stageLayout';
import { moodColors, stagePoints, type LiveHouseProject, type LiveTrack } from './model';

export interface StageInput { project: LiveHouseProject; track: LiveTrack | undefined; active: boolean; reduced: boolean; request: number; }
export interface StageRuntime { update: (input: StageInput) => void; view: (view: CameraView) => void; auto: (enabled: boolean) => void; dispose: () => void; }

export function mountStage(host: HTMLElement, initial: StageInput, onError: () => void, onManual: () => void = () => {}): StageRuntime {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  const cleanup: (() => void)[] = [];
  let cleaned = false;
  const dispose = () => {
    if (cleaned) return;
    cleaned = true;
    for (const release of cleanup.reverse()) { try { release(); } catch { /* Release the remaining resources even after context loss. */ } }
  };
  cleanup.push(() => { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); });
  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#100d20'); scene.fog = new THREE.FogExp2('#161027', .025);
    cleanup.push(() => disposeObject(scene));
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 80);
    const controls = new OrbitControls(camera, renderer.domElement);
    cleanup.push(() => controls.dispose());
    controls.enablePan = false; controls.enableDamping = false;
    controls.minAzimuthAngle = cameraLimits.minAzimuth; controls.maxAzimuthAngle = cameraLimits.maxAzimuth;
    controls.minPolarAngle = cameraLimits.minPolar; controls.maxPolarAngle = cameraLimits.maxPolar;
    controls.minDistance = cameraLimits.minDistance; controls.maxDistance = cameraLimits.maxDistance;
    controls.target.set(0, 1.35, 0);
    const hemi = new THREE.HemisphereLight('#e1d8ff', '#352343', 1.6); scene.add(hemi);
    const front = new THREE.DirectionalLight('#f7e6ff', 2.4); front.position.set(1, 7, 9); scene.add(front);
    const purple = new THREE.PointLight('#a15bff', 55, 18); purple.position.set(-5, 3, 1); scene.add(purple);
    const orange = new THREE.PointLight('#ff8a38', 65, 18); orange.position.set(5, 3, 2); scene.add(orange);
    const spot = new THREE.SpotLight('#ffdda4', 90, 18, .45, .65); spot.position.set(0, 7, 4); spot.target.position.set(0, 1, 1.3);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.001;
    cleanup.push(() => spot.shadow.dispose());
    scene.add(spot, spot.target);
    const stageLights = createStageLights(scene); cleanup.push(stageLights.dispose);
    let scenery = new THREE.Group(); scene.add(scenery);
    const cast = new THREE.Group(); scene.add(cast);
    let rigs: { id: string; rig: CharacterRig; motion: ReturnType<typeof createPerformerMotion> }[] = [];
    cleanup.push(() => rigs.forEach(({ motion }) => motion.dispose()));
    let automatic = false;
    let elapsed = 0, request = initial.request, reveal = 1;
    let castMaterials: THREE.Material[] = [];
    function fadeCast(alpha: number) {
      for (const material of castMaterials) {
        const transparent = alpha < 1;
        if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
        material.opacity = alpha;
      }
    }
    const target = new THREE.Vector3();
    let state = initial, signature = '', sceneryKey = '', frame = 0, lastFrame = 0, disposed = false, inView = true;
    cleanup.push(() => { disposed = true; cancelAnimationFrame(frame); });
    let slots = stageSlots(initial.project.performers, initial.track);

    const standard = (color: string, emissive = '#000000', glow = 0) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: glow, roughness: .65 });
    function add(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scenery) {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    function branch(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, parent: THREE.Object3D) {
      const direction = b.clone().sub(a);
      const mesh = add(new THREE.CylinderGeometry(radius * .6, radius, direction.length(), 6), material, 0, 0, 0, parent);
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }
    function pumpkin(x: number, z: number, size: number) {
      const group = new THREE.Group(); group.position.set(x, size * .44, z); group.scale.setScalar(size); scenery.add(group);
      const skin = standard('#e88228', '#d24c12', .2);
      for (let i = 0; i < 7; i++) {
        const angle = i / 7 * Math.PI * 2;
        const lobe = add(new THREE.SphereGeometry(.42, 10, 8), skin, Math.cos(angle) * .2, 0, Math.sin(angle) * .2, group);
        lobe.scale.set(.72, 1, .72);
      }
      add(new THREE.CylinderGeometry(.08, .1, .22, 6), standard('#526140'), .02, .48, 0, group).rotation.z = -.2;
      const glow = new THREE.MeshBasicMaterial({ color: '#ffed88' });
      for (const side of [-1, 1]) add(new THREE.ConeGeometry(.12, .14, 3), glow, side * .21, .12, .48, group).rotation.z = side * -.15;
      add(new THREE.BoxGeometry(.36, .065, .04), glow, 0, -.12, .5, group);
      for (const side of [-1, 1]) add(new THREE.BoxGeometry(.05, .09, .05), skin, side * .09, -.1, .525, group);
    }
    function buildScenery() {
      disposeObject(scenery); scenery = new THREE.Group(); scene.add(scenery);
      const settings = state.project.stage, spooky = settings.theme === 'halloween';
      const floor = standard('#282033'), trim = standard(settings.color, settings.color, .45), accent = standard(settings.accent, settings.accent, .6);
      const ground = add(new THREE.PlaneGeometry(80, 80), standard('#100d1b'), 0, -.62, 0); ground.rotation.x = -Math.PI / 2;
      add(new THREE.CylinderGeometry(6, 6.15, .38, 48), floor, 0, -.22, 0).scale.z = .68;
      const ring = add(new THREE.TorusGeometry(5.9, .045, 6, 64), trim, 0, -.01, 0); ring.rotation.x = -Math.PI / 2; ring.scale.y = .68;
      const inner = add(new THREE.TorusGeometry(3.8, .025, 5, 64), accent, 0, .005, 0); inner.rotation.x = -Math.PI / 2; inner.scale.y = .68;
      for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(4.4 - i * .4, .15, .5), floor, 0, -.47 + i * .15, 4 - i * .4);
      const truss = standard('#544363', '#38204b', .1);
      for (const x of [-5.5, 5.5]) {
        add(new THREE.BoxGeometry(.16, 5.7, .16), truss, x, 2.8, -2.4);
        for (let y = .5; y < 5.5; y += .6) {
          const cross = add(new THREE.BoxGeometry(.65, .05, .05), truss, x, y, -2.4); cross.rotation.z = .8;
        }
      }
      add(new THREE.BoxGeometry(11.2, .16, .2), truss, 0, 5.6, -2.4);
      for (const x of [-4.4, 0, 4.4]) {
        add(new THREE.CylinderGeometry(.2, .22, .35, 10), truss, x, 5.4, -2.2).rotation.x = .5;
      }
      const back = add(new THREE.BoxGeometry(12, 6.5, .25), standard('#181327'), 0, 2.4, -4.35);
      back.receiveShadow = false;
      if (spooky) {
        const moon = add(new THREE.SphereGeometry(1.22, 32, 20), standard('#ffdfab', '#ffc67c', .75), 2.55, 4.18, -3.98); moon.scale.z = .11;
        for (const x of [-5, 5]) {
          const tree = new THREE.Group(); tree.position.set(x, 0, -2.9); scenery.add(tree);
          const bark = standard('#3f2c43');
          branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-.1, 4.7, 0), .13, bark, tree);
          for (let i = 0; i < 5; i++) {
            const sign = i % 2 ? -1 : 1, y = 1.5 + i * .55;
            branch(new THREE.Vector3(0, y, 0), new THREE.Vector3(sign * .8, y + .65, .1), .065, bark, tree);
            branch(new THREE.Vector3(sign * .6, y + .5, .1), new THREE.Vector3(sign * .65, y + 1.1, .1), .035, bark, tree);
          }
        }
        for (const [x, z, size] of [[-4.8, 1.7, .9], [4.8, 1.7, .9], [-4.2, 2.5, .55], [4.2, 2.5, .55], [-4, -2, .7], [4.1, -2, .7]]) pumpkin(x, z, size);
        for (let i = 0; i < 5; i++) {
          const shape = new THREE.Shape(); shape.moveTo(-.6, 0); shape.lineTo(-.35, .3); shape.lineTo(-.06, .04); shape.lineTo(0, .14); shape.lineTo(.06, .04); shape.lineTo(.35, .3); shape.lineTo(.6, 0); shape.lineTo(.25, .03); shape.lineTo(0, -.1); shape.lineTo(-.25, .03); shape.closePath();
          add(new THREE.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: false }), standard('#21132d'), -2.7 + i * 1.1, 3.8 + Math.sin(i * 3) * .5, -3.85);
        }
        for (let i = 0; i < 6; i++) {
          const cloud = add(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#b7a4d6', transparent: true, opacity: .045, depthWrite: false }), -4 + i * 1.6, .1, -1.5 + i % 2);
          cloud.scale.set(1.8, .16, .7); cloud.castShadow = false;
        }
      } else if (settings.theme === 'neon') {
        for (let i = 0; i < 4; i++) {
          add(new THREE.BoxGeometry(.06, 4, .08), i % 2 ? trim : accent, -4 + i * 2.7, 2.5, -4.1).rotation.z = .2;
        }
      } else if (settings.theme === 'forest') {
        for (const x of [-4.8, 4.8]) add(new THREE.ConeGeometry(1, 4.5, 6), standard('#2c6f61'), x, 2, -3);
      }
      const particles = new THREE.BufferGeometry();
      particles.setAttribute('position', new THREE.Float32BufferAttribute(stagePoints(settings.seed).flatMap(p => [(p.x / 100 - .5) * 11, 2.6 + p.y / 75 * 3, -3.9]), 3));
      scenery.add(new THREE.Points(particles, new THREE.PointsMaterial({ color: settings.accent, size: .055, transparent: true, opacity: .65 })));
    }
    function draw(time = 0) {
      frame = 0;
      if (disposed || document.hidden || !inView) return;
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, .05) : .016; lastFrame = time;
      const animate = state.active && !state.reduced && state.project.stage.intensity > 0;
      if (animate) elapsed += dt * state.project.stage.intensity;
      if (reveal < 1) { reveal = animate ? Math.min(1, reveal + dt * 3) : 1; fadeCast(reveal); }
      for (let i = 0; i < rigs.length; i++) {
        const { rig, motion } = rigs[i], slot = slots[i];
        if (!slot) continue;
        rig.root.visible = slot.visible;
        if (animate) {
          const pose = performanceAt(slot, elapsed, state.project.stage.seed, slots.filter(s => s.visible).length > 1);
          target.set(pose.x, 0, pose.z);
          rig.root.position.lerp(target, 1 - Math.exp(-dt * 6));
          rig.root.position.y = pose.jump;
          rig.root.rotation.y = pose.yaw;
          motion.update(pose.pose, dt * state.project.stage.intensity, slot.lead);
        } else {
          rig.root.position.y = 0;
          motion.idle(slot.lead);
        }
      }
      const leadRig = rigs.find(({ id }) => id === state.track?.performerId)?.rig;
      if (leadRig) spot.target.position.copy(leadRig.root.position).y += 1.1;
      spot.intensity = THREE.MathUtils.damp(spot.intensity, animate ? 100 : 70, 3, dt);
      stageLights.update(animate ? elapsed : null, slots.filter(s => s.visible).length > 1);
      if (animate && automatic && leadRig) {
        const ensemble = slots.filter(s => s.visible).length > 1;
        const phrase = cameraPhrase(elapsed, ensemble);
        const narrow = host.clientWidth < host.clientHeight;
        const focusX = ensemble ? 0 : leadRig.root.position.x;
        target.set(focusX, phrase.close ? 1.65 : 1.35, ensemble ? 0 : 1.1);
        controls.target.lerp(target, 1 - Math.exp(-dt * 1.5));
        target.set(focusX + (narrow ? 0 : phrase.side + (ensemble ? 3 : 1.2)), phrase.close ? 3.3 : 5.3, narrow ? 15.8 : phrase.close ? 8 : 11.8);
        camera.position.lerp(target, 1 - Math.exp(-dt * .7));
        controls.update();
      }
      renderer.render(scene, camera);
      // Controls may already have scheduled a frame during this draw.
      if (animate) invalidate();
    }
    function invalidate() { if (!disposed && !frame && !document.hidden && inView) frame = requestAnimationFrame(draw); }
    function view(view: CameraView) {
      const narrow = host.clientWidth / Math.max(1, host.clientHeight) < 1;
      controls.target.set(0, view === 'lead' ? 1.5 : 1.35, view === 'lead' ? 1 : 0);
      if (view === 'lead') camera.position.set(1.4, 3.2, narrow ? 10 : 7.2);
      else camera.position.set(narrow ? 3.1 : 5.4, narrow ? 7 : 5.3, narrow ? 15.8 : 11.8);
      controls.update(); invalidate();
    }
    function resize() {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      camera.fov = width < height ? 50 : 38; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
      view('wide');
    }
    function update(input: StageInput) {
      const changed = request !== input.request;
      if (changed) { elapsed = 0; lastFrame = 0; request = input.request; }
      if (state.active !== input.active) lastFrame = 0;
      state = input; slots = stageSlots(input.project.performers, input.track);
      const nextSignature = JSON.stringify(input.project.performers.map(p => [p.id, p.appearance, p.color, p.avatar]));
      if (signature !== nextSignature) {
        rigs.forEach(({ rig, motion }) => { motion.dispose(); disposeObject(rig.root); });
        rigs = input.project.performers.map(person => { const rig = createCharacter(person, invalidate); return { id: person.id, rig, motion: createPerformerMotion(rig) }; });
        rigs.forEach(({ rig }, i) => { rig.root.position.set(slots[i].x, 0, slots[i].z); cast.add(rig.root); });
        const materials = new Set<THREE.Material>();
        cast.traverse(object => { if (object instanceof THREE.Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); });
        castMaterials = [...materials];
        signature = nextSignature;
      }
      if (changed || input.reduced || input.project.stage.intensity === 0) {
        // Reset behind a short fade rather than crossing through another performer.
        rigs.forEach(({ rig }, i) => rig.root.position.set(slots[i].x, 0, slots[i].z));
        if (changed && input.active && !input.reduced && input.project.stage.intensity > 0) { reveal = 0; fadeCast(0); }
      }
      const nextScenery = JSON.stringify([input.project.stage.theme, input.project.stage.seed, input.project.stage.color, input.project.stage.accent]);
      if (sceneryKey !== nextScenery) { buildScenery(); sceneryKey = nextScenery; }
      const colors = input.project.stage.mode === 'mood' ? moodColors[input.track?.mood || 'neutral'] : [input.project.stage.color, input.project.stage.accent];
      purple.color.set(colors[0]); orange.color.set(colors[1]);
      stageLights.colors(colors[0], colors[1]);
      invalidate();
    }
    const observer = new ResizeObserver(resize); cleanup.push(() => observer.disconnect()); observer.observe(host);
    const visibility = () => { lastFrame = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else invalidate(); };
    const intersection = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; if (!inView) { cancelAnimationFrame(frame); frame = 0; } else invalidate(); });
    cleanup.push(() => intersection.disconnect()); intersection.observe(host);
    const contextLost = (event: Event) => { event.preventDefault(); onError(); };
    const manual = () => { automatic = false; onManual(); };
    controls.addEventListener('start', manual);
    cleanup.push(() => controls.removeEventListener('start', manual));
    controls.addEventListener('change', invalidate); document.addEventListener('visibilitychange', visibility);
    cleanup.push(() => { controls.removeEventListener('change', invalidate); document.removeEventListener('visibilitychange', visibility); });
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    cleanup.push(() => renderer.domElement.removeEventListener('webglcontextlost', contextLost));
    update(initial); resize();
    return { update, view: choice => { automatic = false; onManual(); view(choice); }, auto: enabled => { automatic = enabled; invalidate(); }, dispose };
  } catch (error) { dispose(); throw error; }
}
