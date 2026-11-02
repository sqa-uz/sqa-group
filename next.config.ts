import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Images are capped at 5MB in the storage layer. Allow multipart overhead
    // without leaving the default 1MB Server Action limit as a hidden failure.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // Legacy URLs remain renderable.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, // Home page service photos (Unsplash License).
    ],
  },
};

export default withNextIntl(nextConfig);
