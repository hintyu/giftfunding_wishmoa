'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Item {
  itemId: string;
  itemTitle: string;
  itemUrl: string;
  itemImage?: string;
  itemPrice: number;
  itemStatus: string;
  itemOrder: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-green-100 text-green-700' },
  hidden: { label: '숨김', color: 'bg-gray-100 text-gray-700' },
  completed: { label: '완료', color: 'bg-blue-100 text-blue-700' },
  deleted: { label: '삭제됨', color: 'bg-red-100 text-red-700' },
};

export default function ItemsManagePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동해야 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (authStatus === 'authenticated') {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, projectId]);

  const loadItems = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      
      if (!data.isOwner) {
        router.push(`/p/${projectId}`);
        return;
      }
      
      // itemOrder 기준으로 정렬
      const sortedItems = (data.items || []).sort((a: Item, b: Item) => a.itemOrder - b.itemOrder);
      setItems(sortedItems);
    } catch (error) {
      console.error('아이템 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.itemId === active.id);
      const newIndex = items.findIndex((item) => item.itemId === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // 순서 저장
      setIsSavingOrder(true);
      try {
        const response = await fetch('/api/items/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            items: newItems.map((item, index) => ({
              itemId: item.itemId,
              itemOrder: index,
            })),
          }),
        });

        if (!response.ok) throw new Error('Failed to save order');
      } catch (error) {
        console.error('순서 저장 실패:', error);
        // 실패 시 원래 순서로 복원
        loadItems();
      } finally {
        setIsSavingOrder(false);
      }
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemStatus: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');
      loadItems();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      loadItems();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/p/${projectId}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold">선물 관리</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#381DFC] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#2810d0] transition-colors"
          >
            + 추가
          </button>
        </div>
      </header>

      {/* 아이템 목록 */}
      <main className="max-w-2xl mx-auto py-6 px-4">
        {isSavingOrder && (
          <div className="fixed top-4 right-4 bg-[#381DFC] text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
            순서 저장 중...
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600 mb-4">아직 등록된 선물이 없습니다.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-[#381DFC] underline"
            >
              첫 선물 추가하기
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4 text-center">
              💡 드래그하여 순서를 변경할 수 있습니다
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.itemId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {items.map((item) => (
                    <SortableItemCard
                      key={item.itemId}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      formatNumber={formatNumber}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </main>

      {/* 추가/수정 모달 */}
      {(isAddModalOpen || editingItem) && (
        <ItemFormModal
          projectId={projectId}
          item={editingItem}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

// 드래그 가능한 아이템 카드
function SortableItemCard({
  item,
  onEdit,
  onStatusChange,
  onDelete,
  formatNumber,
}: {
  item: Item;
  onEdit: () => void;
  onStatusChange: (itemId: string, status: string) => void;
  onDelete: (itemId: string) => void;
  formatNumber: (num: number) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border p-4 ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-[#381DFC]' : ''
      }`}
    >
      <div className="flex gap-4">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        {/* 이미지 */}
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.itemImage ? (
            <Image
              src={item.itemImage}
              alt={item.itemTitle}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              🎁
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{item.itemTitle}</h3>
          {/* 상태 표시 - 제목 아래 */}
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${STATUS_LABELS[item.itemStatus]?.color || 'bg-gray-100'}`}>
            {STATUS_LABELS[item.itemStatus]?.label || item.itemStatus}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            목표: {formatNumber(item.itemPrice)}원
          </p>
          
          {/* 액션 버튼 - 아래쪽에 균등 배분 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onEdit}
              className="text-xs text-green-600 hover:text-green-800 px-3 py-2 border border-green-400 hover:border-green-600 rounded font-medium transition-colors bg-transparent"
            >
              수정
            </button>
            {item.itemStatus === 'active' && (
              <>
                <button
                  onClick={() => onStatusChange(item.itemId, 'hidden')}
                  className="text-xs text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-400 hover:border-gray-600 rounded font-medium transition-colors bg-transparent"
                >
                  숨기기
                </button>
                <button
                  onClick={() => onStatusChange(item.itemId, 'completed')}
                  className="text-xs text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-400 hover:border-blue-600 rounded font-medium transition-colors bg-transparent"
                >
                  완료
                </button>
              </>
            )}
            {item.itemStatus === 'hidden' && (
              <button
                onClick={() => onStatusChange(item.itemId, 'active')}
                className="text-xs text-green-600 hover:text-green-800 px-3 py-2 border border-green-400 hover:border-green-600 rounded font-medium transition-colors bg-transparent"
              >
                활성화
              </button>
            )}
            {item.itemStatus === 'completed' && (
              <button
                onClick={() => onStatusChange(item.itemId, 'active')}
                className="text-xs text-green-600 hover:text-green-800 px-3 py-2 border border-green-400 hover:border-green-600 rounded font-medium transition-colors bg-transparent"
              >
                활성화
              </button>
            )}
            <button
              onClick={() => onDelete(item.itemId)}
              className="text-xs text-red-600 hover:text-red-800 px-3 py-2 border border-red-400 hover:border-red-600 rounded font-medium transition-colors bg-transparent"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 선물 추가/수정 모달
function ItemFormModal({
  projectId,
  item,
  onClose,
  onSuccess,
}: {
  projectId: string;
  item: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    itemTitle: item?.itemTitle || '',
    itemUrl: item?.itemUrl || '',
    itemImage: item?.itemImage || '',
    itemPrice: item?.itemPrice || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '업로드 실패');
      }

      const data = await response.json();
      setUploadedImageUrl(data.url);
      setFormData(prev => ({ ...prev, itemImage: data.url }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemTitle.trim()) {
      alert('선물 이름을 입력해주세요.');
      return;
    }
    if (!formData.itemUrl.trim()) {
      alert('상품 링크를 입력해주세요.');
      return;
    }
    if (!formData.itemPrice || Number(formData.itemPrice) <= 0) {
      alert('목표 금액을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = item ? `/api/items/${item.itemId}` : '/api/items';
      const method = item ? 'PATCH' : 'POST';

      // 업로드된 이미지가 있으면 그것을 사용, 없으면 입력된 URL 사용
      const imageUrl = uploadedImageUrl || formData.itemImage || null;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          itemTitle: formData.itemTitle,
          itemUrl: formData.itemUrl,
          itemImage: imageUrl,
          itemPrice: Number(formData.itemPrice),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '저장 실패');
      }

      onSuccess();
    } catch (error) {
      console.error('저장 실패:', error);
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {item ? '선물 수정' : '새 선물 추가'}
          </h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              선물 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.itemTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, itemTitle: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#381DFC]"
              placeholder="예: 에어팟 프로"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상품 링크 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.itemUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, itemUrl: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#381DFC]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상품 이미지 <span className="text-gray-500 text-xs">(선택)</span>
            </label>
            
            {/* 이미지 미리보기 */}
            {(formData.itemImage || uploadedImageUrl) && (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.itemImage || uploadedImageUrl || ''}
                  alt="미리보기"
                  className="w-full h-48 object-contain border rounded-lg bg-gray-50"
                />
              </div>
            )}

            {/* 파일 업로드 */}
            <div className="mb-2">
              <label className="block w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-center text-sm text-gray-600">
                {isUploading ? '업로드 중...' : '📷 이미지 파일 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* 또는 직접 URL 입력 */}
            <div className="text-xs text-gray-500 mb-1 text-center">또는</div>
            <input
              type="url"
              value={formData.itemImage}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, itemImage: e.target.value }));
                setUploadedImageUrl(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#381DFC]"
              placeholder="이미지 URL 직접 입력"
            />
            <p className="text-xs text-gray-500 mt-1">
              이미지가 없으면 기본 아이콘이 표시됩니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목표 금액 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.itemPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, itemPrice: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#381DFC]"
              placeholder="예: 359000"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#381DFC] text-white font-semibold rounded-lg hover:bg-[#2810d0] disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : (item ? '수정하기' : '추가하기')}
          </button>
        </form>
      </div>
    </div>
  );
}


