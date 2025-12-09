'use client';

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

interface Project {
  projectId: string;
  projectTitle: string;
  projectSubtitle: string;
  projectStatus: string;
  createdAt: string;
  _count: {
    items: number;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status, router]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('프로젝트 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 모든 선물과 후원 정보가 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadProjects();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
        <div className="animate-pulse text-2xl text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
            {APP_NAME}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user?.name || session.user?.email || '사용자'}님
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 새 프로젝트 만들기 버튼 */}
        <button
          onClick={() => router.push('/dashboard/new')}
          className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">+ 새 펀딩 만들기</h3>
              <p className="text-white/80 text-sm">위시리스트를 작성하고 친구들에게 공유해보세요</p>
            </div>
            <span className="text-3xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* 내 프로젝트 목록 */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">내 펀딩 목록</h3>
            {projects.length > 0 && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {isEditMode ? '완료' : '편집'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white/50 rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white/50 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
              <p className="text-gray-400">아직 만든 펀딩이 없어요</p>
              <p className="text-gray-400 text-sm mt-1">위 버튼을 눌러 첫 펀딩을 시작해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => !isEditMode && router.push(`/p/${project.projectId}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{project.projectTitle}</h4>
                        {project.projectSubtitle && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.projectSubtitle}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>🎁 {project._count.items}개 선물</span>
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      </div>

                      {isEditMode ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.projectId);
                          }}
                          className="text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 rounded-lg text-sm"
                        >
                          삭제
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xl">→</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
