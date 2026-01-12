/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA 설정을 위한 웹팩 설정
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
