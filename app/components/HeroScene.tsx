"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 랜딩 시그니처 씬 — 촛불 아래 천천히 도는 와인잔과 떠다니는 불씨.
 * 배경은 투명(alpha)이라 페이지 그라데이션 위에 얹힌다.
 * prefers-reduced-motion이면 회전·표류를 멈춘다.
 */
export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 3.7);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // ── 조명: 촛불(따뜻한 아래광) + 앰비언트 + 키/림 ────────────────
    scene.add(new THREE.AmbientLight(0x3a2a18, 2.0));
    const candle = new THREE.PointLight(0xffb866, 30, 18, 2);
    candle.position.set(0.5, -0.5, 1.8);
    scene.add(candle);
    const key = new THREE.DirectionalLight(0xffd9a0, 2.2);
    key.position.set(1.6, 2.2, 2.4);
    scene.add(key);
    const rim = new THREE.PointLight(0xe8b864, 8, 16, 2);
    rim.position.set(-2.2, 2.4, -1.2);
    scene.add(rim);

    // ── 와인잔 (LatheGeometry 프로파일) ────────────────────────────
    const glassGroup = new THREE.Group();
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.5, 0.0),
      new THREE.Vector2(0.52, 0.035),
      new THREE.Vector2(0.09, 0.08),
      new THREE.Vector2(0.06, 0.14),
      new THREE.Vector2(0.06, 0.66),
      new THREE.Vector2(0.1, 0.72),
      new THREE.Vector2(0.42, 0.98),
      new THREE.Vector2(0.56, 1.34),
      new THREE.Vector2(0.55, 1.78),
      new THREE.Vector2(0.49, 2.04),
      new THREE.Vector2(0.47, 2.12),
    ];
    const glassGeo = new THREE.LatheGeometry(profile, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x4a3526,
      roughness: 0.12,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      emissive: 0x1a1008,
      emissiveIntensity: 0.4,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glassGroup.add(glass);

    // 와인 액체 (잔 안쪽, 살짝 발광)
    const wineProfile: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.92),
      new THREE.Vector2(0.38, 1.06),
      new THREE.Vector2(0.52, 1.34),
      new THREE.Vector2(0.52, 1.5),
      new THREE.Vector2(0.0, 1.5),
    ];
    const wineGeo = new THREE.LatheGeometry(wineProfile, 64);
    const wineMat = new THREE.MeshStandardMaterial({
      color: 0x7a1420,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x5a0c16,
      emissiveIntensity: 1.3,
      side: THREE.DoubleSide,
    });
    const wine = new THREE.Mesh(wineGeo, wineMat);
    glassGroup.add(wine);

    glassGroup.position.y = -1.05;
    glassGroup.rotation.z = 0.03;
    scene.add(glassGroup);

    // ── 불씨/먼지 입자 ─────────────────────────────────────────────
    const COUNT = 90;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 1] = Math.random() * 3 - 0.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      speeds[i] = 0.06 + Math.random() * 0.12;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xe8b864,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // ── 애니메이션 루프 ────────────────────────────────────────────
    let raf = 0;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      if (!reduceMotion) {
        glassGroup.rotation.y += 0.0035;
        const pos = emberGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < COUNT; i++) {
          let y = pos.getY(i) + speeds[i] * 0.016;
          let x = pos.getX(i) + Math.sin(t * 0.5 + i) * 0.0009;
          if (y > 2.4) { y = -0.9; x = (Math.random() - 0.5) * 3.4; }
          pos.setY(i, y);
          pos.setX(i, x);
        }
        pos.needsUpdate = true;
        candle.intensity = 28 + Math.sin(t * 3.1) * 3 + Math.sin(t * 7.3) * 1.4; // 촛불 깜빡임
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── 리사이즈 ───────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      glassGeo.dispose();
      glassMat.dispose();
      wineGeo.dispose();
      wineMat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
