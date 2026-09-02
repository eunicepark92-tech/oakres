import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryItem } from '../../types';
import { Tag, Plus, Edit3, Trash2, X, Check, AlertCircle, Info, Layers } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { packageCategories, packages, addPackageCategory, updatePackageCategory, deletePackageCategory, showToast } = useApp();

  // Add Form State
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Editing Item State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newLabel.trim()) {
      showToast('카테고리 연동 키와 표시 명칭을 모두 입력해주세요.', 'error');
      return;
    }
    addPackageCategory(newKey, newLabel, newDescription);
    setNewKey('');
    setNewLabel('');
    setNewDescription('');
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingKey(cat.key);
    setEditLabel(cat.label);
    setEditDescription(cat.description || '');
  };

  const handleSaveEdit = (catKey: string) => {
    if (!editLabel.trim()) {
      showToast('카테고리 표시 명칭을 입력해주세요.', 'error');
      return;
    }
    updatePackageCategory(catKey, editLabel, editDescription);
    setEditingKey(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-oak-green/20 text-oak-green border border-oak-green/40 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>상품 카테고리 등록 및 수정 관리</span>
                <span className="text-xs bg-oak-green text-white font-bold px-2 py-0.5 rounded-full">
                  총 {packageCategories.length}개
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                제휴 패키지와 유저 앱 필터 탭에 즉시 반영되는 상품 카테고리를 관리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Add Category Form */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-oak-green" />
              <span>신규 카테고리 추가</span>
            </h4>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    카테고리 연동 키 (대문자/영문) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    placeholder="예: PET_PACKAGE, DINING_SPECIAL"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    카테고리 표시 명칭 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="예: 펫 프리미엄 패키지"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">카테고리 설명 (선택)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="예: 반려동물 용품 세트 및 전용 객실 혜택 결합 상품"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-oak-green text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>카테고리 신규 추가</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-stone-600" />
                <span>등록된 카테고리 목록 ({packageCategories.length}개)</span>
              </span>
              <span className="text-[11px] text-stone-500 font-normal">
                연결된 패키지가 존재하는 카테고리는 안전을 위해 삭제할 수 없습니다.
              </span>
            </h4>

            <div className="space-y-2.5">
              {packageCategories.map((cat) => {
                const isEditing = editingKey === cat.key;
                const usedCount = packages.filter((p) => p.category === cat.key).length;

                return (
                  <div
                    key={cat.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            KEY: {cat.key}
                          </span>
                          <span className="text-[11px] font-bold text-amber-700">카테고리 수정 중</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="표시 명칭"
                            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="설명"
                            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 bg-stone-200 text-stone-700 font-bold text-xs rounded-lg hover:bg-stone-300 cursor-pointer"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.key)}
                            className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>저장</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {cat.key}
                            </span>
                            <span className="text-sm font-extrabold text-stone-900">
                              {cat.label}
                            </span>
                            <span className="text-[11px] font-bold text-oak-green bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              연동 상품 {usedCount}건
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-stone-500 truncate">{cat.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="카테고리 수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePackageCategory(cat.key)}
                            disabled={usedCount > 0}
                            className={`p-1.5 rounded-lg transition-colors ${
                              usedCount > 0
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={usedCount > 0 ? '이 카테고리를 사용하는 패키지가 있어 삭제 불가능' : '카테고리 삭제'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>수정된 카테고리 정보는 유저 패키지 목록의 필터 탭에 즉시 반영됩니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
