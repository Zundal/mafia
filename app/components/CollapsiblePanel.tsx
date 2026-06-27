"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  /** 접힘 상태에서 보이는 한 줄 요약 (탭하면 펼침) */
  peek: ReactNode;
  /** 펼침 상태 본문 */
  children: ReactNode;
  /** 펼침 높이 클래스 (기본 max-h-[54vh]) */
  maxHeightClass?: string;
  /** 초기 펼침 여부 (기본 true) */
  defaultExpanded?: boolean;
}

/**
 * 밤/낮 페이즈 공용 하단 HUD 패널.
 * 접으면 한 줄 peek만 남아 뒤의 3D 월드가 크게 드러난다.
 * 접힘/펼침은 순수 로컬 UI 상태이며 게임 로직과 무관하다.
 */
export default function CollapsiblePanel({
  peek,
  children,
  maxHeightClass = "max-h-[54vh]",
  defaultExpanded = true,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {expanded ? (
        <div className={cn("panel-dark rounded-t-3xl overflow-y-auto pb-safe animate-fade-in-up", maxHeightClass)}>
          {/* 핸들 = 접기 토글 */}
          <button
            onClick={() => setExpanded(false)}
            aria-expanded={true}
            aria-label="패널 접기"
            className="w-full pt-3 pb-1 flex flex-col items-center transition-opacity active:opacity-60"
          >
            <span className="w-10 h-1 rounded-full" style={{ background: "rgba(160,110,60,0.35)" }} />
            <span className="text-[10px] mt-1" style={{ color: "rgba(150,105,60,0.5)" }}>▾ 내려서 지도 보기</span>
          </button>
          <div className="px-4 pb-4 space-y-3">{children}</div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label="패널 펼치기"
          className="w-full panel-dark rounded-t-3xl pb-safe transition-all active:opacity-80 animate-fade-in-up"
        >
          <div className="flex flex-col items-center pt-2">
            <span className="text-base leading-none" style={{ color: "rgba(180,130,75,0.7)" }}>⌃</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium" style={{ color: "#d4a060" }}>
            {peek}
          </div>
        </button>
      )}
    </div>
  );
}
