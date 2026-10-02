// 카톡으로 받은 원본 사진(photos-original/)을 홈페이지용으로 다듬어 public/img/ 에 저장한다.
// 실행: npm run photos
// - 캡처할 때 같이 찍힌 검은 띠·넘김 화살표(<, >)를 잘라낸다
// - 밝기·색·선명도를 살짝 올린다
import sharp from 'sharp';

const SRC = 'photos-original/';
const OUT = 'public/img/';

// crop: 원본에서 잘라낼 영역(px). 원본이 바뀌면 이 숫자만 고치면 된다.
const jobs = [
  { name: 'storefront', crop: { left: 200, top: 110, width: 720, height: 900 } },  // 가게 앞 (세로, 위쪽 아치에 벽이 걸리게)
  { name: 'interior',   crop: { left: 147, top: 15,  width: 706, height: 706 } },  // 거울 자리 (화살표 빼고)
  { name: 'counter',    crop: { left: 0,   top: 22,  width: 1054, height: 1054 } },// 카운터
  { name: 'priceboard', crop: { left: 0,   top: 30,  width: 1035, height: 849 } }, // 가격 안내판
];

const polish = (img) => img
  .modulate({ brightness: 1.04, saturation: 1.1 })
  .linear(1.06, -7)          // 대비 살짝
  .sharpen({ sigma: 0.8 });

for (const j of jobs) {
  const base = polish(sharp(SRC + j.name + '.jpg').rotate().extract(j.crop));
  await base.clone().webp({ quality: 82 }).toFile(`${OUT}${j.name}.webp`);
  await base.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}${j.name}.jpg`);
  console.log('✓', j.name);
}

// 카톡·네이버로 주소를 보냈을 때 뜨는 미리보기 그림 (1200×630)
await polish(sharp(SRC + 'storefront.jpg').extract({ left: 130, top: 205, width: 950, height: 499 }))
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(OUT + 'og.jpg');
console.log('✓ og');
