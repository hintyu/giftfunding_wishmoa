'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatNumber, formatDateTime } from '@/lib/utils';

interface Donation {
  donationId: string;
  donatorNm: string;
  donatorMessage?: string;
  donationAmount: number;
  donationStatus: string;
  createdAt: string;
  item: {
    itemId: string;
    itemTitle: string;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '확인됨', color: 'bg-green-100 text-green-700' },
  deleted: { label: '삭제됨', color: 'bg-red-100 text-red-700' },
};

export default function DonationsManagePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (authStatus === 'authenticated') {
      loadDonations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, projectId]);

  const loadDonations = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/donations`);
      if (!response.ok) {
        if (response.status === 403) {
          router.push(`/p/${projectId}`);
          return;
        }
        throw new Error('Failed to load');
      }
      const data = await response.json();
      setDonations(data);
    } catch (error) {
      console.error('후원 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (donationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationStatus: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');
      loadDonations();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (donationId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      loadDonations();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };


  const filteredDonations = donations.filter(d => {
    if (filter === 'all') return d.donationStatus !== 'deleted';
    return d.donationStatus === filter;
  });

  const totalAmount = filteredDonations
    .filter(d => d.donationStatus === 'confirmed')
    .reduce((sum, d) => sum + d.donationAmount, 0);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#381DFC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push(`/p/${projectId}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold">후원 관리</h1>
          </div>

          {/* 통계 */}
          <div className="bg-gradient-to-r from-[#381DFC] to-[#DE1761] rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">확인된 후원 총액</p>
            <p className="text-2xl font-bold">{formatNumber(totalAmount)}원</p>
          </div>

          {/* 필터 */}
          <div className="flex gap-2 mt-4">
            {(['all', 'pending', 'confirmed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#381DFC] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '전체' : f === 'pending' ? '대기' : '확인됨'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 후원 목록 */}
      <main className="max-w-2xl mx-auto py-6 px-4">
        {filteredDonations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💝</div>
            <p className="text-gray-600">
              {filter === 'all' ? '아직 후원이 없습니다.' : `${filter === 'pending' ? '대기 중인' : '확인된'} 후원이 없습니다.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDonations.map((donation) => (
              <div
                key={donation.donationId}
                className="bg-white rounded-xl shadow-sm border p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-gray-800">{donation.donatorNm}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${STATUS_LABELS[donation.donationStatus]?.color}`}>
                      {STATUS_LABELS[donation.donationStatus]?.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[#381DFC]">
                    {formatNumber(donation.donationAmount)}원
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-1">
                  🎁 {donation.item.itemTitle}
                </p>

                {donation.donatorMessage && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 my-2">
                    &quot;{donation.donatorMessage}&quot;
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">
                    {formatDateTime(donation.createdAt)}
                  </span>

                  <div className="flex gap-2">
                    {donation.donationStatus === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(donation.donationId, 'confirmed')}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded"
                      >
                        입금됐어요!
                      </button>
                    )}
                    {donation.donationStatus === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(donation.donationId, 'pending')}
                        className="text-xs text-yellow-600 hover:text-yellow-800 px-2 py-1 border border-yellow-200 rounded"
                      >
                        대기로
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(donation.donationId)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


