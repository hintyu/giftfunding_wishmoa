import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NaverProvider from 'next-auth/providers/naver';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

// 디버깅: 환경변수 로드 확인
console.log('=== NextAuth 환경변수 확인 ===');
console.log('NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID ? '설정됨 (길이: ' + process.env.NAVER_CLIENT_ID.length + ')' : '❌ 없음');
console.log('NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? '설정됨' : '❌ 없음');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '설정됨' : '❌ 없음');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '설정됨' : '❌ 없음');
console.log('==============================');

// Provider 배열 동적 생성 (환경변수가 있는 것만 추가)
const providers = [];

if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  providers.push(
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.response.id,
          name: profile.response.nickname || profile.response.name || profile.response.email?.split('@')[0] || '사용자',
          email: profile.response.email,
          image: profile.response.profile_image,
        };
      },
    })
  );
} else {
  console.warn('⚠️ Naver Provider 비활성화: 환경변수 없음');
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else {
  console.warn('⚠️ Google Provider 비활성화: 환경변수 없음');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      // 세션에 사용자 ID 추가
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  // pages 설정은 커스텀 로그인 페이지 구현 후 활성화
  // pages: {
  //   signIn: '/',
  //   error: '/',
  // },
  debug: process.env.NODE_ENV === 'development', // 개발 환경에서 디버그 로그 활성화
};

