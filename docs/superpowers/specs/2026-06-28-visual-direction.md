# 비주얼 디렉션 — 촛불 누아르 (Candlelit Noir)

집들이(따뜻한 집·저녁 모임) + 깨진 와인병 + 밤의 살인 미스터리. 한국어.
키워드: 촛불, 와인, 어둠 속 대화, 우아하지만 불온한.

## 토큰

### Color (semantic, CSS vars in globals.css)
- `--bg` #14100B · `--bg-deep` #0D0A06 (밤 패널/딥)
- `--surface` #1B1510 · `--surface-2` #241C14 (raised)
- `--candle` #E8B864 (앰버 광원 = 액센트) · `--candle-soft` #C99A52
- `--wine` #8C1C24 (시그니처) · `--wine-bright` #B33340 (active/hover)
- `--ink` #E9DEC9 (파치먼트 본문) · `--ink-muted` #A89madeup→ #A89478 · `--ink-faint` #6E6150
- `--line` rgba(233,222,201,.10) (따뜻한 중립 헤어라인 — 주황 테두리 금지)
- 팀: 시민 #86B07C(sage) · 마피아 = wine · 만취객 = candle

원칙: 난립하던 mid-brown(rgba(160,100,60)류) 제거 → 위 토큰만 사용. 글로우는 절제.

### Type
- Display(제목, 절제): **Gowun Batang** (한글 명조)
- Body: **Pretendard** (프리미엄 한글 산세)
- Eyebrow/label/숫자: **IBM Plex Mono** (에디토리얼 정밀감), 숫자는 tabular-nums
- 위계: 큰 제목은 명조 + letter-spacing 약간 좁게, 라벨은 mono + uppercase + tracking 넓게.

### Layout / Flow
- 랜딩: 히어로가 thesis. 3D 시그니처 + 명조 타이틀 + 단일 와인 CTA. 보조 동선(혼자 해보기/이야기)은 조용히.
- 일관 아이콘: 이모지 → 인라인 SVG 라인 아이콘 세트(icons.tsx). 이모지는 브랜드 마크/감정 1~2곳만.

### Signature
랜딩 Three.js: 촛불 광원 아래 천천히 회전하는 **와인잔/깨진 와인병** + 떠다니는 먼지·불씨. 따뜻한 bottom-light. 첫인상 = 기억점.

## 시도 로그
- v1: 토큰 재정의 + 폰트 + 아이콘 + 랜딩 히어로(HeroScene). 이후 게임/스토리/데모/조인 전파.
