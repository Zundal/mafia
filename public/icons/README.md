# PWA 아이콘

이 폴더에 다음 크기의 아이콘 이미지를 추가하세요:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## 빠른 아이콘 생성 방법

### 방법 1: PWA Builder (가장 쉬움) ⭐

1. [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator) 방문
2. `icon.svg` 파일을 업로드하거나 512x512 PNG 이미지 업로드
3. "Generate" 클릭
4. 생성된 아이콘들을 다운로드하여 이 폴더에 저장

### 방법 2: pwa-asset-generator (CLI)

```bash
# 전역 설치
npm install -g pwa-asset-generator

# 아이콘 생성 (512x512 원본 이미지 필요)
pwa-asset-generator icon.png public/icons --icon-background "#0f172a" --icon-maskable true
```

### 방법 3: ImageMagick (macOS/Linux)

```bash
# 설치 (macOS)
brew install imagemagick

# 아이콘 생성
for size in 72 96 128 144 152 192 384 512; do
  convert icon.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

### 방법 4: 온라인 도구

- [RealFaviconGenerator](https://realfavicongenerator.net/) - 다양한 플랫폼 아이콘 생성
- [Favicon.io](https://favicon.io/) - 간단한 아이콘 생성

## 현재 상태 확인

```bash
npm run generate-icons
```

이 명령어를 실행하면 필요한 아이콘 파일들의 존재 여부를 확인할 수 있습니다.

## 참고

- 아이콘은 최소 192x192, 권장 512x512 크기
- 배경색: `#0f172a` (다크 슬레이트)
- Maskable 아이콘 권장 (안드로이드)
- PNG 형식 사용
