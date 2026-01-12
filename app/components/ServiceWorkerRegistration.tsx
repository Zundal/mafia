"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // 서비스 워커 등록
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // 업데이트 확인
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // 새 버전이 설치되었음을 알림
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // 주기적으로 업데이트 확인 (1시간마다)
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // 페이지 로드 시 업데이트 확인
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="glass border-cyan-500/30 bg-cyan-500/10 rounded-xl p-4 shadow-lg">
          <p className="text-cyan-400 font-semibold mb-2">새 버전이 사용 가능합니다</p>
          <button
            onClick={handleUpdate}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
          >
            업데이트 적용
          </button>
        </div>
      </div>
    );
  }

  return null;
}
