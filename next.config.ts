import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Cache audio files for 1 year with revalidation
        source: "/(.*)\\.(mp3|wav|ogg|m4a|aac|flac)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache image files for 1 year with revalidation
        source: "/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache static assets for 1 year
        source: "/(.*)\\.js$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache CSS files for 1 year
        source: "/(.*)\\.css$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
