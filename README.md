# 🍷 집들이 미스터리: 깨진 와인병의 비밀

6인용 마피아 게임 웹앱 - Vercel 배포용

## 게임 소개

집들이 파티에서 벌어진 미스터리를 풀어가는 마피아 게임입니다. 시민 팀, 마피아 팀, 그리고 만취객(개인전)의 3파전이 벌어집니다.

## 기능

- ✅ 6인용 마피아 게임 (범인, 목격자, 수습반장, 만취객, 시민 2명)
- ✅ 밤/낮 페이즈 자동 전환
- ✅ 히든 미션 시스템
- ✅ JSON 파일 기반 게임 상태 관리
- ✅ PWA 지원 (모바일 앱처럼 설치 가능)
- ✅ 모바일 최적화 (터치 친화적 UI)
- ✅ 실시간 게임 상태 동기화

## 설치 및 실행

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트를 연결
2. 자동으로 배포됩니다 (vercel.json 설정 포함)

또는 Vercel CLI 사용:

```bash
npm i -g vercel
vercel
```

## PWA 아이콘 설정

PWA 기능을 완전히 활성화하려면 `public/icons/` 폴더에 다음 크기의 아이콘을 추가하세요:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

아이콘 생성 도구:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 게임 규칙

자세한 게임 규칙은 `.cursor/rules/basic.mdc` 파일을 참고하세요.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **PWA**: Service Worker + Web App Manifest

## 프로젝트 구조

```
mafia/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/         # React 컴포넌트
│   ├── game/              # 게임 페이지
│   └── page.tsx           # 메인 페이지
├── lib/                   # 게임 로직 및 유틸리티
├── public/                # 정적 파일
│   ├── data/             # JSON 데이터 파일
│   ├── icons/            # PWA 아이콘
│   ├── manifest.json     # PWA 매니페스트
│   └── sw.js            # Service Worker
└── package.json
```

## 라이선스

MIT
