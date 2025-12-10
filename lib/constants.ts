// 프로젝트 상수 관리
// .cursorrule: No Hardcoding 준수

export const APP_NAME = '위시모아';
export const APP_DESCRIPTION = '선물펀딩프로젝트 위시모아 - 누구나 자신만의 선물 펀딩 페이지를 만들 수 있는 모바일 서비스';

// 후원 금액 옵션 (기본값)
export const DONATION_AMOUNTS = [15000, 20000, 25000] as const;
export const DEFAULT_DONATION_AMOUNTS_STRING = '15000,20000,25000';

// 후원 버튼 색상
export const DONATION_BUTTON_COLORS = ['#65D5E8', '#381DFC', '#DE1761'] as const;

// 후원자 아이콘 색상
export const ICON_COLORS = [
  '#FF6B9D', '#FFA07A', '#9B59B6', '#3498DB',
  '#F39C12', '#1ABC9C', '#E74C3C', '#95A5A6'
] as const;

// 은행 목록
export const BANKS = [
  '카카오뱅크', '토스뱅크', '국민은행', '신한은행', '하나은행',
  '우리은행', 'NH농협은행', 'IBK기업은행', 'SC제일은행', '새마을금고',
  '케이뱅크', '우체국', '수협은행', '광주은행', '전북은행',
  '경남은행', '부산은행', '대구은행', '제주은행', '신협',
] as const;

// Gemini API 설정 (gemini-1.5-flash: 빠르고 가벼운 모델)
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 프로젝트 상태
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
} as const;

// 선물 상태
export const ITEM_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  COMPLETED: 'completed',
  DELETED: 'deleted',
} as const;

// 후원 상태
export const DONATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELETED: 'deleted',
} as const;

// 프로젝트 테마 컬러
export const THEME_COLORS = {
  purple: {
    name: '🍇포도',
    gradient: 'from-[#381DFC] via-[#5B3FFF] to-[#7B5FFF]',
    primary: '#381DFC',
  },
  pink: {
    name: '🍑복숭아',
    gradient: 'from-[#FF6B9D] via-[#FF8FB3] to-[#FFB3C9]',
    primary: '#FF6B9D',
  },
  orange: {
    name: '🍊자몽',
    gradient: 'from-rose-400 via-orange-400 to-amber-400',
    primary: '#F97316',
  },
  green: {
    name: '🌱민트',
    gradient: 'from-[#2ECC71] via-[#52E3A4] to-[#7FE8C4]',
    primary: '#2ECC71',
  },
} as const;

export type ThemeColorKey = keyof typeof THEME_COLORS;

