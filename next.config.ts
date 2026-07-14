import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin wires up request locale config for the App Router.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
