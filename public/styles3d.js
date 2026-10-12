// 커트 스타일 예시 — 가로로 흐르는 세 줄 (three.js)
// - 여성 · 남성 · 학생·아이 세 줄이 살짝 휘어진 원통 위에서 서로 반대 방향으로 천천히 흐른다
// - 사진과 이름(한글·영문)을 한 장의 그림에 같이 그려 넣어, 이름이 늘 사진 가운데 아래에 정확히 놓인다
// - 마우스를 올리면 그 사진이 앞으로 살짝 나오고 그 줄이 느려진다. 끌거나 손가락으로 밀면 그 줄이 움직인다
// - 화면에서 안 보이면 멈춘다. 3D가 안 되면 index.html 의 가로 목록(.rows)이 그대로 보인다
import * as THREE from 'three';

const section = document.getElementById('styles');
const canvas = document.getElementById('styles3d');
const reel = canvas?.parentElement;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
} catch { /* 3D 안 되는 기기 → 가로 목록 */ }

if (renderer && section) start().catch(() => section.classList.remove('is-3d'));

const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// 사진 + 이름 한 장 (480 × 560). 이름 칸은 투명 — 뒤의 크림색 바탕이 그대로 보인다
const TW = 480, TI = 384, TH = 560;
function cardTexture(img, ko, en, flip) {
  const c = document.createElement('canvas');
  c.width = TW; c.height = TH;
  const g = c.getContext('2d');
  g.save();
  g.beginPath(); g.roundRect(0, 0, TW, TI, 14); g.clip();
  if (flip) { g.translate(TW, 0); g.scale(-1, 1); }       // 좌우 뒤집은 판 — 이름 글자는 뒤집지 않는다
  g.drawImage(img, 0, 0, TW, TI);
  g.restore();
  g.textAlign = 'center';
  g.fillStyle = '#0b1f20';
  g.font = '800 40px "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  g.fillText(ko, TW / 2, TI + 66);
  g.fillStyle = '#c9a45c';
  g.fillRect(TW / 2 - 14, TI + 92, 28, 2);                  // 놋쇠 짧은 줄
  g.fillStyle = '#2a9396';
  g.font = 'italic 400 31px Fraunces, Georgia, serif';
  g.fillText(en, TW / 2, TI + 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

async function start() {
  // 목록(.rows)에서 사진·이름을 읽는다 — 사진을 바꾸면 index.html 만 고치면 된다
  const rows = [...section.querySelectorAll('.rows .row')].map((r) => ({
    name: r.querySelector('.row__name').outerHTML,
    items: [...r.querySelectorAll('li')].map((li) => ({
      src: li.querySelector('source')?.srcset || li.querySelector('img').src,
      ko: li.querySelector('figcaption b').textContent,
      en: li.querySelector('figcaption small').textContent,
    })),
  }));
  if (!rows.length) return;

  await Promise.all([
    document.fonts.load('800 40px "Pretendard Variable"'),
    document.fonts.load('italic 400 31px Fraunces'),
  ]).catch(() => {});
  const imgs = await Promise.all(rows.flatMap((r) => r.items.map((it) => loadImg(it.src))));
  let k = 0;
  // 줄마다 사진을 되풀이할 때 같은 모습이 반복돼 보이지 않게, 두 바퀴에 한 번은 사진을 좌우로 뒤집는다
  // (순서는 그대로 — 같은 사진끼리 늘 한 바퀴만큼 떨어져 있어 한 화면에 잘 겹치지 않는다)
  const textures = rows.map((r) => r.items.map((it) => { const img = imgs[k++]; const m = {};
    return (flip) => (m[flip] ||= cardTexture(img, it.ko, it.en, flip)); }));

  section.classList.add('is-3d');
  const names = reel.querySelector('.reel__names');
  names.innerHTML = rows.map((r) => r.name).join('');
  const nameEls = [...names.children];

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 10000);
  const geo = new THREE.PlaneGeometry(1, 1);

  // 줄마다: 카드 묶음(화면을 채우도록 여러 번 되풀이), 흐름 방향, 지금 위치
  const lanes = textures.map((tex, i) => ({ tex, dir: i % 2 ? 1 : -1, off: 0, slow: 1, cards: [], y: 0 }));
  let L = {};                                              // 크기 값 (fit 에서 정함)

  const fit = () => {
    const w = reel.clientWidth;
    if (!w) return;
    const cw = w < 640 ? 132 : w < 960 ? 170 : 196;          // 카드 폭 (px)
    const ch = cw * TH / TW, gap = w < 640 ? 14 : 24, nameH = w < 640 ? 34 : 40, rowGap = w < 640 ? 22 : 34;
    const h = Math.round(rows.length * (nameH + ch) + (rows.length - 1) * rowGap + 30);
    L = { w, h, cw, ch, gap, step: cw + gap, R: Math.max(w * 1.05, 700) };
    canvas.style.height = h + 'px';
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = (h / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));   // 1 = 화면 1px
    camera.updateProjectionMatrix();

    lanes.forEach((ln, i) => {
      const top = i * (nameH + ch + rowGap);
      nameEls[i].style.top = top + 'px';
      ln.y = h / 2 - (top + nameH + ch / 2);
      ln.top = top; ln.bottom = top + nameH + ch;
      // 둘레가 화면보다 넉넉히 길어지도록 되풀이
      const reps = Math.max(1, Math.ceil((L.R * Math.PI) / (ln.tex.length * L.step)));
      const need = ln.tex.length * reps;
      while (ln.cards.length < need) {
        const j = ln.cards.length, n = ln.tex.length;
        const t = ln.tex[j % n](Math.floor(j / n) % 2 === 1);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true }));
        m.userData = { lift: 0 };
        scene.add(m); ln.cards.push(m);
      }
      ln.cards.forEach((m, j) => { m.visible = j < need; m.scale.set(cw, ch, 1); });
      ln.len = need * L.step;
    });
    place();
    renderer.render(scene, camera);
  };

  // 원통 위에 놓기: 가운데는 앞으로, 양 끝은 뒤로 휘어 들어간다
  const place = () => {
    lanes.forEach((ln) => {
      const n = ln.len / L.step;
      ln.cards.forEach((m, j) => {
        if (j >= n) return;
        let s = ((j * L.step + ln.off) % ln.len + ln.len) % ln.len - ln.len / 2;
        const th = s / L.R;
        if (Math.abs(th) > 1.45) { m.visible = false; return; }
        m.visible = true;
        const lift = m.userData.lift;
        m.position.set(L.R * Math.sin(th), ln.y + lift * 6, L.R * Math.cos(th) - L.R + lift * 40);
        m.rotation.y = th;
        const sc = 1 + lift * 0.06;
        m.scale.set(L.cw * sc, L.ch * sc, 1);
      });
    });
  };

  // 마우스 · 손가락
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let hover = null, hoverLane = -1, drag = null;
  const laneAt = (y) => lanes.findIndex((ln) => y >= ln.top && y <= ln.bottom);
  const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (drag) { lanes[drag.lane].off += p.x - drag.x; drag.x = p.x; drag.moved = true; }
    hoverLane = laneAt(p.y);
    if (e.pointerType !== 'mouse') return;
    ptr.set((p.x / L.w) * 2 - 1, -(p.y / L.h) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    hover = ray.intersectObjects(lanes.flatMap((ln) => ln.cards.filter((m) => m.visible)))[0]?.object || null;
  });
  canvas.addEventListener('pointerleave', () => { hover = null; hoverLane = -1; drag = null; });
  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e), lane = laneAt(p.y);
    if (lane < 0) return;
    drag = { lane, x: p.x, moved: false };
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  });
  const up = () => { drag = null; if (!matchMedia('(hover: hover)').matches) hoverLane = -1; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  new ResizeObserver(fit).observe(reel);
  fit();

  const clock = new THREE.Clock();
  let running = false;
  const SPEED = still ? 0 : 26;                             // px/초
  const frame = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    lanes.forEach((ln, i) => {
      const target = drag && drag.lane === i ? 0 : hoverLane === i ? 0.18 : 1;
      ln.slow += (target - ln.slow) * 0.08;
      ln.off += ln.dir * SPEED * ln.slow * dt;
      ln.cards.forEach((m) => { m.userData.lift += ((m === hover ? 1 : 0) - m.userData.lift) * 0.12; });
    });
    place();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
    else if (!en.isIntersecting) running = false;
  }).observe(reel);
}
