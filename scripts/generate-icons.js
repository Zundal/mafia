#!/usr/bin/env node

/**
 * PWA 아이콘 생성 스크립트
 * 
 * 사용법:
 * 1. 512x512 크기의 아이콘 이미지(icon.png)를 public/icons/ 폴더에 준비
 * 2. npm run generate-icons 실행
 * 
 * 또는 온라인 도구 사용:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 */

const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "../public/icons");
const sourceIcon = path.join(iconsDir, "icon.png");

// Canvas를 사용한 이미지 리사이즈는 Node.js에서 복잡하므로
// 사용자에게 안내 메시지 출력
console.log("📱 PWA 아이콘 생성 가이드\n");
console.log("아이콘을 생성하는 방법:\n");

console.log("방법 1: 온라인 도구 사용 (권장)");
console.log("1. https://www.pwabuilder.com/imageGenerator 방문");
console.log("2. 512x512 크기의 아이콘 이미지를 업로드");
console.log("3. 생성된 아이콘들을 public/icons/ 폴더에 저장\n");

console.log("방법 2: pwa-asset-generator 사용");
console.log("npm install -g pwa-asset-generator");
console.log("pwa-asset-generator icon.png public/icons\n");

console.log("방법 3: ImageMagick 사용");
console.log("brew install imagemagick  # macOS");
console.log("for size in 72 96 128 144 152 192 384 512; do");
console.log("  convert icon.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png");
console.log("done\n");

console.log("필요한 아이콘 크기:");
sizes.forEach((size) => {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const exists = fs.existsSync(iconPath);
  console.log(`  ${exists ? "✓" : "✗"} icon-${size}x${size}.png`);
});

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`\n✓ ${iconsDir} 폴더가 생성되었습니다.`);
}

console.log("\n💡 팁: 임시로 단색 아이콘을 사용하려면");
console.log("   간단한 이미지 편집 도구로 각 크기의 아이콘을 생성하세요.");
