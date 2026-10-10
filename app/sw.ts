import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  // ── Precache: app shell (JS/CSS chunks) + explicit entries from next.config ──
  precacheEntries: self.__SW_MANIFEST,

  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  // ── Offline fallback ─────────────────────────────────────────────────────────
  // When any navigation request fails (offline + never cached), show /offline
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },

  // ── Runtime caching ──────────────────────────────────────────────────────────
  runtimeCaching: [
    // 1. Pages: /homepage and all /auth/* routes
    //    Strategy: StaleWhileRevalidate
    //    → Serves the cached version instantly, revalidates in the background.
    //      Fast UX + the cache is always 1 request behind "latest".
    {
      matcher: ({ request, url }: { request: Request; url: URL }) =>
        request.mode === "navigate" &&
        (url.pathname === "/homepage" || url.pathname.startsWith("/auth/")),
      handler: new StaleWhileRevalidate({
        cacheName: "restivo-pages",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response.status === 0 || response.status === 200
                ? response
                : null,
          },
        ],
      }),
    },

    // 2. Images: /images/* and /VisualIdentity/*
    //    Strategy: CacheFirst
    //    → Large assets that rarely change. Serve from cache, skip the network.
    //      30-day TTL with a 60-item cap to avoid unbounded growth.
    {
      matcher: ({ request, url }: { request: Request; url: URL }) =>
        request.destination === "image" ||
        url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/VisualIdentity/"),
      handler: new CacheFirst({
        cacheName: "restivo-images",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response.status === 0 || response.status === 200
                ? response
                : null,
          },
        ],
      }),
    },

    // 3. API calls: /api/* (future-proofing)
    //    Strategy: NetworkFirst
    //    → Always try the network first (data must be fresh).
    //      Fall back to cache when offline. 10-second timeout.
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "restivo-api",
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response.status === 0 || response.status === 200
                ? response
                : null,
          },
        ],
      }),
    },

    // 4. Everything else (fonts, other static assets)
    //    Fall through to Serwist's curated defaults.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
