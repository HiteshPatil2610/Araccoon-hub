import * as THREE from 'three';

/** Procedural mascot: all geometry is editable, with no external model assets. */
export function createRaccoonModel() {
  const raccoon = new THREE.Group();
  const materials = {
    fur: new THREE.MeshStandardMaterial({ color: '#82766f', roughness: .95 }),
    cream: new THREE.MeshStandardMaterial({ color: '#d9cbbb', roughness: .9 }),
    dark: new THREE.MeshStandardMaterial({ color: '#24202a', roughness: .85 }),
    cloth: new THREE.MeshStandardMaterial({ color: '#211a31', roughness: .92 }),
    purple: new THREE.MeshStandardMaterial({ color: '#8239d6', roughness: .6 }),
    glow: new THREE.MeshStandardMaterial({ color: '#c49aff', emissive: '#8a23ff', emissiveIntensity: 3 }),
    eye: new THREE.MeshStandardMaterial({ color: '#e4a342', roughness: .25 }),
    black: new THREE.MeshStandardMaterial({ color: '#0b0b12', roughness: .25 }),
  };
  type Material = keyof typeof materials;
  function oval(name: string, material: Material, position: number[], scale: number[], parent = raccoon) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), materials[material]);
    mesh.name = name;
    mesh.position.set(position[0]!, position[1]!, position[2]!);
    mesh.scale.set(scale[0]!, scale[1]!, scale[2]!);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function box(name: string, material: Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale as [number, number, number]), materials[material]);
    mesh.name = name; mesh.position.set(...position as [number, number, number]); mesh.castShadow = true; raccoon.add(mesh); return mesh;
  }
  // A thick curved, alternating ring tail behind the jacket.
  const tailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.8, -.35), new THREE.Vector3(-.65, 1.35, -.55),
    new THREE.Vector3(-1.02, .65, -.35), new THREE.Vector3(-.95, .28, .1),
  ]);
  for (let i = 0; i < 12; i++) {
    const p = tailPath.getPoint(i / 11);
    const segment = oval('Tail ring', i % 3 === 0 ? 'dark' : 'fur', p.toArray(), [.34, .29, .33]);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailPath.getTangent(i / 11).normalize());
  }
  oval('Hood', 'cloth', [0, 2.55, -.22], [.67, .5, .38]);
  oval('Jacket', 'cloth', [0, 1.95, 0], [.59, .75, .35]);
  oval('T-shirt', 'dark', [0, 1.95, .31], [.3, .58, .055]);
  for (const side of [-1, 1]) {
    oval('Cargo trouser', 'cloth', [side * .29, .86, 0], [.27, .65, .28]);
    box('Cargo pocket', 'dark', [side * .47, 1.04, .13], [.16, .27, .25]);
    box('Pocket strap', 'purple', [side * .47, 1.01, .265], [.065, .28, .02]);
    oval('Sneaker sole', 'cream', [side * .3, .15, .16], [.3, .095, .43]);
    oval('High-top sneaker', 'dark', [side * .3, .26, .13], [.27, .18, .38]);
    oval('Toe panel', 'cream', [side * .3, .26, .39], [.21, .08, .16]);
    for (let i = 0; i < 4; i++) box('Laces', 'cream', [side * .3, .37 + i * .015, .14 + i * .045], [.19, .015, .02]);
    const arm = oval('Sleeve', 'cloth', [side * .58, 1.96, .02], [.25, .53, .26]);
    arm.rotation.z = side * .22;
    oval('Wrist fur', 'fur', [side * .65, 1.55, .16], [.19, .18, .18]);
    oval('Paw in pocket', 'dark', [side * .55, 1.38, .25], [.17, .23, .14]);
    box('Jacket trim', 'purple', [side * .32, 2.04, .34], [.04, 1.04, .03]);
    box('Hood drawstring', 'purple', [side * .24, 2.36, .39], [.035, .36, .035]);
  }
  oval('Head', 'fur', [0, 3.02, .04], [.65, .58, .45]);
  for (const side of [-1, 1]) {
    const ear = oval('Ear', 'fur', [side * .46, 3.51, .02], [.23, .37, .15]); ear.rotation.z = -side * .35;
    const inner = oval('Inner ear', 'dark', [side * .46, 3.54, .14], [.145, .24, .035]); inner.rotation.z = -side * .35;
    const mask = oval('Eye mask', 'dark', [side * .285, 3.07, .423], [.29, .17, .07]); mask.rotation.z = side * .18;
    oval('Amber iris', 'eye', [side * .255, 3.075, .488], [.09, .077, .025]);
    oval('Pupil', 'black', [side * .245, 3.08, .51], [.043, .057, .015]);
    oval('Eye sparkle', 'cream', [side * .245 - .016, 3.107, .524], [.018, .018, .01]);
    const brow = oval('Cream eyebrow', 'cream', [side * .28, 3.28, .398], [.29, .07, .04]); brow.rotation.z = side * -.25;
    oval('Muzzle cheek', 'cream', [side * .18, 2.88, .43], [.28, .19, .17]);
    for (let i = 0; i < 4; i++) {
      const tuft = oval('Cheek tuft', 'fur', [side * (.49 + i * .035), 2.88 + i * .07, .12], [.17, .055, .16]); tuft.rotation.z = side * -.35;
    }
    oval('Headphone cushion', 'black', [side * .48, 2.62, .26], [.19, .24, .12]);
    oval('Headphone shell', 'purple', [side * .49, 2.63, .34], [.175, .215, .09]);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.145, .014, 8, 40), materials.glow);
    ring.position.set(side * .49, 2.63, .425); raccoon.add(ring);
  }
  oval('Nose', 'black', [0, 2.96, .615], [.12, .085, .07]);
  oval('Chin', 'cream', [0, 2.72, .36], [.27, .12, .14]);
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.16, 2.83, .577), new THREE.Vector3(0, 2.79, .586), new THREE.Vector3(.17, 2.85, .577),
  ]), 20, .012, 6, false), materials.dark); raccoon.add(smile);
  for (let i = 0; i < 6; i++) {
    const tuft = oval('Hair tuft', 'dark', [-.2 + i * .085, 3.52 + Math.sin(i) * .05, .18], [.075, .22, .1]); tuft.rotation.z = -.5;
  }
  box('Necklace', 'cream', [0, 2.37, .395], [.018, .21, .018]);
  const charm = box('Pendant', 'purple', [0, 2.24, .4], [.09, .09, .035]); charm.rotation.z = Math.PI / 4;
  return raccoon;
}
