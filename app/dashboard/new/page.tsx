'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { THEME_COLORS, BANKS, type ThemeColorKey } from "@/lib/constants";
import TossQrGuideModal from "@/components/TossQrGuideModal";
import { decodeQRFromImage, isValidTossQrLink, extractAccountFromTossLink } from "@/lib/qr-decoder";

export default function NewProjectPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectSubtitle: '',
    accountBank: '',
    accountNumber: '',
    accountHolder: '',
    tossQrLink: '',
    donationAmounts: ['15000', '20000', '25000'], // 후원 금액 배열
    themeColor: 'purple' as ThemeColorKey,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQrGuideOpen, setIsQrGuideOpen] = useState(false);
  const [isDecodingQr, setIsDecodingQr] = useState(false);
  const [qrStatus, setQrStatus] = useState<'none' | 'success' | 'error'>('none');

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

  // 토스 QR코드 업로드 처리
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingQr(true);
    setQrStatus('none');

    try {
      const qrData = await decodeQRFromImage(file);
      
      if (!qrData) {
        setQrStatus('error');
        setError('QR코드를 인식할 수 없습니다. 다시 시도해주세요.');
        return;
      }

      if (!isValidTossQrLink(qrData)) {
        setQrStatus('error');
        setError('토스 QR송금 코드가 아닙니다. 올바른 QR코드를 업로드해주세요.');
        return;
      }

      // QR 링크에서 계좌 정보 추출
      const accountInfo = extractAccountFromTossLink(qrData);
      
      setFormData(prev => ({
        ...prev,
        tossQrLink: qrData,
        // 계좌 정보도 자동 입력 (옵션)
        ...(accountInfo && {
          accountBank: accountInfo.bank,
          accountNumber: accountInfo.accountNo,
        }),
      }));
      
      setQrStatus('success');
      setError(null);
    } catch {
      setQrStatus('error');
      setError('QR코드 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDecodingQr(false);
    }
  };

  // 토스 QR 링크 삭제
  const handleRemoveQrLink = () => {
    setFormData(prev => ({ ...prev, tossQrLink: '' }));
    setQrStatus('none');
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

    // 후원 금액 유효성 검사
    const validAmounts = formData.donationAmounts
      .filter(a => a.trim() !== '' && !isNaN(Number(a)) && Number(a) > 0);
    
    if (validAmounts.length === 0) {
      setError('최소 1개 이상의 후원 금액을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          donationAmounts: validAmounts.join(','), // 쉼표로 구분된 문자열로 변환
        }),
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
              placeholder="예: 2025 생일선물 🎂"
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

          {/* 후원 금액 설정 */}
          <div className="bg-purple-50 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              💰 후원 금액 설정
            </h3>
            <p className="text-sm text-gray-600">
              후원자가 선택할 수 있는 금액 옵션 (최대 3개)
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    금액 {index + 1}
                  </label>
                  <input
                    type="number"
                    value={formData.donationAmounts[index] || ''}
                    onChange={(e) => {
                      const newAmounts = [...formData.donationAmounts];
                      newAmounts[index] = e.target.value;
                      setFormData(prev => ({ ...prev, donationAmounts: newAmounts }));
                    }}
                    placeholder="원"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              💡 빈 칸은 자동으로 제외됩니다. &quot;직접 입력&quot; 옵션은 항상 제공됩니다.
            </p>
          </div>

          {/* 토스 QR송금 설정 */}
          <div className="bg-blue-50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                📱 토스 간편송금
                <span className="text-xs font-normal text-gray-500">(선택)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQrGuideOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                발급 방법 보기
              </button>
            </div>

            <p className="text-sm text-gray-600">
              토스 QR코드를 업로드하면 후원자가 &quot;토스로 바로 쏴줄게!&quot; 버튼을 사용할 수 있어요
            </p>

            {/* QR 상태 표시 */}
            {qrStatus === 'success' && formData.tossQrLink && (
              <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">✓</span>
                  <span className="text-sm text-green-700 font-medium">토스 QR코드 등록 완료!</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveQrLink}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            )}

            {qrStatus !== 'success' && (
              <label className="block w-full px-4 py-4 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer text-center transition-colors">
                {isDecodingQr ? (
                  <span className="text-gray-500">QR코드 분석 중...</span>
                ) : (
                  <span className="text-gray-600">
                    📷 토스 QR코드 이미지 업로드
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                  disabled={isDecodingQr}
                />
              </label>
            )}
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

      {/* 토스 QR 가이드 모달 */}
      <TossQrGuideModal
        isOpen={isQrGuideOpen}
        onClose={() => setIsQrGuideOpen(false)}
      />
    </div>
  );
}


