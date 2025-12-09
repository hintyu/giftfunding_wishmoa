'use client';

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import naverLoginButton from "./image/naver_login_button.png";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // 로딩 중일 때
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
        <div className="animate-pulse text-2xl text-gray-400">로딩 중...</div>
      </div>
    );
  }

  const handleNaverLogin = () => {
    signIn('naver', { callbackUrl: '/dashboard' });
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* 로고 & 타이틀 */}
        <div className="text-center mb-8 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 shadow-lg shadow-rose-200/50">
            <span className="text-3xl md:text-4xl">🎁</span>
          </div>
          <p className="text-sm md:text-base text-gray-500 mb-1 bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
            선물펀딩 프로젝트:
          </p>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent mb-3 md:mb-4">
            {APP_NAME}
          </h1>
          <p className="text-sm md:text-lg text-gray-600 max-w-md mx-auto leading-relaxed px-4">
            친구들에게 받고 싶은 선물을<br className="hidden md:block" />
            공유하고, 함께 펀딩받아보세요!
          </p>
        </div>

        {/* 기능 소개 카드 - 모바일에서 스크롤 가능하게 */}
        <div className="mb-8 md:mb-16">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
            <div className="flex md:grid gap-4 md:gap-6 min-w-max md:min-w-0">
              <FeatureCard
                emoji="📝"
                title="위시리스트 작성"
                description="받고 싶은 선물을 등록하고 나만의 펀딩 페이지를 만들어보세요"
              />
              <FeatureCard
                emoji="🔗"
                title="링크 공유"
                description="짧은 URL로 친구들에게 쉽게 공유할 수 있어요"
              />
              <FeatureCard
                emoji="💝"
                title="함께 펀딩"
                description="여러 친구들이 조금씩 모아 큰 선물을 완성해요"
              />
            </div>
          </div>
        </div>

        {/* 로그인 섹션 */}
        <div className="text-center">
          <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">
            지금 바로 시작해보세요!
          </p>
          
          <div className="flex flex-row items-center justify-center gap-3 md:gap-4 w-full max-w-[600px] mx-auto px-4">
            {/* 네이버 로그인 버튼 */}
            <button
              onClick={handleNaverLogin}
              className="flex-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer max-w-[300px]"
            >
              <Image
                src={naverLoginButton}
                alt="네이버 로그인"
                width={300}
                height={60}
                className="w-full h-[60px] object-contain rounded-lg shadow-md"
              />
            </button>

            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogleLogin}
              className="flex-1 h-[60px] max-w-[300px] flex items-center justify-center gap-2 md:gap-3 bg-white border-2 border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all hover:border-gray-400"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium text-sm md:text-base" style={{ fontFamily: "'Roboto', system-ui, -apple-system, sans-serif", letterSpacing: '0.01em' }}>Google로 로그인</span>
            </button>
          </div>
        </div>

        {/* 사용 방법 */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">이렇게 사용해요</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <Step number={1} text="로그인하기" />
            <Arrow />
            <Step number={2} text="위시리스트 작성" />
            <Arrow />
            <Step number={3} text="링크 공유" />
            <Arrow />
            <Step number={4} text="펀딩 받기 🎉" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© 2024 {APP_NAME}. Made with 💕</p>
      </footer>
    </div>
  );
}

// 기능 소개 카드 컴포넌트
function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[240px] md:min-w-0">
      <div className="text-3xl md:text-4xl mb-3 md:mb-4">{emoji}</div>
      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 md:mb-2">{title}</h3>
      <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// 단계 컴포넌트
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-white flex items-center justify-center font-bold mb-2">
        {number}
      </div>
      <span className="text-gray-600 text-sm">{text}</span>
    </div>
  );
}

// 화살표 컴포넌트
function Arrow() {
  return (
    <div className="hidden md:block text-gray-300 text-2xl">→</div>
  );
}
