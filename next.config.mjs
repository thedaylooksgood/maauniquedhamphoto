/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { unoptimized: true },
  experimental: { serverActions: { bodyLimit: "2mb" } }
};
export default nextConfig;
