// 바리스깡 — 오늘 요일 강조 · 지금 영업 중인지 표시
// 영업시간·휴무를 바꾸면 index.html 의 표와 글도 같이 바꾼다.
const SHOP = { open: '10:30', close: '18:30', closedDays: [0, 3] };   // 0=일, 3=수

const d = new Date(Date.now() + 9 * 3600e3);                         // 한국 시간
const day = d.getUTCDay();
const min = d.getUTCHours() * 60 + d.getUTCMinutes();
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

document.querySelector(`.week tr[data-day="${day}"]`)?.classList.add('today');

const closedToday = SHOP.closedDays.includes(day);
const open = !closedToday && min >= toMin(SHOP.open) && min < toMin(SHOP.close);
document.getElementById('openDot').classList.toggle('on', open);
document.getElementById('openText').textContent =
  open ? `지금 영업 중 · ${SHOP.close} 까지`
  : closedToday ? '오늘은 쉬는 날이에요'
  : `영업시간 ${SHOP.open} – ${SHOP.close}`;
document.getElementById('year').textContent = d.getUTCFullYear();

// 주소가 아직 안 정해졌으면 주소 칸을 숨긴다
document.querySelectorAll('.js-addr').forEach((el) => {
  if (el.textContent.includes('SHOP_ADDRESS')) el.remove();
});
