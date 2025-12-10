import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { GEMINI_API_URL } from '@/lib/constants';

// 클라이언트 IP 추출
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// Gemini API 호출
async function callGeminiAPI(info: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
  }

  const prompt = `너는 대한민국 전문 쇼핑MD이자 대한민국 트랜드세터야. 여럿이서 돈을 모아서 선물을 사준다는데 뭘 받아야할지 모르겠어. 참고로 선물 관련해서 주어진 정보를 기반으로 한국에서 인기있는 선물로 받을만한 센스있는 아이템을 추천해줘.: ${info}

!중요! 응답할 때는 반드시 20글자 이내로 구체적인 제품명 또는 품목명만을 응답으로 보낼 것`;

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // API 키 노출 방지를 위해 상세 에러는 서버 로그에만 기록
      console.error('Gemini API 응답 에러:', response.status, errorData);
      throw new Error(`Gemini API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }

    const recommendation = data.candidates[0].content.parts[0].text.trim();
    
    // 20글자 제한 확인 및 처리
    if (recommendation.length > 20) {
      return recommendation.substring(0, 20);
    }
    
    return recommendation;
  } catch (error) {
    // API 키가 포함된 URL이 로그에 노출되지 않도록 메시지만 기록
    console.error('Gemini API 호출 실패:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // API 키 존재 여부 먼저 확인
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

    // Rate Limiting 체크
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`gemini:${clientIP}`, RATE_LIMITS.GEMINI_API);

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `요청이 너무 많습니다. ${retryAfter}초 후에 다시 시도해주세요.` },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await request.json();
    const { info } = body;

    if (!info || typeof info !== 'string') {
      return NextResponse.json(
        { error: '정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const recommendation = await callGeminiAPI(info);

    return NextResponse.json(
      { recommendation },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    );
  } catch (error) {
    console.error('선물 추천 실패:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '추천을 받는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

