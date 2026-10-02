// 바리스깡 — 오늘 요일 강조 · 지금 영업 중 표시 · 스크롤하면 나타나기 · 머리말 배경
// 영업시간·휴무를 바꾸면 index.html 의 표와 글도 같이 바꾼다.
const SHOP = { open: '10:30', close: '18:30', closedDays: [0, 3] };   // 0=일, 3=수

const d = new Date(Date.now() + 9 * 3600e3);                         // 한국 시간
const day = d.getUTCDay();
const min = d.getUTCHours() * 60 + d.getUTCMinutes();
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

document.querySelector(`.week tr[data-day="${day}"]`)?.classList.add('today');

const closedToday = SHOP.closedDays.includes(day);
const isOpen = !closedToday && min >= toMin(SHOP.open) && min < toMin(SHOP.close);
document.getElementById('openDot').classList.toggle('on', isOpen);
document.getElementById('openText').textContent =
  isOpen ? `지금 영업 중 · ${SHOP.close} 까지`
  : closedToday ? '오늘은 쉬는 날이에요'
  : `영업시간 ${SHOP.open} – ${SHOP.close}`;
document.getElementById('year').textContent = d.getUTCFullYear();

// 스크롤하면 하나씩 나타나기 (js 표시가 붙어야만 숨긴다 → 프로그램이 멈춰도 글자는 보인다)
document.documentElement.classList.add('js');
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });
} else {
  items.forEach((el) => el.classList.add('in'));
}

// 내려가면 머리말에 배경
const header = document.querySelector('.top');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
