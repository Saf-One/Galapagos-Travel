import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Resolve the project root (this file lives at <root>/next.config.ts).
// === CONFIGURABLE VALUES ===
// Pinned so Next.js does not mis-detect the workspace root when a parent
// directory (e.g. the user home) also contains a package.json/lockfile.
const projectRoot = dirname(fileURLToPath(import.meta.url));

// next-intl plugin wires up request locale config for the App Router.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep trace/output root inside the project so the build finds its manifests.
  outputFileTracingRoot: projectRoot,
  // Allow remote images from picsum.photos and unsplash (real placeholder images).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
