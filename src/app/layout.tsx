import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 공유 허브 · 한화투자증권",
  description: "한화투자증권 임직원 전용 AI 프롬프트·에이전트 공유 허브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
