import { SVGProps } from "react";

/**
 * 촛불 누아르 라인 아이콘 세트.
 * 모두 currentColor 스트로크 기반 — 부모의 color를 따른다.
 * 이모지 대신 일관된 시각 언어를 제공한다.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(props: IconProps) {
  const { size = 20, strokeWidth = 1.6, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** 와인잔 — 브랜드/마피아 */
export const WineGlass = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4h10l-1 6a4 4 0 0 1-8 0L7 4Z" />
    <path d="M12 16v4" />
    <path d="M8.5 20h7" />
  </svg>
);

/** 달 — 밤 페이즈 */
export const Moon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />
  </svg>
);

/** 해 — 낮 페이즈 */
export const Sun = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/** 의사봉 — 투표 */
export const Gavel = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m14 4 6 6-3 3-6-6 3-3Z" />
    <path d="m11 7-7 7 3 3 7-7" />
    <path d="M5 21h8" />
  </svg>
);

/** 돋보기 — 조사(목격자) */
export const Search = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/** 방패 — 보호(수습반장) */
export const Shield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    <path d="m9.2 11.5 1.8 1.8 3.8-3.8" />
  </svg>
);

/** 깨진 병 — 제거(범인) */
export const Crosshair = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/** 사람들 — 참여자 */
export const Users = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
    <path d="M17 14.2a5.5 5.5 0 0 1 3.5 4.8" />
  </svg>
);

/** 가면 — 역할/정체 */
export const Mask = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5c5-1.5 11-1.5 16 0 0 7-3 12-8 14C7 17 4 12 4 5Z" />
    <path d="M9 10c.8.6 1.6.6 2.4 0M12.6 10c.8.6 1.6.6 2.4 0" />
  </svg>
);

/** 재생 — 시작 */
export const Play = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Copy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const Clock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const Sparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3c.6 4.2 1.8 5.4 6 6-4.2.6-5.4 1.8-6 6-.6-4.2-1.8-5.4-6-6 4.2-.6 5.4-1.8 6-6Z" />
  </svg>
);

/** 신문 — 아침 소식 */
export const Scroll = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M8 9h8M8 12.5h8M8 16h5" />
  </svg>
);

/** 음표 — 음악 */
export const Note = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

/** 책 — 이야기 */
export const Book = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H5V4Z" />
    <path d="M19 5v15" />
  </svg>
);

/** 나침반 — 혼자 탐험 */
export const Compass = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-2 4-4 2 2-4 4-2Z" />
  </svg>
);
