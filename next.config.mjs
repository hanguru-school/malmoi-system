/** @type {import('next').NextConfig} */
const nextConfig = {
  // 운영 빌드는 app/*.js 기반만 사용한다.
  // (legacy src/app/*.tsx 라우트가 함께 스캔되는 것을 방지)
  pageExtensions: ["js", "jsx"],

  async headers() {
    return [
      {
        source: "/student/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
