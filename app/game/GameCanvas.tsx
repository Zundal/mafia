"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─── 상수 ────────────────────────────────────────────────────────────────────
const MAP_W = 800;
const MAP_H = 600;
const PLAYER_R = 18;
const PLAYER_H_MESH = 26;
const MOVE_SPEED = 280;
const JOY_RADIUS = 40;

const PLAYER_COLORS_HEX = [
  0xef4444, // 빨강
  0x3b82f6, // 파랑
  0x22c55e, // 초록
  0xeab308, // 노랑
  0xa855f7, // 보라
  0xf97316, // 주황
];
const PLAYER_COLORS_CSS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"];

// 아파트 방 레이아웃
const ROOMS = [
  { name: "침실 1",  x1:   0, z1:   0, x2: 260, z2: 200, floor: 0x120810, wall: 0x1e1020 },
  { name: "욕실",    x1: 260, z1:   0, x2: 440, z2: 165, floor: 0x08121a, wall: 0x101e2e },
  { name: "침실 2",  x1: 440, z1:   0, x2: 800, z2: 200, floor: 0x140808, wall: 0x220e0e },
  { name: "주방",    x1:   0, z1: 200, x2: 210, z2: 450, floor: 0x0a1408, wall: 0x122010 },
  { name: "거실",    x1: 210, z1: 160, x2: 590, z2: 440, floor: 0x160c06, wall: 0x261408 },
  { name: "서재",    x1: 590, z1: 200, x2: 800, z2: 450, floor: 0x0e0814, wall: 0x160c22 },
  { name: "복도",    x1:   0, z1: 450, x2: 800, z2: 512, floor: 0x0e0a08, wall: 0x1c1410 },
  { name: "발코니",  x1:  80, z1: 512, x2: 720, z2: 600, floor: 0x080c10, wall: 0x101820 },
];

// 스폰 포인트 (거실 중앙)
const SPAWNS = [
  { x: 375, z: 285 }, { x: 420, z: 310 }, { x: 355, z: 315 },
  { x: 445, z: 280 }, { x: 395, z: 340 }, { x: 425, z: 265 },
];

// ─── 타입 ────────────────────────────────────────────────────────────────────
export interface PlayerData {
  id: string;
  name: string;
  colorIndex: number;
  isAlive: boolean;
}

interface Props {
  currentPlayerId: string | null;
  players: PlayerData[];
  nightMode: boolean;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function GameCanvas({ currentPlayerId, players, nightMode }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const labelContainerRef = useRef<HTMLDivElement | null>(null);
  const labelsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const myPosRef = useRef({ x: 400, z: 300 });
  const otherPosRef = useRef<Map<string, { x: number; z: number }>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef({ dx: 0, dz: 0 });
  const rafRef = useRef(0);
  const prevTimeRef = useRef(0);
  const tempVecRef = useRef(new THREE.Vector3());

  // 조이스틱 DOM
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyKnobRef = useRef<HTMLDivElement | null>(null);
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);

  // 스폰 위치 초기화
  useEffect(() => {
    if (!currentPlayerId) return;
    const idx = players.findIndex((p) => p.id === currentPlayerId);
    const sp = SPAWNS[Math.max(0, idx) % SPAWNS.length];
    myPosRef.current = { x: sp.x, z: sp.z };
  }, [currentPlayerId]); // eslint-disable-line

  // ─── Three.js 초기화 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const W = mount.clientWidth || window.innerWidth;
    const H = mount.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080504);
    scene.fog = new THREE.FogExp2(0x080504, nightMode ? 0.0018 : 0.0008);
    sceneRef.current = scene;

    // Camera (위에서 약간 기울인 뷰)
    const camera = new THREE.PerspectiveCamera(50, W / H, 1, 3000);
    camera.position.set(MAP_W / 2, 730, MAP_H + 170);
    camera.lookAt(MAP_W / 2, 0, MAP_H * 0.3);
    cameraRef.current = camera;

    // 조명
    const ambient = new THREE.AmbientLight(0xfff0dc, nightMode ? 0.12 : 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd4a0, nightMode ? 0.18 : 0.65);
    sun.position.set(MAP_W / 2, 500, -200);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    // 포인트 라이트 (분위기)
    const lights = [
      { x: 400, z: 300, c: 0xd4841a, i: nightMode ? 2.8 : 1.0, d: 380 },
      { x: 120, z: 320, c: 0x6688ff, i: nightMode ? 1.8 : 0.5, d: 250 },
      { x: 700, z: 320, c: 0xff8040, i: nightMode ? 1.8 : 0.5, d: 250 },
    ];
    lights.forEach(({ x, z, c, i, d }) => {
      const pl = new THREE.PointLight(c, i, d);
      pl.position.set(x, 75, z);
      scene.add(pl);
    });

    // 맵 구축
    buildMap(scene);

    // 플레이어 메시 생성
    players.forEach((p, idx) => {
      const sp = SPAWNS[idx % SPAWNS.length];
      const mesh = createPlayerMesh(p.colorIndex, nightMode);
      mesh.position.set(sp.x, PLAYER_H_MESH / 2, sp.z);
      scene.add(mesh);
      meshesRef.current.set(p.id, mesh);
    });

    // 이름 레이블 컨테이너
    const labelDiv = document.createElement("div");
    labelDiv.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
    mount.appendChild(labelDiv);
    labelContainerRef.current = labelDiv;

    players.forEach((p) => {
      const isMe = p.id === currentPlayerId;
      const label = document.createElement("div");
      const css = PLAYER_COLORS_CSS[p.colorIndex % PLAYER_COLORS_CSS.length];
      label.style.cssText = [
        "position:absolute",
        "transform:translate(-50%,-100%)",
        "font-size:11px",
        "font-weight:700",
        "padding:2px 8px",
        "border-radius:999px",
        "white-space:nowrap",
        `background:${css}22`,
        `border:1px solid ${css}88`,
        `color:${isMe ? "#fff" : css}`,
        "pointer-events:none",
        "line-height:1.6",
      ].join(";");
      label.textContent = isMe ? `${p.name} (나)` : p.name;
      labelDiv.appendChild(label);
      labelsRef.current.set(p.id, label);
    });

    // 리사이즈 핸들러
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      // Scene 정리
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(labelDiv)) mount.removeChild(labelDiv);
      meshesRef.current.clear();
      labelsRef.current.clear();
      rendererRef.current = null;
    };
  }, []); // eslint-disable-line

  // ─── 게임 루프 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((time - (prevTimeRef.current || time)) / 1000, 0.1);
      prevTimeRef.current = time;

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // 내 플레이어 이동
      if (currentPlayerId) {
        const keys = keysRef.current;
        const joy = joyRef.current;
        let dx = joy.dx;
        let dz = joy.dz;

        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
        if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dz -= 1;
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dz += 1;

        const mag = Math.sqrt(dx * dx + dz * dz);
        if (mag > 0.05) {
          const spd = MOVE_SPEED * dt;
          myPosRef.current.x = Math.max(15, Math.min(MAP_W - 15, myPosRef.current.x + (dx / mag) * spd));
          myPosRef.current.z = Math.max(15, Math.min(MAP_H - 15, myPosRef.current.z + (dz / mag) * spd));
        }

        const myMesh = meshesRef.current.get(currentPlayerId);
        if (myMesh) {
          myMesh.position.x = myPosRef.current.x;
          myMesh.position.z = myPosRef.current.z;
        }
      }

      // 다른 플레이어 보간
      otherPosRef.current.forEach((pos, id) => {
        const mesh = meshesRef.current.get(id);
        if (!mesh) return;
        mesh.position.x += (pos.x - mesh.position.x) * 0.2;
        mesh.position.z += (pos.z - mesh.position.z) * 0.2;
      });

      // 레이블 업데이트
      updateLabels();

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentPlayerId]); // eslint-disable-line

  // ─── 레이블 투영 ──────────────────────────────────────────────────────────
  const updateLabels = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;
    const cam = cameraRef.current;
    const W = rendererRef.current.domElement.clientWidth;
    const H = rendererRef.current.domElement.clientHeight;
    const tv = tempVecRef.current;

    labelsRef.current.forEach((label, id) => {
      const mesh = meshesRef.current.get(id);
      if (!mesh) return;
      tv.set(mesh.position.x, mesh.position.y + PLAYER_H_MESH + 14, mesh.position.z);
      tv.project(cam);
      label.style.left = `${(tv.x * 0.5 + 0.5) * W}px`;
      label.style.top = `${(-tv.y * 0.5 + 0.5) * H}px`;
      label.style.display = tv.z < 1 ? "block" : "none";
    });
  }, []);

  // ─── 키보드 ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
      keysRef.current.add(e.key);
    };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // ─── 위치 동기화 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentPlayerId) return;
    const push = setInterval(() => {
      const { x, z } = myPosRef.current;
      fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentPlayerId, x, y: z }),
      }).catch(() => {});
    }, 120);

    const pull = setInterval(async () => {
      try {
        const data: Record<string, { x: number; y: number }> = await fetch("/api/positions").then((r) => r.json());
        Object.entries(data).forEach(([id, pos]) => {
          if (id !== currentPlayerId) otherPosRef.current.set(id, { x: pos.x, z: pos.y });
        });
      } catch {}
    }, 200);

    return () => { clearInterval(push); clearInterval(pull); };
  }, [currentPlayerId]);

  // ─── 조이스틱 이벤트 ──────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    joyOriginRef.current = { x: t.clientX, y: t.clientY };
    joyRef.current = { dx: 0, dz: 0 };
    if (joyBaseRef.current) joyBaseRef.current.style.opacity = "0.95";
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joyOriginRef.current) return;
    const t = e.touches[0];
    let dx = t.clientX - joyOriginRef.current.x;
    let dy = t.clientY - joyOriginRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
    joyRef.current = { dx: dx / JOY_RADIUS, dz: dy / JOY_RADIUS };
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joyOriginRef.current = null;
    joyRef.current = { dx: 0, dz: 0 };
    if (joyKnobRef.current) joyKnobRef.current.style.transform = "translate(-50%, -50%)";
    if (joyBaseRef.current) joyBaseRef.current.style.opacity = "0.55";
  }, []);

  // ─── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div ref={mountRef} className="absolute inset-0 overflow-hidden">
      {/* 모바일 가상 조이스틱 */}
      <div
        className="absolute bottom-40 left-5 z-20 select-none"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={joyBaseRef}
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: "rgba(212,160,23,0.10)",
            border: "2px solid rgba(212,160,23,0.38)",
            opacity: 0.55,
          }}
        >
          <div
            ref={joyKnobRef}
            className="w-9 h-9 rounded-full absolute"
            style={{
              background: "rgba(212,160,23,0.55)",
              border: "2px solid rgba(212,160,23,0.9)",
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        </div>
        <p className="text-center text-[10px] text-stone-500 mt-1 select-none">이동</p>
      </div>

      {/* 데스크탑 힌트 */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-1.5 glass text-stone-400 text-xs px-3 py-1.5 rounded-lg">
        <span className="font-mono bg-stone-800 px-1 rounded text-[10px]">WASD</span>
        <span>/</span>
        <span className="font-mono bg-stone-800 px-1 rounded text-[10px]">←↑↓→</span>
        <span>이동</span>
      </div>
    </div>
  );
}

// ─── 맵 구축 함수 ─────────────────────────────────────────────────────────────
function buildMap(scene: THREE.Scene) {
  const WALL_H = 30;
  const WALL_T = 5;

  ROOMS.forEach((room) => {
    const w = room.x2 - room.x1;
    const d = room.z2 - room.z1;
    const cx = room.x1 + w / 2;
    const cz = room.z1 + d / 2;

    // 바닥
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w - WALL_T, 2, d - WALL_T),
      new THREE.MeshStandardMaterial({ color: room.floor, roughness: 0.93, metalness: 0.04 })
    );
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    scene.add(floor);

    // 벽 4면
    const wallMat = new THREE.MeshStandardMaterial({ color: room.wall, roughness: 0.85, metalness: 0.08 });
    [
      { x: cx,       z: room.z1, gw: w,      gd: WALL_T },
      { x: cx,       z: room.z2, gw: w,      gd: WALL_T },
      { x: room.x1,  z: cz,      gw: WALL_T, gd: d },
      { x: room.x2,  z: cz,      gw: WALL_T, gd: d },
    ].forEach(({ x, z, gw, gd }) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(gw, WALL_H, gd), wallMat);
      wall.position.set(x, WALL_H / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    });

    // 방 이름 레이블 (캔버스 텍스처)
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 64;
    const ctx = cv.getContext("2d")!;
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "rgba(255,215,130,0.5)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.name, 128, 32);
    const tex = new THREE.CanvasTexture(cv);
    const lbl = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.55, 18),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    lbl.rotation.x = -Math.PI / 2;
    lbl.position.set(cx, 2, cz);
    scene.add(lbl);
  });

  // 외벽 (바닥판 전체)
  const outerFloor = new THREE.Mesh(
    new THREE.BoxGeometry(MAP_W + 80, 1, MAP_H + 80),
    new THREE.MeshStandardMaterial({ color: 0x040302, roughness: 1 })
  );
  outerFloor.position.set(MAP_W / 2, -0.5, MAP_H / 2);
  scene.add(outerFloor);
}

// ─── 플레이어 메시 생성 ────────────────────────────────────────────────────────
function createPlayerMesh(colorIndex: number, nightMode: boolean): THREE.Mesh {
  const color = PLAYER_COLORS_HEX[colorIndex % PLAYER_COLORS_HEX.length];
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(PLAYER_R, PLAYER_R * 0.8, PLAYER_H_MESH, 18),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: nightMode ? 0.45 : 0.18,
      roughness: 0.38,
      metalness: 0.28,
    })
  );
  mesh.castShadow = true;
  return mesh;
}
