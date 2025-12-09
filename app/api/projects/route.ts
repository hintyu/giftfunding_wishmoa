import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { encrypt } from '@/lib/crypto';

// 프로젝트 목록 조회 (본인 것만)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        projectStatus: { not: 'deleted' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('프로젝트 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectTitle, projectSubtitle, accountBank, accountNumber, accountHolder, themeColor, tossQrLink } = body;

    // 유효성 검사
    if (!projectTitle?.trim()) {
      return NextResponse.json({ error: '펀딩 타이틀을 입력해주세요.' }, { status: 400 });
    }
    if (!accountBank?.trim()) {
      return NextResponse.json({ error: '은행을 선택해주세요.' }, { status: 400 });
    }
    if (!accountNumber?.trim()) {
      return NextResponse.json({ error: '계좌번호를 입력해주세요.' }, { status: 400 });
    }
    if (!accountHolder?.trim()) {
      return NextResponse.json({ error: '예금주를 입력해주세요.' }, { status: 400 });
    }

    // 짧은 프로젝트 ID 생성 (8자)
    const projectId = nanoid(8);

    // 계좌번호 암호화
    const encryptedAccountNumber = encrypt(accountNumber.trim());

    const project = await prisma.project.create({
      data: {
        projectId,
        userId: session.user.id,
        projectTitle: projectTitle.trim(),
        projectSubtitle: projectSubtitle?.trim() || '',
        accountBank: accountBank.trim(),
        accountNumber: encryptedAccountNumber,
        accountHolder: accountHolder.trim(),
        tossQrLink: tossQrLink || null,
        themeColor: themeColor || 'purple',
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}


