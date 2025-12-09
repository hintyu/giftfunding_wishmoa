// 계좌번호 암호화/복호화 유틸리티
// .cursorrule: Security First 준수 - 민감한 정보 암호화

import crypto from 'crypto';

// 환경변수에서 암호화 키 로드 (없으면 NEXTAUTH_SECRET 사용)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// 키가 32바이트가 아니면 해시를 통해 32바이트로 변환
function getKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * 문자열 암호화
 * @param text 암호화할 텍스트
 * @returns 암호화된 문자열 (iv:authTag:encrypted 형식)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // iv:authTag:encrypted 형식으로 반환
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('암호화 실패:', error);
    return text; // 암호화 실패 시 원본 반환
  }
}

/**
 * 문자열 복호화
 * @param encryptedText 암호화된 텍스트 (iv:authTag:encrypted 형식)
 * @returns 복호화된 문자열
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  // 암호화 형식이 아닌 경우 (구 데이터) 그대로 반환
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return encryptedText; // 형식이 맞지 않으면 원본 반환
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    return encryptedText; // 복호화 실패 시 원본 반환 (구 데이터일 수 있음)
  }
}

/**
 * 이미 암호화되었는지 확인
 * @param text 확인할 텍스트
 * @returns 암호화 여부
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  // iv:authTag:encrypted 형식인지 확인
  const parts = text.split(':');
  if (parts.length !== 3) return false;
  
  // 각 부분이 16진수인지 확인
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

