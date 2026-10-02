// 카톡으로 받은 원본 사진(photos-original/)을 홈페이지용으로 다듬어 public/img/ 에 저장한다.
// 실행: npm run photos
// - 캡처할 때 같이 찍힌 검은 띠·넘김 화살표(<, >)를 잘라낸다
// - 컬러판(마우스를 올렸을 때) + 듀오톤판(청록·크림 두 색, 기본 화면) 두 가지로 만든다
// - 카톡·네이버 미리보기 그림(og.jpg)을 디자인해서 만든다
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const SRC = 'photos-original/';
const OUT = 'public/img/';

// 듀오톤 색: 어두운 곳 → 짙은 청록, 밝은 곳 → 크림
const DARK = [6, 40, 42];
const LIGHT = [242, 233, 214];

// crop: 원본에서 잘라낼 영역(px). 원본이 바뀌면 이 숫자만 고치면 된다.
const jobs = [
  { name: 'storefront', crop: { left: 200, top: 110, width: 720, height: 900 } },  // 가게 앞 (세로)
  { name: 'interior',   crop: { left: 147, top: 15,  width: 706, height: 706 } },  // 거울 자리 (화살표 빼고)
  { name: 'counter',    crop: { left: 0,   top: 22,  width: 1054, height: 1054 } },// 카운터
  { name: 'priceboard', crop: { left: 0,   top: 30,  width: 1035, height: 849 } }, // 가격 안내판
  { name: 'sign',       crop: { left: 130, top: 205, width: 950, height: 420 }, from: 'storefront' }, // 간판 띠
];

const polish = (img) => img
  .modulate({ brightness: 1.04, saturation: 1.1 })
  .linear(1.06, -7)
  .sharpen({ sigma: 0.8 });

async function duotone(img) {
  const { data, info } = await img.clone().grayscale().normalise().linear(1.15, -12).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const t = data[i * info.channels] / 255;
    const s = t * t * (3 - 2 * t);                       // 부드러운 S자 대비
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(DARK[c] + (LIGHT[c] - DARK[c]) * s);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } });
}

for (const j of jobs) {
  const base = polish(sharp(SRC + (j.from || j.name) + '.jpg').rotate().extract(j.crop));
  await base.clone().webp({ quality: 82 }).toFile(`${OUT}${j.name}.webp`);
  await base.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}${j.name}.jpg`);
  const duo = await duotone(base);
  await duo.clone().webp({ quality: 82 }).toFile(`${OUT}${j.name}-duo.webp`);
  await duo.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}${j.name}-duo.jpg`);
  console.log('✓', j.name);
}

// 카톡·네이버로 주소를 보냈을 때 뜨는 미리보기 그림 (1200×630)
const W = 1200, H = 630;
const photo = await (await duotone(polish(sharp(SRC + 'storefront.jpg').extract({ left: 200, top: 110, width: 720, height: 900 }))))
  .resize(470, H, { fit: 'cover' }).png().toBuffer();
const logo = await sharp(await readFile(OUT + 'logo.svg'), { density: 400 }).resize(96, 96).png().toBuffer();
const text = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0b1f20"/>
  <text x="180" y="132" font-family="Georgia, serif" font-size="26" letter-spacing="6" fill="#c9a45c">HAERIDAN-GIL · BUSAN</text>
  <text x="66" y="290" font-family="Malgun Gothic" font-weight="bold" font-size="104" fill="#f0e6d2" letter-spacing="-4">바리스깡</text>
  <text x="74" y="345" font-family="Georgia, serif" font-style="italic" font-size="34" fill="#c9a45c">Haircut only · Men &amp; Women</text>
  <line x1="74" y1="385" x2="660" y2="385" stroke="#c9a45c" stroke-opacity=".5"/>
  <text x="74" y="450" font-family="Malgun Gothic, sans-serif" font-size="38" fill="#f0e6d2">남성 커트 <tspan font-weight="700">10,000</tspan>  ·  여성 커트 <tspan font-weight="700">15,000</tspan></text>
  <text x="74" y="505" font-family="Malgun Gothic, sans-serif" font-size="28" fill="#9fc9c8">해운대 해리단길 · 예약 없이 방문 · 051-944-9090</text>
</svg>`);
await sharp(text)
  .composite([
    { input: photo, left: W - 470, top: 0 },
    { input: logo, left: 70, top: 70 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT + 'og.jpg');
console.log('✓ og');
