import * as THREE from 'three';
import type { Performer } from './model';
import { characterLook } from './characterLooks';

export interface CharacterRig {
  root: THREE.Group; body: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group;
  leftLeg: THREE.Group; rightLeg: THREE.Group;
}
export function createCharacter(person: Performer, invalidate: () => void): CharacterRig {
  const root = new THREE.Group(), body = new THREE.Group(); root.name = `performer-${person.id}`; root.add(body);
  const look = characterLook(person.appearance, person.color);
  const material = (role: string, color: string, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: metalness ? .4 : .85, metalness });
    m.name = `${person.appearance}:${role}`; return m;
  };
  const skin = material('skin', '#f4dce0'), ink = material('ink', '#191626'), eyeWhite = material('eye-white', '#fffafd');
  const hair = material('hair', look.hair), hairShade = material('hair-shade', look.hairShade), hairLight = material('hair-light', look.hairLight);
  const coat = material('coat', look.coat), sleeve = material('sleeve', look.sleeve), bodice = material('bodice', look.bodice);
  const skirt = material('skirt', look.skirt), trim = material('trim', look.trim), sock = material('sock', look.sock), shoe = material('shoe', look.shoe);
  const metal = material('hardware', look.metal, .55), iris = material('iris', look.iris);
  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, position: [number, number, number], scale?: [number, number, number], parent: THREE.Object3D = body) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(...position);
    if (scale) object.scale.set(...scale);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  const ball = (mat: THREE.Material, position: [number, number, number], scale: [number, number, number], parent?: THREE.Object3D) => mesh(new THREE.SphereGeometry(1, 20, 16), mat, position, scale, parent);
  const box = (mat: THREE.Material, position: [number, number, number], size: [number, number, number], parent?: THREE.Object3D) => mesh(new THREE.BoxGeometry(...size), mat, position, undefined, parent);
  const neun = person.appearance === 'neun', meda = person.appearance === 'meda', culua = person.appearance === 'culua';
  ball(skin, [0, 2.02, 0], [.55, .55, .47]).name = 'face';
  mesh(new THREE.CylinderGeometry(.16, .16, .18, 10), skin, [0, 1.52, 0]);
  mesh(new THREE.CylinderGeometry(.32, .25, meda ? .38 : .65, 12), meda ? bodice : coat, [0, meda ? 1.03 : 1.12, 0]).name = 'torso';
  if (neun) {
    mesh(new THREE.CylinderGeometry(.25, .54, .43, 16), skirt, [0, .7, 0]).name = 'purple-skirt';
    mesh(new THREE.CylinderGeometry(.51, .54, .06, 16), trim, [0, .51, 0]);
    for (const side of [-1, 1]) {
      box(coat, [side * .19, 1.1, .255], [.22, .62, .09]).rotation.z = side * -.08;
      box(trim, [side * .085, 1.1, .313], [.025, .58, .018]).rotation.z = side * -.08;
      mesh(new THREE.ConeGeometry(.1, .2, 3), ink, [side * .08, 1.37, .33]).rotation.z = side * Math.PI / 2;
    }
    box(ink, [0, 1.16, .32], [.035, .36, .035]);
    ball(metal, [0, 1.35, .36], [.045, .045, .02]);
  } else if (meda) {
    mesh(new THREE.CylinderGeometry(.335, .30, .32, 12), coat, [0, 1.32, 0]).name = 'white-upper-top';
    mesh(new THREE.CylinderGeometry(.25, .43, .43, 12), skirt, [0, .7, 0]);
    for (const x of [-.08, .08]) for (const y of [1.02, 1.13]) ball(metal, [x, y, .26], [.022, .022, .012]);
    box(trim, [0, 1.41, .29], [.065, .16, .04]).rotation.z = .2;
  } else if (culua) {
    for (const side of [-1, 1]) {
      box(bodice, [side * .17, .73, 0], [.29, .29, .4]).name = 'shorts';
      box(trim, [side * .18, 1.12, .275], [.11, .14, .03]).rotation.z = side * .7;
    }
    box(bodice, [0, .93, .24], [.57, .07, .08]);
    box(metal, [0, .93, .29], [.07, .055, .025]);
    box(bodice, [0, 1.22, .275], [.055, .43, .045]).rotation.z = -.5;
    box(trim, [-.16, 1.38, .27], [.055, .09, .025]).rotation.z = -.6;
  } else {
    mesh(new THREE.CylinderGeometry(.24, .4, .43, 12), skirt, [0, .7, 0]);
    box(bodice, [0, 1.22, .27], [.22, .4, .04]);
  }
  const legs = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * .17, .61, 0); body.add(pivot);
    mesh(new THREE.CylinderGeometry(.085, .08, .49, 8), meda && side < 0 ? skin : sock, [0, -.24, 0], undefined, pivot);
    mesh(new THREE.CylinderGeometry(.095, .085, meda ? side < 0 ? .18 : .21 : .29, 8), shoe, [0, meda ? -.37 : -.32, 0], undefined, pivot);
    box(shoe, [0, -.53, .08], [.22, .16, .34], pivot);
    box(meda ? metal : trim, [0, -.44, .03], [.19, .035, .2], pivot);
    return pivot;
  });
  const arms = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * .34, 1.4, 0); body.add(pivot);
    mesh(new THREE.CylinderGeometry(neun ? .15 : .12, neun ? .14 : .1, .36, 10), meda && side < 0 ? skin : sleeve, [side * .045, -.17, 0], undefined, pivot);
    mesh(new THREE.CylinderGeometry(.13, neun ? .17 : .13, .10, 10), meda ? sock : trim, [side * .055, -.35, 0], undefined, pivot);
    ball(skin, [side * .07, -.46, 0], [.09, .13, .09], pivot);
    return pivot;
  });
  const mic = new THREE.Group(); mic.position.set(.07, -.46, .06); arms[1].add(mic);
  mesh(new THREE.CylinderGeometry(.035, .035, .24, 8), metal, [0, .1, 0], undefined, mic);
  ball(ink, [0, .26, 0], [.07, .085, .07], mic);

  if (!neun) ball(hairShade, [0, 2.00, -.23], [.51, .49, .29]).name = 'rear-hair';
  mesh(new THREE.SphereGeometry(.59, 24, 14, 0, Math.PI * 2, 0, Math.PI * .43), hair, [0, 2.04, -.025]).name = 'hair-cap';
  // Explicit sRGB bytes match the material palette, including silver-white hair.
  const pixels = new Uint8Array(128 * 64 * 4);
  const color = new THREE.Color(look.hair).convertLinearToSRGB();
  for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    pixels[i] = Math.round(color.r * 255); pixels[i + 1] = Math.round(color.g * 255); pixels[i + 2] = Math.round(color.b * 255);
    pixels[i + 3] = y / 63 > .36 + Math.cos(x / 127 * Math.PI * 10) * .08 ? 255 : 0;
  }
  const fringeTexture = new THREE.DataTexture(pixels, 128, 64); fringeTexture.colorSpace = THREE.SRGBColorSpace; fringeTexture.needsUpdate = true;
  const fringeMaterial = material('fringe', '#ffffff'); fringeMaterial.map = fringeTexture; fringeMaterial.alphaTest = .5; fringeMaterial.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(1, 32, 16, Math.PI * .08, Math.PI * .84, Math.PI * .18, Math.PI * .3), fringeMaterial, [0, 2.02, 0], [.556, .556, .476]).name = 'flush-fringe';
  if (neun) {
    // Long rear hair stays behind the coat and arm pivots.
    ball(hairShade, [0, 1.55, -.29], [.48, .88, .23]).name = 'long-back-hair';
    for (const side of [-1, 1]) {
      ball(hair, [side * .45, 1.34, -.25], [.16, .7, .17]);
      const curl = mesh(new THREE.TorusGeometry(.15, .07, 8, 18, Math.PI * 1.65), hair, [side * .52, 1.86, .06]); curl.rotation.z = side * .4;
      ball(coat, [side * .56, 2.04, -.02], [.12, .19, .15]);
      mesh(new THREE.TorusGeometry(.13, .025, 6, 16), trim, [side * .56, 2.04, .115]);
      const horn = mesh(new THREE.ConeGeometry(.11, .38, 12), hairShade, [side * .57, 2.36, -.10]); horn.rotation.z = -side * .55; horn.name = 'side-horn';
      for (const wing of [-1, 1]) mesh(new THREE.ConeGeometry(.12, .21, 3), trim, [side * .53 + wing * .09, 2.31, .16]).rotation.z = wing * Math.PI / 2;
      ball(trim, [side * .53, 2.31, .19], [.055, .065, .04]);
      box(trim, [side * .57, 2.10, .12], [.06, .32, .025]).rotation.z = side * -.22;
    }
    for (let i = 0; i < 11; i++) {
      const angle = i / 10 * Math.PI;
      ball(coat, [Math.cos(angle) * .55, 2.12 + Math.sin(angle) * .55, -.08], [.075, .075, .07]);
    }
    ball(trim, [-.38, 2.55, .08], [.13, .13, .06]).name = 'lavender-rose';
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ball(hairLight, [-.38 + Math.cos(a) * .07, 2.55 + Math.sin(a) * .07, .13], [.045, .045, .025]); }
  } else {
    for (const side of [-1, 1]) {
      const length = culua ? .55 : .65;
      ball(hair, [side * .46, 1.95, .035], [meda ? .10 : .16, length * .6, .18]);
      if (!meda) mesh(new THREE.ConeGeometry(.17, .4, 5), hairShade, [side * .49, 1.95 - length * .52, .01]).rotation.z = side * .15;
    }
  }
  if (culua) {
    for (const side of [-1, 0, 1]) {
      const tail = mesh(new THREE.ConeGeometry(.13, .42, 5), hairShade, [side * .18, 1.62, -.36]);
      tail.rotation.z = Math.PI + side * .18; tail.name = 'wolf-tail';
    }
  }
  if (meda) {
    ball(hairLight, [.48, 2.35, -.4], [.26, .33, .25]);
    ball(hair, [.62, 1.88, -.48], [.24, .66, .25]).rotation.z = .24;
    const band = mesh(new THREE.TorusGeometry(.56, .06, 5, 20, Math.PI), ink, [0, 2.09, -.01]); band.rotation.y = Math.PI / 2;
    for (const side of [-1, 1]) {
      mesh(new THREE.ConeGeometry(.13, .48, 3), trim, [side * .4, 2.65, -.04]).rotation.z = -side * .32;
      box(ink, [side * .51, 2.23, 0], [.17, .23, .23]);
    }
  }
  for (const side of [-1, 1]) {
    ball(eyeWhite, [side * .205, 2.02, .423], [.145, .17, .035]);
    ball(iris, [side * .205, 2.015, .456], [.09, .12, .025]);
    ball(ink, [side * .205, 2.02, .476], [.039, .075, .012]);
    ball(eyeWhite, [side * .205 - .025, 2.06, .486], [.026, .033, .012]);
    box(ink, [side * .205, 2.17, .438], [.23, .027, .024]).rotation.z = side * -.12;
    ball(material('cheek', '#f6a9bc'), [side * .34, 1.86, .365], [.075, .035, .015]);
  }
  ball(material('mouth', '#9b5977'), [0, 1.81, .444], [.048, .019, .015]);
  if (person.appearance === 'generic' && person.avatar) {
    const texture = new THREE.TextureLoader().load(person.avatar, invalidate);
    texture.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.MeshBasicMaterial({ map: texture });
    mesh(new THREE.CircleGeometry(.16, 24), badge, [0, 1.14, .294]);
  }
  return { root, body, leftArm: arms[0], rightArm: arms[1], leftLeg: legs[0], rightLeg: legs[1] };
}

export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map);
      }
    }
  });
  textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
  root.removeFromParent();
}
