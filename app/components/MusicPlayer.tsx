"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_FILES = [
  "/music/인삼주 데스매치1.mp3",
  "/music/인삼주 데스매치2.mp3",
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => 
    Math.floor(Math.random() * MUSIC_FILES.length)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 자동 재생 시도
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          // 자동 재생이 차단된 경우 (브라우저 정책)
          console.log("자동 재생이 차단되었습니다. 사용자가 직접 재생해야 합니다.");
          setIsPlaying(false);
        });
    }

    // 곡이 끝나면 다음 곡 재생 (랜덤)
    const handleEnded = () => {
      const nextIndex = Math.floor(Math.random() * MUSIC_FILES.length);
      setCurrentTrackIndex(nextIndex);
      // 약간의 지연 후 재생 (브라우저 호환성)
      setTimeout(() => {
        audio.load();
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }, 100);
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex]);

  // 현재 곡이 변경되면 로드
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = MUSIC_FILES[currentTrackIndex];
    if (isPlaying) {
      audio.load();
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, isPlaying]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error("재생 실패:", error);
      });
    }
  };

  const nextTrack = () => {
    const nextIndex = Math.floor(Math.random() * MUSIC_FILES.length);
    setCurrentTrackIndex(nextIndex);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="glass border-cyan-500/30 bg-cyan-500/10 rounded-xl p-3 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMusic}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center transition-all shadow-lg shadow-cyan-500/25"
            aria-label={isPlaying ? "음악 일시정지" : "음악 재생"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button
            onClick={nextTrack}
            className="w-10 h-10 rounded-full glass-light hover:bg-slate-800/50 text-slate-100 flex items-center justify-center transition-all border border-slate-700/50"
            aria-label="다음 곡"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="hidden md:block text-xs text-slate-300">
            <p className="font-medium">🎵 배경음악</p>
            <p className="text-slate-400">{isPlaying ? "재생 중" : "일시정지"}</p>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        loop={false}
        preload="auto"
        style={{ display: "none" }}
      />
    </div>
  );
}
