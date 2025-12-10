'use client';

import Image from 'next/image';
import tossQrGuide1 from '@/app/image/toss_qr_guide1.jpg';
import tossQrGuide2 from '@/app/image/toss_qr_guide2.jpg';

interface TossQrGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TossQrGuideModal({ isOpen, onClose }: TossQrGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold">토스 QR송금 발급 가이드</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          <p className="text-sm text-gray-600">
            토스 앱에서 QR송금 코드를 발급받아 업로드하면,
            <br />
            후원자가 <strong>&quot;토스로 바로 쏴줄게!&quot;</strong> 버튼을 사용할 수 있어요!
          </p>

          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                1
              </span>
              <h3 className="font-semibold">토스 앱에서 QR송금 발급하기</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8 mb-2">
              토스 앱 → 전체 메뉴 → &quot;QR 송금 발급하기&quot;
            </p>
            <div className="w-full max-w-[250px] mx-auto rounded-lg overflow-hidden shadow-md">
              <Image
                src={tossQrGuide1}
                alt="토스 QR 발급 가이드 1"
                width={250}
                height={0}
                className="w-full h-auto object-contain bg-gray-100"
              />
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                2
              </span>
              <h3 className="font-semibold">QR코드 저장하기</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8 mb-2">
              계좌를 선택하고 &quot;이미지 저장&quot; 버튼을 눌러 QR코드를 저장해주세요
            </p>
            <div className="w-full max-w-[250px] mx-auto rounded-lg overflow-hidden shadow-md">
              <Image
                src={tossQrGuide2}
                alt="토스 QR 발급 가이드 2"
                width={250}
                height={0}
                className="w-full h-auto object-contain bg-gray-100"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                3
              </span>
              <h3 className="font-semibold">QR코드 업로드하기</h3>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              저장한 QR코드 이미지를 위시모아에 업로드하면 끝!
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              💡 <strong>팁:</strong> QR코드가 없어도 계좌번호 복사 기능은 사용할 수 있어요!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            확인했어요!
          </button>
        </div>
      </div>
    </div>
  );
}

