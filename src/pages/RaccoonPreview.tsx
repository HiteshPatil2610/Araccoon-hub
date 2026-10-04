import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createRaccoonModel } from '../components/RaccoonModel';
import './raccoon-preview.css';

export function RaccoonPreview() {
  const host = useRef<HTMLDivElement>(null);
  const model = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [rotate, setRotate] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setError('This preview needs a browser with WebGL enabled.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D gaming raccoon. Drag to orbit; scroll to zoom.');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
    camera.position.set(4.5, 3.2, 7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.9, 0); controls.enableDamping = true;
    controls.minDistance = 4.5; controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * .53; controls.enablePan = false;
    controlsRef.current = controls;
    scene.add(new THREE.HemisphereLight('#c4cdff', '#34233c', 2));
    const key = new THREE.DirectionalLight('#fff0da', 4); key.position.set(3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
    const purple = new THREE.PointLight('#a02dff', 35); purple.position.set(-3, 3, -1); scene.add(purple);
    const cyan = new THREE.PointLight('#26beff', 25); cyan.position.set(3, 2, -2); scene.add(cyan);
    const mascot = createRaccoonModel(); scene.add(mascot); model.current = mascot;
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.75, .12, 64), new THREE.MeshStandardMaterial({ color: '#181727', metalness: .45, roughness: .4 }));
    pedestal.position.y = -.02; pedestal.receiveShadow = true; scene.add(pedestal);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.65, .012, 8, 96), new THREE.MeshBasicMaterial({ color: '#9c64ff' })); rim.rotation.x = Math.PI / 2; rim.position.y = .045; scene.add(rim);
    const resize = new ResizeObserver(() => { const { width, height } = element.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); }); resize.observe(element);
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return () => {
      resize.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(m => m.dispose()); } });
      renderer.dispose(); renderer.domElement.remove(); model.current = null; controlsRef.current = null;
    };
  }, []);
  useEffect(() => { if (controlsRef.current) controlsRef.current.autoRotate = rotate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, [rotate]);
  async function download() {
    if (!model.current) return;
    try {
      const result = await new GLTFExporter().parseAsync(model.current, { binary: true });
      const url = URL.createObjectURL(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }));
      const a = document.createElement('a'); a.href = url; a.download = 'araccoon-mascot.glb'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Could not export the model. Please try again.'); }
  }
  return <main className="raccoon-studio">
    <header><Link to="/">RACCOON <span>HUB</span></Link><span className="studio-badge">CHARACTER LAB / 001</span></header>
    <div className="studio-layout"><section className="studio-copy"><p className="studio-eyebrow">MEET YOUR NEW PLAYER TWO</p><h1>A little mischief.<br /><em>A lot of style.</em></h1><p>Your gaming raccoon, built in real 3D. Purple streetwear, amber eyes, glowing headphones, and a signature striped tail.</p><div className="studio-tags"><span>PROCEDURAL 3D</span><span>THREE.JS</span><span>V1 CONCEPT</span></div><div className="studio-actions"><button onClick={() => setRotate(!rotate)}>{rotate ? 'Pause rotation' : 'Rotate model'}</button><button onClick={() => void download()}>Download .GLB ↓</button></div><p className="studio-note">A stylized interpretation of your reference. Fine fur and realistic clothing folds would need a sculpted asset in a later pass.</p></section>
    <section className="studio-view"><div ref={host} className="studio-canvas" />{error && <p role="alert">{error}</p>}<div className="studio-caption"><span>RACCOON / STREETWEAR EDITION</span><span>Drag to orbit · Scroll to zoom</span></div></section></div>
  </main>;
}
