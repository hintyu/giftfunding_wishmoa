import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "위시모아 - 선물펀딩프로젝트",
  description: "선물펀딩프로젝트: 위시모아에서 진짜 큰 선물을 주고받아보세요!",
  openGraph: {
    title: "위시모아 - 선물펀딩프로젝트",
    description: "선물펀딩프로젝트: 위시모아에서 진짜 큰 선물을 주고받아보세요!",
    images: [
      {
        url: "/image/logo.png",
        width: 1200,
        height: 630,
        alt: "위시모아 로고",
      },
    ],
    type: "website",
    locale: "ko_KR",
    siteName: "위시모아",
  },
  twitter: {
    card: "summary_large_image",
    title: "위시모아 - 선물펀딩프로젝트",
    description: "선물펀딩프로젝트: 위시모아에서 진짜 큰 선물을 주고받아보세요!",
    images: ["/image/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-omyu">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
