/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: { serverActions: { bodyLimit: "2mb" } }
};
export default nextConfig;
