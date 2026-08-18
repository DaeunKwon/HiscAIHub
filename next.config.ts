import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용: .next/standalone 에 자체 실행 가능한 서버 번들 생성
  output: "standalone",
};

export default nextConfig;
