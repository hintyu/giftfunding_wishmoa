'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ItemCard from '@/components/ItemCard';
import DonationModal from '@/components/DonationModal';
import TossQrGuideModal from '@/components/TossQrGuideModal';
import { APP_NAME, THEME_COLORS, type ThemeColorKey } from '@/lib/constants';

interface Donation {
  donationId: string;
  donatorNm: string;
  donatorMessage?: string;
  donationAmount: number;
}

interface Item {
  itemId: string;
  itemTitle: string;
  itemUrl: string;
  itemImage?: string;
  itemPrice: number;
  itemStatus: string;
  totalDonation: number;
  donations?: Donation[];
}

interface Project {
  projectId: string;
  projectTitle: string;
  projectSubtitle: string;
  accountBank: string;
  accountNumber: string;
  accountHolder: string;
  tossQrLink?: string | null;
  donationAmounts?: string; // 쉼표로 구분된 후원 금액
  themeColor: string;
  projectStatus: string;
  isOwner: boolean;
  items: Item[];
  user: {
    id: string;
    name: string;
  };
}

export default function PublicProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(0);
  
  // 메뉴 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 프로젝트 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('프로젝트를 찾을 수 없습니다.');
        }
        throw new Error('프로젝트를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('프로젝트 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDonateClick = (item: Item, amount: number | 'custom') => {
    setSelectedItem(item);
    setSelectedAmount(amount);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setSelectedAmount(0);
  };

  const handleDonationSuccess = () => {
    loadProject();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          url,
        });
      } catch {
        // 사용자가 공유 취소
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#381DFC] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-600 mb-4">{error || '프로젝트를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[#381DFC] underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 테마 색상에 맞는 배경색 (매우 은은하게)
  const themeBgColor = THEME_COLORS[project.themeColor as ThemeColorKey]?.primary || '#381DFC';
  const bgOpacity = '05'; // 매우 은은한 배경

  return (
    <div className="min-h-screen overflow-y-auto font-omyu" style={{ backgroundColor: `${themeBgColor}${bgOpacity}` }}>
      {/* 헤더 */}
      <header className={`bg-gradient-to-r ${THEME_COLORS[project.themeColor as ThemeColorKey]?.gradient || THEME_COLORS.purple.gradient} text-white py-8 px-4 shadow-2xl sticky top-0 z-40 relative`}>
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-2xl mx-auto relative">
          {/* 좌상단 로고 아이콘 */}
          <button
            onClick={handleLogoClick}
            className="absolute left-0 top-0 z-50 p-1 hover:opacity-80 transition-opacity flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg"
            title={session ? '대시보드로 이동' : '메인페이지로 이동'}
          >
            <Image
              src="/image/logo.png"
              alt="위시모아"
              width={32}
              height={32}
              className="rounded"
            />
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 소유자 메뉴 버튼 + 드롭다운 */}
          {project.isOwner && (
            <div className="absolute right-0 top-0 z-50">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden min-w-[180px]">
                  <button
                    onClick={() => { router.push(`/p/${projectId}/items`); setIsMenuOpen(false); }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    🎁 선물 관리
                  </button>
                  <button
                    onClick={() => { router.push(`/p/${projectId}/donations`); setIsMenuOpen(false); }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    💝 후원 관리
                  </button>
                  <button
                    onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    ⚙️ 프로젝트 관리
                  </button>
                  <hr />
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    🔗 링크 공유
                  </button>
                </div>
              )}
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-center mb-2" style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)',
            letterSpacing: '-0.5px'
          }}>
            {project.projectTitle}
          </h1>
          {project.projectSubtitle && (
            <p className="text-center text-base opacity-95" style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}>
              {project.projectSubtitle}
            </p>
          )}
        </div>
      </header>

      {/* 공유 버튼 (로그인한 비소유자용) */}
      {session && !project.isOwner && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <button
            onClick={handleShare}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            🔗 링크 공유
          </button>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-2xl mx-auto py-6">
        {project.items.length === 0 ? (
          <div className="mx-4 text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600">아직 등록된 선물이 없습니다.</p>
            {project.isOwner && (
              <button
                onClick={() => router.push(`/p/${projectId}/items`)}
                className="mt-4 text-[#381DFC] underline"
              >
                선물 추가하기
              </button>
            )}
          </div>
        ) : (
          <div>
            {project.items.map((item) => (
              <ItemCard
                key={item.itemId}
                item={item}
                onDonateClick={handleDonateClick}
                isOwner={project.isOwner}
                donationAmounts={project.donationAmounts}
              />
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-6 px-4 mt-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm">Made with 💙 by {APP_NAME}</p>
          <p className="text-xs text-gray-400 mt-2">
            선물해주셔서 감사합니다!
          </p>
        </div>
      </footer>

      {/* 후원 모달 */}
      <DonationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
        amount={selectedAmount}
        accountInfo={{
          accountBank: project.accountBank,
          accountNumber: project.accountNumber,
          accountHolder: project.accountHolder,
          tossQrLink: project.tossQrLink,
          donationAmounts: project.donationAmounts,
        }}
        onDonationSuccess={handleDonationSuccess}
      />

      {/* 메뉴 외부 클릭 시 닫기 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 프로젝트 수정 모달 */}
      {isEditModalOpen && (
        <ProjectEditModal
          project={project}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            loadProject();
          }}
        />
      )}
    </div>
  );
}

// 은행 목록
const BANKS = [
  '카카오뱅크', '토스뱅크', '국민은행', '신한은행', '하나은행',
  '우리은행', 'NH농협은행', 'IBK기업은행', 'SC제일은행', '새마을금고',
  '케이뱅크', '우체국', '수협은행', '광주은행', '전북은행',
  '경남은행', '부산은행', '대구은행', '제주은행', '신협',
] as const;

// 프로젝트 수정 모달
function ProjectEditModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // 후원 금액 파싱
  const parseDonationAmounts = (amountsString?: string): string[] => {
    if (!amountsString) return ['15000', '20000', '25000'];
    return amountsString.split(',').map(a => a.trim()).filter(a => a !== '');
  };

  const [formData, setFormData] = useState({
    projectTitle: project.projectTitle,
    projectSubtitle: project.projectSubtitle || '',
    accountBank: project.accountBank,
    accountNumber: project.accountNumber,
    accountHolder: project.accountHolder,
    tossQrLink: project.tossQrLink || '',
    donationAmounts: parseDonationAmounts(project.donationAmounts),
    themeColor: (project.themeColor || 'purple') as ThemeColorKey,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQrGuideOpen, setIsQrGuideOpen] = useState(false);
  const [isDecodingQr, setIsDecodingQr] = useState(false);
  const [qrStatus, setQrStatus] = useState<'none' | 'success' | 'error'>(project.tossQrLink ? 'success' : 'none');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const { decodeQRFromImage, isValidTossQrLink, extractAccountFromTossLink } = await import('@/lib/qr-decoder');
      const qrData = await decodeQRFromImage(file);
      
      if (!qrData) {
        setQrStatus('error');
        setError('QR코드를 인식할 수 없습니다.');
        return;
      }

      if (!isValidTossQrLink(qrData)) {
        setQrStatus('error');
        setError('토스 QR송금 코드가 아닙니다.');
        return;
      }

      const accountInfo = extractAccountFromTossLink(qrData);
      
      setFormData(prev => ({
        ...prev,
        tossQrLink: qrData,
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

  const handleRemoveQrLink = () => {
    setFormData(prev => ({ ...prev, tossQrLink: '' }));
    setQrStatus('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const response = await fetch(`/api/projects/${project.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          donationAmounts: formData.donationAmounts?.join(',') || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      setSuccessMessage('변경 완료되었습니다');
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">프로젝트 관리</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 로딩 오버레이 */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-2xl">
              <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#381DFC]"></div>
                <p className="text-sm text-gray-600">저장 중...</p>
              </div>
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#381DFC] focus:ring-2 focus:ring-[#381DFC]/20 outline-none transition-all"
              maxLength={50}
            />
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
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#381DFC] focus:ring-2 focus:ring-[#381DFC]/20 outline-none transition-all resize-none"
              maxLength={200}
            />
          </div>

          {/* 계좌 정보 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm">🏦 계좌 정보</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행 <span className="text-red-500">*</span>
              </label>
              <select
                name="accountBank"
                value={formData.accountBank}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#381DFC] outline-none transition-all bg-white"
              >
                <option value="">은행 선택</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#381DFC] outline-none transition-all"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예금주 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#381DFC] outline-none transition-all"
                maxLength={20}
              />
            </div>
          </div>

          {/* 후원 금액 설정 */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm">💰 후원 금액 설정</h3>
            <p className="text-xs text-gray-600">후원자가 선택할 수 있는 금액 옵션 (최대 3개)</p>
            <div className="grid grid-cols-3 gap-2">
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
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-100 outline-none transition-all text-sm"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 토스 QR송금 설정 */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 text-sm">📱 토스 간편송금</h3>
              <button
                type="button"
                onClick={() => setIsQrGuideOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                발급 방법
              </button>
            </div>

            {qrStatus === 'success' && formData.tossQrLink && (
              <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg p-2">
                <span className="text-xs text-green-700 font-medium">✓ 토스 QR 등록됨</span>
                <button type="button" onClick={handleRemoveQrLink} className="text-xs text-red-600">삭제</button>
              </div>
            )}

            {qrStatus !== 'success' && (
              <label className="block w-full px-3 py-3 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-center text-sm">
                {isDecodingQr ? '분석 중...' : '📷 토스 QR코드 업로드'}
                <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={isDecodingQr} />
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#381DFC] text-white font-semibold rounded-xl hover:bg-[#2810d0] transition-all disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>

      {/* 토스 QR 가이드 모달 */}
      {isQrGuideOpen && (
        <TossQrGuideModal isOpen={isQrGuideOpen} onClose={() => setIsQrGuideOpen(false)} />
      )}
    </div>
  );
}

