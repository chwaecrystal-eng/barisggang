# 바리스깡 홈페이지

부산 해운대구 우동 **남녀 커트 전문점 바리스깡** 홍보용 홈페이지. 예약·결제 없음.

- 원장: 최윤소 · 일반전화 051-944-9090 · 부산 해운대구 우동1로20번가길 7
- 남성 커트 10,000원 · 여성 커트 15,000원 · 10:30–18:30 · 수·일 휴무 · 예약 없이 방문

## 폴더

| 위치 | 내용 |
|---|---|
| `public/` | 홈페이지 그대로 (이 폴더만 올리면 된다) |
| `public/index.html` | 글·가격·영업시간·주소·검색용 정보 |
| `public/style.css` | 디자인 (색은 맨 위 `:root`) |
| `public/app.js` | 오늘 요일 강조 · 「지금 영업 중」 표시 |
| `public/img/` | 다듬은 사진 · 로고 · 아이콘 |
| `photos-original/` | 카톡으로 받은 원본 사진 |
| `scripts/photos.mjs` | 원본 → 홈페이지용 사진 (`npm run photos`) |
| `scripts/serve.mjs` | 내 컴퓨터 미리보기 (`npm run preview` → http://localhost:8080) |

## 자주 고치는 것

- **가격·영업시간·휴무**: `public/index.html` 에서 찾아 바꾼다 (첫 화면 작은 칸, 가격 칸, 요일 표, 검색용 정보 `application/ld+json`, 맨 위 `description`). 영업시간·휴무는 `public/app.js` 의 `SHOP` 도 같이.
- **사진 바꾸기**: `photos-original/` 에 같은 이름으로 넣고 `npm run photos`. 자르는 위치는 `scripts/photos.mjs` 의 `crop` 숫자.

## 올린 뒤 할 일

1. `SITE_URL` 을 실제 주소로 바꾼다 — `public/index.html`, `public/robots.txt`, `public/sitemap.xml`
2. 검색 등록 (모두 무료)
   - 네이버 서치어드바이저 (searchadvisor.naver.com) → 사이트 등록 → 받은 값을 `naver-site-verification` 에 → 사이트맵 제출
   - 구글 서치콘솔 (search.google.com/search-console) → 같은 방식 `google-site-verification`
   - 다음 검색등록 (register.search.daum.net)
3. 지도·장소 등록 (손님이 가장 많이 찾는 곳, 모두 무료)
   - 네이버 스마트플레이스 (smartplace.naver.com) — 홈페이지 칸에 주소
   - 카카오맵 장소 등록 (카카오맵 앱 → 장소 제보/비즈니스)
   - 구글 비즈니스 프로필 (business.google.com)
