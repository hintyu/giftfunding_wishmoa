// 프로젝트 상수 관리
// .cursorrule: No Hardcoding 준수

export const APP_NAME = '위시모아';
export const APP_DESCRIPTION = '선물펀딩프로젝트 위시모아 - 누구나 자신만의 선물 펀딩 페이지를 만들 수 있는 모바일 서비스';

// 후원 금액 옵션
export const DONATION_AMOUNTS = [15000, 20000, 25000] as const;

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
    name: '보라색',
    gradient: 'from-[#381DFC] via-[#5B3FFF] to-[#7B5FFF]',
    primary: '#381DFC',
  },
  pink: {
    name: '핑크',
    gradient: 'from-[#FF6B9D] via-[#FF8FB3] to-[#FFB3C9]',
    primary: '#FF6B9D',
  },
  orange: {
    name: '오렌지레드',
    gradient: 'from-rose-400 via-orange-400 to-amber-400',
    primary: '#F97316',
  },
  green: {
    name: '민트',
    gradient: 'from-[#2ECC71] via-[#52E3A4] to-[#7FE8C4]',
    primary: '#2ECC71',
  },
} as const;

export type ThemeColorKey = keyof typeof THEME_COLORS;

