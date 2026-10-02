// 첫 화면 3D 이발소 기둥 (three.js)
// - 유리관 안 줄무늬(빨강·크림·바리스깡 청록)가 위로 흐르고, 위아래는 놋쇠 마개
// - 마우스·손가락 방향으로 살짝 기울고, 둘레에 금빛 먼지가 떠다닌다
// - 화면에서 안 보이면 멈춰 배터리를 아낀다. 3D가 안 되면 CSS 그림(.pole-fallback)이 그대로 보인다
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('pole3d');
const stage = canvas?.parentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
} catch { /* 3D 안 되는 기기 → 대체 그림 */ }

if (renderer && stage) start();

// 대각선 줄무늬 — 이어 붙여도 이음매가 안 보이게 (x + y) 주기로 칠한다
function stripeTexture() {
  const S = 512, P = 256;                                 // P: 한 벌(빨강·크림·청록·크림)의 폭
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const cols = [[194, 59, 47], [244, 236, 220], [31, 143, 147], [244, 236, 220]];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const p = ((x + y) % P) / P * 4;                     // 0~4
      const i = Math.floor(p), f = p - i;
      const a = cols[i], b = cols[(i + 1) % 4];
      const edge = Math.min(1, Math.max(0, (f - 0.985) / 0.015)); // 경계만 살짝 부드럽게
      const o = (y * S + x) * 4;
      for (let k = 0; k < 3; k++) img.data[o + k] = a[k] + (b[k] - a[k]) * edge;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(2, 2.4);
  return t;
}

function start() {
  stage.classList.add('is-3d');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.1, 10.5);

  // 조명: 따뜻한 정면 + 청록 테두리 빛
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3fc4c6, 2.6); rim.position.set(-4, 1, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 1, roughness: 0.26 });
  const stripes = stripeTexture();

  const pole = new THREE.Group();
  const H = 3.2;

  // 줄무늬 기둥
  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.44, H, 96, 1, true),
    new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.32, metalness: 0 })
  ));
  // 유리관
  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(0.53, 0.53, H, 96, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.25, ior: 1.45, clearcoat: 1, transparent: true, opacity: 0.35 })
  ));

  // 놋쇠 마개 (위·아래)
  const capRing = new THREE.CylinderGeometry(0.62, 0.62, 0.2, 64);
  const lip = new THREE.TorusGeometry(0.62, 0.035, 16, 96);
  for (const s of [1, -1]) {
    const ring = new THREE.Mesh(capRing, brass); ring.position.y = s * (H / 2 + 0.1); pole.add(ring);
    const l1 = new THREE.Mesh(lip, brass); l1.rotation.x = Math.PI / 2; l1.position.y = s * (H / 2 + 0.2); pole.add(l1);
    const l2 = l1.clone(); l2.position.y = s * (H / 2); pole.add(l2);
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), brass);
  dome.position.y = H / 2 + 0.2; pole.add(dome);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.28, 24), brass);
  neck.position.y = H / 2 + 0.9; pole.add(neck);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 16), brass);
  knob.position.y = H / 2 + 1.1; pole.add(knob);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.18, 0.5, 64), brass);
  base.position.y = -(H / 2 + 0.45); pole.add(base);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), brass);
  foot.position.y = -(H / 2 + 0.78); pole.add(foot);

  pole.rotation.z = -0.16;
  scene.add(pole);

  // 금빛 먼지
  const N = 140;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 6;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
    speed[i] = 0.08 + Math.random() * 0.22;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xe2c27f, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);

  // 크기 맞추기
  const fit = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.75 ? 12.5 : 10.5;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);                       // 크기를 바꾸면 그림이 지워지므로 바로 다시 그린다
  };
  new ResizeObserver(fit).observe(stage);

  // 마우스·손가락 → 살짝 기울기
  const aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    aim.x = (e.clientX / innerWidth - 0.5) * 2;
    aim.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();
  let running = false;
  const frame = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    stripes.offset.y -= dt * 0.22;                         // 줄무늬가 위로 흐름
    cur.x += (aim.x - cur.x) * 0.05;
    cur.y += (aim.y - cur.y) * 0.05;
    pole.rotation.y = t * 0.25 + cur.x * 0.5;
    pole.rotation.x = cur.y * 0.12;
    pole.position.y = Math.sin(t * 0.9) * 0.08;
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] += speed[i] * dt;
      if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = -3;
    }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  fit();
  if (still) { renderer.render(scene, camera); return; }

  // 화면에 보일 때만 움직인다
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
    else if (!en.isIntersecting) running = false;
  }).observe(stage);
}
