import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",

  // Precache these pages during SW installation so they're available
  // offline even before the user has navigated to them manually.
  additionalPrecacheEntries: [
    { url: "/homepage",     revision: "v1" },
    { url: "/auth/signin",  revision: "v1" },
    { url: "/auth/signup",  revision: "v1" },
    { url: "/offline",      revision: "v1" },
  ],

  // Keep SW disabled in development (avoids stale-cache confusion during dev)
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /**
   * These packages use Node.js-native APIs (native addons, pg, crypto) and
   * must NOT be bundled by webpack.  Next.js will keep them as require()
   * calls resolved at runtime instead.
   */
  serverExternalPackages: [
    "@prisma/orm-postgres",
    "@prisma/orm-family-sql",
    "pg",
    "bcryptjs",
  ],
};

export default withSerwist(nextConfig);
