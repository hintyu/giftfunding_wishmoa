'use client';

import { useState } from 'react';

interface GiftRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftRecommendModal({ isOpen, onClose }: GiftRecommendModalProps) {
  const [formData, setFormData] = useState({
    situation: '',
    gender: '',
    ageRange: '',
    priceRange: '',
    category: '',
  });
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecommend = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // 선택된 정보를 텍스트로 변환
      const infoText = [
        formData.situation && `상황: ${formData.situation}`,
        formData.gender && `성별: ${formData.gender}`,
        formData.ageRange && `연령대: ${formData.ageRange}`,
        formData.priceRange && `원하는 가격대: ${formData.priceRange}`,
        formData.category && `카테고리: ${formData.category}`,
      ].filter(Boolean).join(', ');

      const response = await fetch('/api/gift-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info: infoText }),
      });

      if (!response.ok) {
        throw new Error('추천을 받는데 실패했습니다.');
      }

      const data = await response.json();
      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">선물 추천받기 (BETA)</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 상황 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상황
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['생일', '집들이', '기념일', '그 외'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('situation', formData.situation === option ? '' : option)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.situation === option
                      ? 'border-[#381DFC] bg-[#381DFC]/10 text-[#381DFC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성별
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['남자', '여자'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('gender', formData.gender === option ? '' : option)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.gender === option
                      ? 'border-[#381DFC] bg-[#381DFC]/10 text-[#381DFC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연령대 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연령대
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['0~9', '10대', '20대', '30대', '40대', '50대', '60대이상'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('ageRange', formData.ageRange === option ? '' : option)}
                  className={`px-2 py-2 rounded-lg border-2 transition-all text-xs ${
                    formData.ageRange === option
                      ? 'border-[#381DFC] bg-[#381DFC]/10 text-[#381DFC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 가격대 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              원하는 가격대
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['5~10만원', '10만원대', '20~30만원대', '40~50만원대', '100만원 이상'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('priceRange', formData.priceRange === option ? '' : option)}
                  className={`px-2 py-2 rounded-lg border-2 transition-all text-xs ${
                    formData.priceRange === option
                      ? 'border-[#381DFC] bg-[#381DFC]/10 text-[#381DFC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['홈데코', '전자제품', '의류', '취미용품', '기타'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange('category', formData.category === option ? '' : option)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.category === option
                      ? 'border-[#381DFC] bg-[#381DFC]/10 text-[#381DFC]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 추천 결과 */}
          {recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">이건 어때요? :</p>
              <p className="text-base font-semibold text-gray-800">{recommendation}</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 추천받기 버튼 */}
          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#381DFC] to-[#DE1761] text-white font-semibold rounded-lg hover:from-[#2810d0] hover:to-[#b91250] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                추천 받는 중...
              </span>
            ) : (
              '추천받기'
            )}
          </button>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-500 text-center">
            (선택한 정보는 저장되지 않아요! 가서 살짝 물어보는 용도로만 쓸게요)
          </p>
        </div>
      </div>
    </div>
  );
}

