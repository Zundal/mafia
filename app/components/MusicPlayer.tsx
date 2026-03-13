"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MUSIC_FILES = [
  { src: "/music/인삼주 데스매치1.mp3", title: "인삼주 데스매치 1" },
  { src: "/music/인삼주 데스매치2.mp3", title: "인삼주 데스매치 2" },
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
    Math.floor(Math.random() * MUSIC_FILES.length)
  );
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHint, setShowHint] = useState(true);

  // 첫 사용자 인터랙션 시 자동재생
  const unlockAndPlay = useCallback(() => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    setShowHint(false);
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [isUnlocked, volume]);

  useEffect(() => {
    const events = ["click", "touchstart", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, unlockAndPlay, { once: true, capture: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, unlockAndPlay, { capture: true }));
    };
  }, [unlockAndPlay]);

  // 곡 종료 시 다음 곡 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      setCurrentTrackIndex((prev: number) => (prev + 1) % MUSIC_FILES.length);
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // 트랙 변경 시 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = MUSIC_FILES[currentTrackIndex].src;
    audio.volume = volume;
    if (isPlaying) {
      audio.load();
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  // 볼륨 동기화
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev: number) => (prev + 1) % MUSIC_FILES.length);
  };

  const currentTrack = MUSIC_FILES[currentTrackIndex];

  return (
    <>
      {/* 자동재생 힌트 */}
      {showHint && (
        <div className="fixed bottom-[104px] right-4 z-40 pointer-events-none" style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 72px)" }}>
          <div className="bg-cyan-500/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium whitespace-nowrap animate-bounce">
            🎵 화면을 터치하면 음악이 시작됩니다
          </div>
        </div>
      )}

      <div className="fixed right-4 z-50" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="glass border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-cyan-950/60 rounded-2xl shadow-xl shadow-cyan-900/20 backdrop-blur-xl overflow-hidden transition-all duration-300 w-[180px]">

          {/* 메인 컨트롤 */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            {/* 재생/일시정지 */}
            <button
              onClick={toggleMusic}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0 ${
                isPlaying
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/30 animate-pulse-soft"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
              aria-label={isPlaying ? "음악 일시정지" : "음악 재생"}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* 트랙 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400">🎵 배경음악</p>
              <p className="text-xs font-semibold text-slate-100 truncate">{currentTrack.title}</p>
              <p className={`text-[10px] ${isPlaying ? "text-cyan-400" : "text-slate-500"}`}>
                {isPlaying ? "▶ 재생 중" : "⏸ 정지"}
              </p>
            </div>

            {/* 접기 버튼 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded-full bg-slate-700/40 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
            >
              <svg className={`w-2.5 h-2.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 확장 패널 */}
          {isExpanded && (
            <div className="px-3 pb-3 space-y-2">
              {/* 다음 곡 버튼 */}
              <button
                onClick={nextTrack}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
                다음 곡
              </button>

              {/* 볼륨 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 rounded-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 w-5 text-right">{Math.round(volume * 100)}</span>
              </div>

              {/* 음악 바 시각화 */}
              {isPlaying && (
                <div className="flex items-end justify-center gap-0.5 h-4">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400/70 rounded-full music-bar"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={MUSIC_FILES[currentTrackIndex].src}
        preload="auto"
        style={{ display: "none" }}
      />
    </>
  );
}
