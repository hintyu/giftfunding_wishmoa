// 간단한 In-Memory Rate Limiting
// 서버리스 환경에서는 Redis 등 외부 저장소 사용 권장

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// IP 또는 식별자 기반 요청 카운트 저장소
const rateLimitStore = new Map<string, RateLimitEntry>();

// 주기적으로 만료된 엔트리 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 1분마다 정리

interface RateLimitOptions {
  windowMs: number;  // 시간 윈도우 (밀리초)
  maxRequests: number;  // 최대 요청 수
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Rate Limiting 체크
 * @param identifier IP 주소 또는 사용자 식별자
 * @param options Rate Limit 옵션
 * @returns Rate Limit 결과
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // 기존 엔트리가 없거나 만료된 경우
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 요청 횟수 초과
  if (entry.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // 요청 카운트 증가
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// 사전 정의된 Rate Limit 설정
export const RATE_LIMITS = {
  // Gemini API: 1분에 10회 제한
  GEMINI_API: {
    windowMs: 60 * 1000,  // 1분
    maxRequests: 10,
  },
  // 일반 API: 1분에 60회 제한
  GENERAL_API: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
} as const;

