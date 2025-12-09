import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "위시모아 - 선물펀딩프로젝트",
  description: "누구나 자신만의 선물 펀딩 페이지를 만들 수 있는 모바일 서비스",
  icons: {
    icon: [
      { url: '/image/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/image/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/image/favicon.ico' },
    ],
    apple: '/image/apple-touch-icon.png',
  },
  manifest: '/image/site.webmanifest',
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
