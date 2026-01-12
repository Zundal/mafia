const CACHE_NAME = "mafia-game-v2";
const urlsToCache = [
  "/",
  "/game",
  "/story",
  "/join",
  "/manifest.json",
  "/_next/static/css/app/layout.css",
];

// Install event - 캐시 저장
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log("Cache addAll failed:", err);
      });
    })
  );
  // 즉시 활성화하여 새 서비스 워커가 바로 작동하도록
  self.skipWaiting();
});

// Activate event - 오래된 캐시 삭제
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 모든 클라이언트에 즉시 제어권 부여
  return self.clients.claim();
});

// Fetch event - 네트워크 우선, 실패 시 캐시 사용
self.addEventListener("fetch", (event) => {
  // GET 요청만 캐싱
  if (event.request.method !== "GET") {
    return;
  }

  // API 요청은 네트워크만 사용 (캐싱하지 않음)
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 응답이 유효한지 확인
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        // 같은 출처의 요청만 캐싱
        if (response.type === "basic" || response.type === "cors") {
          // 응답을 복제하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request).then((response) => {
          // 캐시에도 없으면 기본 페이지 반환
          if (!response && event.request.mode === "navigate") {
            return caches.match("/");
          }
          return response;
        });
      })
  );
});
