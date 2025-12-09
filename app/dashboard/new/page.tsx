'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { APP_NAME, THEME_COLORS, type ThemeColorKey } from "@/lib/constants";

// 은행 목록
const BANKS = [
  '카카오뱅크', '토스뱅크', '국민은행', '신한은행', '하나은행',
  '우리은행', 'NH농협은행', 'IBK기업은행', 'SC제일은행', '새마을금고',
  '케이뱅크', '우체국', '수협은행', '광주은행', '전북은행',
  '경남은행', '부산은행', '대구은행', '제주은행', '신협',
] as const;

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectSubtitle: '',
    accountBank: '',
    accountNumber: '',
    accountHolder: '',
    themeColor: 'purple' as ThemeColorKey,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 비로그인 사용자 리다이렉트
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // 로딩 중
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
        <div className="animate-pulse text-2xl text-gray-400">로딩 중...</div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!formData.projectTitle.trim()) {
      setError('펀딩 타이틀을 입력해주세요.');
      return;
    }
    if (!formData.accountBank) {
      setError('은행을 선택해주세요.');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('계좌번호를 입력해주세요.');
      return;
    }
    if (!formData.accountHolder.trim()) {
      setError('예금주를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 생성에 실패했습니다.');
      }

      const project = await response.json();
      // 생성된 프로젝트 페이지로 이동
      router.push(`/p/${project.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-lg flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-gray-800">새 펀딩 만들기</h1>
        </div>
      </header>

      {/* 폼 */}
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 펀딩 타이틀 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              펀딩 타이틀 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleChange}
              placeholder="예: 2024 생일선물 🎂"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.projectTitle.length}/50</p>
          </div>

          {/* 부제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부제목
            </label>
            <textarea
              name="projectSubtitle"
              value={formData.projectSubtitle}
              onChange={handleChange}
              placeholder="친구들에게 보여줄 한 마디를 적어주세요"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all resize-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.projectSubtitle.length}/200</p>
          </div>

          {/* 계좌 정보 */}
          <div className="bg-amber-50 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              🏦 계좌 정보
              <span className="text-xs font-normal text-gray-500">(후원금 입금용)</span>
            </h3>

            {/* 은행 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                은행 <span className="text-red-500">*</span>
              </label>
              <select
                name="accountBank"
                value={formData.accountBank}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all bg-white"
              >
                <option value="">은행을 선택하세요</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="- 없이 숫자만 입력"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                maxLength={20}
              />
            </div>

            {/* 예금주 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예금주 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                placeholder="예금주명"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                maxLength={20}
              />
            </div>
          </div>

          {/* 테마 컬러 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🎨 테마 컬러
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEME_COLORS) as ThemeColorKey[]).map((key) => {
                const theme = THEME_COLORS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, themeColor: key }))}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      formData.themeColor === key
                        ? 'border-gray-800 ring-2 ring-gray-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg bg-gradient-to-r ${theme.gradient} mb-2`} />
                    <p className="text-sm font-medium text-gray-700">{theme.name}</p>
                    {formData.themeColor === key && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-rose-400 to-amber-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '생성 중...' : '펀딩 시작하기 🎉'}
          </button>
        </form>
      </main>
    </div>
  );
}


