'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DONATION_AMOUNTS, ICON_COLORS, DONATION_BUTTON_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

// 후원 금액 파싱 함수
const parseDonationAmounts = (amountsString?: string): number[] => {
  if (!amountsString) return [...DONATION_AMOUNTS];
  
  const amounts = amountsString
    .split(',')
    .map(a => parseInt(a.trim()))
    .filter(a => !isNaN(a) && a > 0);
  
  return amounts.length > 0 ? amounts : [...DONATION_AMOUNTS];
};

interface Donation {
  donationId: string;
  donatorNm: string;
  donatorMessage?: string;
  donationAmount: number;
  donationStatus?: string; // pending, confirmed
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

interface ItemCardProps {
  item: Item;
  onDonateClick: (item: Item, amount: number | 'custom') => void;
  isOwner?: boolean; // 프로젝트 소유자 여부
  donationAmounts?: string; // 쉼표로 구분된 후원 금액 (예: "15000,20000,25000")
}

export default function ItemCard({ item, onDonateClick, isOwner = false, donationAmounts }: ItemCardProps) {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [bubbleColor, setBubbleColor] = useState({ color: '', lightColor: '' });
  const [fadeTimer, setFadeTimer] = useState<NodeJS.Timeout | null>(null);
  const [closeTimer, setCloseTimer] = useState<NodeJS.Timeout | null>(null);

  const currAmt = item.totalDonation || 0;
  const progressPercentage = item.itemPrice > 0 
    ? Math.min((currAmt / item.itemPrice) * 100, 100) 
    : 0;
  const isCompleted = item.itemStatus === 'completed' || progressPercentage >= 100;

  // 색상을 밝게 변환
  const lightenColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const newR = Math.round(r * 0.15 + 255 * 0.85);
    const newG = Math.round(g * 0.15 + 255 * 0.85);
    const newB = Math.round(b * 0.15 + 255 * 0.85);
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const handleIconClick = (donation: Donation, index: number) => {
    // 기존 타이머 클리어
    if (fadeTimer) clearTimeout(fadeTimer);
    if (closeTimer) clearTimeout(closeTimer);

    const color = ICON_COLORS[index % ICON_COLORS.length];
    setBubbleColor({ color, lightColor: lightenColor(color) });
    setSelectedDonation(donation);
    setIsMessageFading(false);

    // 5초 후 자동 닫기
    const fade = setTimeout(() => setIsMessageFading(true), 4500);
    const close = setTimeout(() => {
      setSelectedDonation(null);
      setIsMessageFading(false);
    }, 5000);
    
    setFadeTimer(fade);
    setCloseTimer(close);
  };

  const handleCloseModal = () => {
    if (fadeTimer) clearTimeout(fadeTimer);
    if (closeTimer) clearTimeout(closeTimer);
    setSelectedDonation(null);
    setIsMessageFading(false);
  };

  // 임시 후원자 데이터 (API 연동 전)
  const donations = item.donations || [];

  // 숨김 아이템 처리: 주인은 반투명, 비주인은 숨김
  const isHidden = item.itemStatus === 'hidden';
  if (isHidden && !isOwner) {
    return null; // 비소유자는 숨김 아이템을 보지 못함
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden mb-6 mx-4 relative ${isHidden ? 'opacity-50' : ''}`}>
      {/* 상품 이미지/링크 썸네일 */}
      <div className="p-4 bg-gray-50">
        <a 
          href={item.itemUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="block group"
        >
          {item.itemImage ? (
            <div className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-square">
              <Image 
                src={item.itemImage} 
                alt={item.itemTitle}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-gray-800 font-semibold text-sm">
                  상품 링크 보기
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E6A5BD] to-[#DE1761]" />
              <div className="relative text-center text-white z-10">
                <div className="text-6xl mb-2">🎁</div>
                <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                  상품 링크 보기
                </div>
              </div>
            </div>
          )}
        </a>
      </div>

      {/* 상품 정보 */}
      <div className="p-5">
        {/* 상품명 */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">{item.itemTitle}</h2>

        {/* 목표액 정보와 후원자 아이콘 */}
        <div className="flex gap-4 mb-4">
          {/* 왼쪽: 목표액 정보 */}
          <div className="w-[60%] flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold text-[#381DFC]">
                {formatNumber(currAmt)}
              </span>
              <span className="text-sm text-gray-500">
                / {formatNumber(item.itemPrice)} 원
              </span>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#381DFC] to-[#DE1761] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* 오른쪽: 후원자 아이콘들 */}
          <div className="w-[40%] flex items-center">
            <div className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 bg-white shadow-inner overflow-x-auto scrollbar-hide">
              {donations.length > 0 ? (
                <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                  {donations.map((donation, index) => {
                    const bgColor = ICON_COLORS[index % ICON_COLORS.length];
                    const isPending = donation.donationStatus === 'pending';
                    return (
                      <button
                        key={donation.donationId}
                        onClick={() => handleIconClick(donation, index)}
                        className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-white font-bold shadow-md hover:scale-110 transition-all cursor-pointer flex-shrink-0"
                        style={{ 
                          backgroundColor: bgColor,
                          fontSize: '11px',
                          letterSpacing: '-0.5px',
                          opacity: isPending ? 0.5 : 1,
                        }}
                        title={`${donation.donatorNm}${isPending ? ' (대기중)' : ''}`}
                      >
                        {donation.donatorNm.substring(0, 2)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[40px]">
                  <span className="text-sm text-gray-500 text-center">첫 후원자가 되어보세요!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 후원자 메시지 모달 */}
        {selectedDonation && (
          <div 
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isMessageFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={handleCloseModal}
          >
            <div 
              className="max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: bubbleColor.lightColor,
                border: `4px solid ${bubbleColor.color}`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="px-6 py-4 flex items-center justify-between"
                style={{ backgroundColor: bubbleColor.color }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg"
                    style={{ 
                      backgroundColor: bubbleColor.color,
                      border: '3px solid white',
                      fontSize: '13px',
                    }}
                  >
                    {selectedDonation.donatorNm.substring(0, 2)}
                  </div>
                  <p className="font-bold text-xl text-white">
                    {selectedDonation.donatorNm}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="px-6 py-5">
                {selectedDonation.donatorMessage ? (
                  <p className="text-base leading-relaxed text-gray-800">
                    &quot;{selectedDonation.donatorMessage}&quot;
                  </p>
                ) : (
                  <p className="text-base leading-relaxed text-gray-600 text-center">
                    후원해주셔서 감사합니다! 💝
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 후원하기 버튼들 또는 펀딩 완료 버튼 */}
        {isCompleted ? (
          <div className="mt-4">
            <button
              disabled
              className="w-full bg-gradient-to-r from-[#381DFC] to-[#DE1761] text-white font-semibold py-3 px-4 rounded-lg text-base shadow-md cursor-default"
            >
              🎉 펀딩 완료! 감사합니다!
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-4">
            {parseDonationAmounts(donationAmounts).map((amount, index) => (
              <button
                key={amount}
                onClick={() => onDonateClick(item, amount)}
                className="flex-1 text-white font-semibold py-2.5 px-2 rounded-lg transition-colors text-sm hover:opacity-80"
                style={{ backgroundColor: DONATION_BUTTON_COLORS[index % DONATION_BUTTON_COLORS.length] }}
              >
                {formatNumber(amount)}
              </button>
            ))}
            <button
              onClick={() => onDonateClick(item, 'custom')}
              className="flex-1 bg-[#E6A5BD] hover:opacity-80 text-white font-semibold py-2.5 px-1 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              직접 입력
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


