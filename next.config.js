/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 정적 사이트 생성 비활성화
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typedRoutes: false,
  // TypeScript 오류 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
