// QR코드 디코딩 유틸리티
// 토스 QR송금 코드를 이미지에서 추출

import jsQR from 'jsqr';

/**
 * 이미지 파일에서 QR코드를 디코딩하여 텍스트 추출
 * @param imageFile 이미지 파일
 * @returns QR코드에서 추출한 텍스트 (supertoss://send?... 형식)
 */
export async function decodeQRFromImage(imageFile: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Canvas에 이미지 그리기
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // 이미지 데이터 추출
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // QR코드 디코딩
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode) {
          resolve(qrCode.data);
        } else {
          resolve(null);
        }
      };
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * 토스 QR 딥링크 유효성 검사
 * @param link QR코드에서 추출한 링크
 * @returns 유효한 토스 딥링크인지 여부
 */
export function isValidTossQrLink(link: string): boolean {
  return link.startsWith('supertoss://send?') && link.includes('accountNo=');
}

/**
 * 토스 QR 딥링크에서 금액을 변경한 새 링크 생성
 * @param baseLink 기본 토스 딥링크 (QR에서 추출한 것)
 * @param amount 변경할 금액
 * @returns 금액이 변경된 새 딥링크
 */
export function createTossLinkWithAmount(baseLink: string, amount: number): string {
  // amount 파라미터를 새 금액으로 교체
  const url = new URL(baseLink);
  url.searchParams.set('amount', amount.toString());
  return url.toString();
}

/**
 * 토스 딥링크에서 계좌 정보 추출
 * @param link 토스 딥링크
 * @returns { bank, accountNo } 또는 null
 */
export function extractAccountFromTossLink(link: string): { bank: string; accountNo: string } | null {
  try {
    const url = new URL(link);
    const bank = url.searchParams.get('bank');
    const accountNo = url.searchParams.get('accountNo');
    
    if (bank && accountNo) {
      return {
        bank: decodeURIComponent(bank),
        accountNo,
      };
    }
    return null;
  } catch {
    return null;
  }
}

