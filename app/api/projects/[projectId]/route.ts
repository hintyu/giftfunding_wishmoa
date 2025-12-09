import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// 프로젝트 상세 조회 (공개)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);

    const project = await prisma.project.findUnique({
      where: { projectId },
      include: {
        items: {
          where: {
            itemStatus: { in: ['active', 'completed'] },
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
    if (project.projectStatus === 'hidden' && session?.user?.id !== project.userId) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 소유자 여부 추가
    const isOwner = session?.user?.id === project.userId;

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

    return NextResponse.json({
      ...project,
      items: itemsWithTotal,
      isOwner,
      // 계좌 정보는 모든 사용자에게 표시 (후원을 위해)
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
    const { projectTitle, projectSubtitle, accountBank, accountNumber, accountHolder, projectStatus, themeColor } = body;

    const updatedProject = await prisma.project.update({
      where: { projectId },
      data: {
        ...(projectTitle && { projectTitle: projectTitle.trim() }),
        ...(projectSubtitle !== undefined && { projectSubtitle: projectSubtitle.trim() }),
        ...(accountBank && { accountBank: accountBank.trim() }),
        ...(accountNumber && { accountNumber: accountNumber.trim() }),
        ...(accountHolder && { accountHolder: accountHolder.trim() }),
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


