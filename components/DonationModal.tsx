'use client';

import { useState } from 'react';

interface Item {
  itemId: string;
  itemTitle: string;
  itemPrice: number;
}

interface AccountInfo {
  accountBank: string;
  accountNumber: string;
  accountHolder: string;
  tossQrLink?: string | null;
  donationAmounts?: string; // 쉼표로 구분된 후원 금액 (예: "15000,20000,25000")
}

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  amount: number | 'custom';
  accountInfo: AccountInfo;
  onDonationSuccess: () => void;
}

export default function DonationModal({ 
  isOpen, 
  onClose, 
  item, 
  amount, 
  accountInfo,
  onDonationSuccess 
}: DonationModalProps) {
  const [donatorName, setDonatorName] = useState('');
  const [message, setMessage] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomAmount = amount === 'custom';
  const finalAmount = isCustomAmount ? parseInt(customAmount) || 0 : (amount as number);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const accountString = `${accountInfo.accountNumber} ${accountInfo.accountBank} (${accountInfo.accountHolder})`;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountInfo.accountNumber)
      .then(() => alert('계좌번호가 복사되었습니다!'))
      .catch(() => alert('복사에 실패했습니다.'));
  };

  // 토스 QR 링크가 있는지 확인
  const hasTossQrLink = !!accountInfo.tossQrLink;

  // 토스 딥링크 생성 (QR 링크 기반)
  const getTossDeepLink = () => {
    if (!accountInfo.tossQrLink) return null;
    
    // QR 링크에서 amount만 변경
    try {
      const url = new URL(accountInfo.tossQrLink);
      url.searchParams.set('amount', finalAmount.toString());
      return url.toString();
    } catch {
      return null;
    }
  };

  const handleTossLink = () => {
    const deepLink = getTossDeepLink();
    if (deepLink) {
      window.location.href = deepLink;
    }
  };

  const handleSubmit = async (buttonType: 'copy' | 'toss') => {
    if (!donatorName.trim()) {
      alert('이름을 입력해주세요!');
      return;
    }

    if (isCustomAmount && (!customAmount || finalAmount <= 0)) {
      alert('선물 금액을 올바르게 입력해주세요!');
      return;
    }

    if (!item) {
      alert('상품 정보가 올바르지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.itemId,
          donatorNm: donatorName.trim(),
          donatorMessage: message.trim(),
          donationAmount: finalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('후원 처리 실패');
      }

      alert(`선물해주셔서 감사합니다! 잘 쓸게요💝`);

      if (buttonType === 'copy') {
        handleCopyAccount();
      } else if (buttonType === 'toss') {
        handleTossLink();
      }

      onDonationSuccess();
      onClose();
      
      // 폼 초기화
      setDonatorName('');
      setMessage('');
      setCustomAmount('');
    } catch (error) {
      console.error('후원 처리 실패:', error);
      alert('후원 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#381DFC] to-[#DE1761] text-white p-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold mb-1">{item.itemTitle}</h3>
              <p className="text-base">
                {isCustomAmount ? (
                  <span>선물합니다! 💝</span>
                ) : (
                  <span>{formatNumber(amount as number)}원 어치 선물합니다! 💝</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white text-2xl font-bold hover:text-gray-200"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4">
          {/* 직접입력 금액 */}
          {isCustomAmount && (
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                선물 금액 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="금액을 입력하세요"
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#381DFC]"
                disabled={isSubmitting}
              />
              {customAmount && (
                <p className="mt-1.5 text-sm text-[#381DFC] font-semibold">
                  {formatNumber(finalAmount)}원
                </p>
              )}
            </div>
          )}

          {/* 이름 입력 */}
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={donatorName}
              onChange={(e) => setDonatorName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-sky-500"
              disabled={isSubmitting}
            />
          </div>

          {/* 메시지 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              메시지 (선택)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="따뜻한 메시지를 남겨주세요"
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 계좌 정보 표시 */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 text-center">{accountString}</p>
          </div>

          {/* 버튼들 */}
          <div className={`grid gap-2 ${hasTossQrLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={() => handleSubmit('copy')}
              className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리중...' : '계좌번호 복사'}
            </button>
            {hasTossQrLink && (
              <button
                onClick={() => handleSubmit('toss')}
                className="bg-gradient-to-r from-[#381DFC] to-[#DE1761] hover:from-[#2810d0] hover:to-[#b91250] text-white font-semibold py-3 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리중...' : <>토스로 바로<br/>쏴줄게!</>}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            버튼을 누르면 선물 정보가 저장됩니다
          </p>
        </div>
      </div>
    </div>
  );
}


