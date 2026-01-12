# 음악 파일

이 폴더에 게임에서 사용할 음악 파일을 추가하세요.

## 권장 파일 형식

- **MP3**: 가장 널리 지원되는 형식
- **OGG**: 더 작은 파일 크기, 좋은 품질
- **M4A**: iOS에서 최적화

## 음악 파일 예시

게임 분위기에 맞는 음악을 추가하세요:

- `night-bgm.mp3` - 밤 페이즈 배경음악
- `day-bgm.mp3` - 낮 페이즈 배경음악
- `voting-bgm.mp3` - 투표 페이즈 배경음악
- `game-start.mp3` - 게임 시작 효과음
- `game-end.mp3` - 게임 종료 효과음

## 사용 방법

음악 파일을 이 폴더에 추가한 후, 컴포넌트에서 다음과 같이 사용할 수 있습니다:

```tsx
<audio src="/music/night-bgm.mp3" loop autoPlay />
```

## 저작권 주의

- 무료 음악 사이트: [Freesound](https://freesound.org/), [Zapsplat](https://www.zapsplat.com/)
- 무료 BGM: [YouTube Audio Library](https://www.youtube.com/audiolibrary)
- 라이선스 확인 필수
