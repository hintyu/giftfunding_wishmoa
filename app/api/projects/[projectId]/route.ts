import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// 프로젝트 상세 조회 (공개)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);

    // 소유자인지 먼저 확인하여 숨긴 아이템 포함 여부 결정
    const isOwner = session?.user?.id ? await prisma.project.findFirst({
      where: { projectId, userId: session.user.id },
      select: { projectId: true },
    }) : null;

    const project = await prisma.project.findUnique({
      where: { projectId },
      include: {
        items: {
          where: {
            // 소유자: active, hidden, completed 모두 표시
            // 비소유자: active, completed만 표시
            itemStatus: { in: isOwner ? ['active', 'hidden', 'completed'] : ['active', 'completed'] },
          },
          orderBy: { itemOrder: 'asc' },
          include: {
            donations: {
              where: { 
                donationStatus: { in: ['pending', 'confirmed'] } // 확인대기중 + 확인된 후원 모두 포함
              },
              select: {
                donationId: true,
                donatorNm: true,
                donatorMessage: true,
                donationAmount: true,
                donationStatus: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project || project.projectStatus === 'deleted') {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 숨김 상태인 경우 소유자만 볼 수 있음
    if (project.projectStatus === 'hidden' && !isOwner) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 최종 소유자 여부 (project.userId로 확인)
    const isProjectOwner = session?.user?.id === project.userId;

    // 각 아이템의 후원 총액 계산 (pending + confirmed 모두 포함)
    const itemsWithTotal = project.items.map(item => ({
      ...item,
      totalDonation: item.donations.reduce((sum, d) => sum + d.donationAmount, 0),
      // 후원자 아이콘 표시를 위해 donations 정보 포함
      donations: item.donations.map(d => ({
        donationId: d.donationId,
        donatorNm: d.donatorNm,
        donatorMessage: d.donatorMessage,
        donationAmount: d.donationAmount,
        donationStatus: d.donationStatus,
      })),
    }));

    // 계좌번호 복호화 (후원 시 필요)
    const decryptedAccountNumber = decrypt(project.accountNumber);

    return NextResponse.json({
      ...project,
      accountNumber: decryptedAccountNumber,
      items: itemsWithTotal,
      isOwner: isProjectOwner,
    });
  } catch (error) {
    console.error('프로젝트 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 프로젝트 수정 (소유자만)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { projectTitle, projectSubtitle, accountBank, accountNumber, accountHolder, projectStatus, themeColor, tossQrLink, donationAmounts } = body;

    // 계좌번호 암호화 (새 값이 있을 때만)
    const encryptedAccountNumber = accountNumber ? encrypt(accountNumber.trim()) : undefined;

    const updatedProject = await prisma.project.update({
      where: { projectId },
      data: {
        ...(projectTitle && { projectTitle: projectTitle.trim() }),
        ...(projectSubtitle !== undefined && { projectSubtitle: projectSubtitle.trim() }),
        ...(accountBank && { accountBank: accountBank.trim() }),
        ...(encryptedAccountNumber && { accountNumber: encryptedAccountNumber }),
        ...(accountHolder && { accountHolder: accountHolder.trim() }),
        ...(tossQrLink !== undefined && { tossQrLink: tossQrLink || null }),
        ...(donationAmounts !== undefined && { donationAmounts }),
        ...(projectStatus && { projectStatus }),
        ...(themeColor && { themeColor }),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('프로젝트 수정 실패:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 프로젝트 삭제 (소유자만, 소프트 삭제)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    await prisma.project.update({
      where: { projectId },
      data: { projectStatus: 'deleted' },
    });

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다.' });
  } catch (error) {
    console.error('프로젝트 삭제 실패:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}


