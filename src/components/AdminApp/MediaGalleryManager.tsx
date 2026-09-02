import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Plus,
  Tag,
  Search,
  AlertTriangle,
  Edit3,
  GripVertical,
  Save,
  Move,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface MediaGalleryManagerProps {
  onSelectImage?: (url: string) => void;
}

export const MediaGalleryManager: React.FC<MediaGalleryManagerProps> = ({ onSelectImage }) => {
  const {
    mediaAssets,
    addMediaAsset,
    updateMediaAsset,
    reorderMediaAssets,
    deleteMediaAsset,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('객실');
  const [url, setUrl] = useState('');
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // Title edit modal state
  const [editingAsset, setEditingAsset] = useState<{ id: string; title: string; category: string } | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const CATEGORIES = ['전체', '객실', '패키지', '부대시설', '기타'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('이미지 최적화 압축 처리 중...', 'info');
      const compressedDataUrl = await compressImageFile(file, 1600, 1200, 0.82);
      setUrl(compressedDataUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      showToast('이미지 최적화 및 로드 성공 (최대 10MB 자동압축 지원)', 'success');
    } catch (err: any) {
      alert(err.message || '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('이미지를 선택하거나 URL을 입력해주세요.');
      return;
    }

    addMediaAsset({
      title: title.trim() || '미디어 이미지',
      url: url.trim(),
      category,
    });

    // Reset
    setTitle('');
    setUrl('');
    setIsUploadModalOpen(false);
  };

  const handleSaveTitleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    updateMediaAsset(editingAsset.id, {
      title: editingAsset.title.trim() || '미디어 이미지',
      category: editingAsset.category,
    });
    setEditingAsset(null);
  };

  const handleCopyUrl = (assetId: string, assetUrl: string) => {
    navigator.clipboard.writeText(assetUrl);
    setCopiedId(assetId);
    showToast('이미지 URL이 클립보드에 복사되었습니다.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = mediaAssets.filter((asset) => {
    const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedFiltered = [...filteredAssets];
    const [draggedItem] = updatedFiltered.splice(draggedIndex, 1);
    updatedFiltered.splice(targetIndex, 0, draggedItem);

    if (selectedCategory === '전체' && !searchTerm) {
      reorderMediaAssets(updatedFiltered);
    } else {
      // Update position in main list preserving other non-filtered items
      const fullList = [...mediaAssets];
      const indices = filteredAssets.map((f) => fullList.findIndex((m) => m.id === f.id));
      indices.forEach((pos, i) => {
        fullList[pos] = updatedFiltered[i];
      });
      reorderMediaAssets(fullList);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Intro */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ImageIcon className="w-4 h-4" />
            <span>중앙 이미지 라이브러리 (Media Asset Vault)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">리조트 자산 이미지 관리</h2>
          <p className="text-stone-300 text-xs mt-1 max-w-2xl">
            객실 마스터, 패키지 상품, 부대시설 등 리조트 웹사이트 전반에 사용될 고화질 이미지 보관함입니다. Drag & Drop으로 순서를 조정하거나 제목을 직접 수정할 수 있습니다.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setUrl('');
            setIsUploadModalOpen(true);
          }}
          className="px-5 py-3 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>신규 이미지 업로드</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="이미지명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green"
          />
        </div>
      </div>

      {/* Guide Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 px-4 text-xs font-semibold text-amber-900 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-amber-700 shrink-0" />
          <span>💡 <strong>순서 변경 & 제목 수정:</strong> 이미지 카드를 <strong>드래그앤드롭</strong>하여 표시 순서를 조절할 수 있습니다. 제목 옆 ✏️ 버튼을 눌러 사진 제목을 언제든지 수정하세요.</span>
        </div>
      </div>

      {/* Media Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-12 text-center text-stone-500 space-y-2">
          <ImageIcon className="w-12 h-12 mx-auto text-stone-300" />
          <p className="font-bold text-sm text-stone-700">등록된 이미지가 없습니다.</p>
          <p className="text-xs">PC에서 신규 사진 파일을 업로드하거나 URL을 등록해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between group overflow-hidden ${
                draggedIndex === index
                  ? 'opacity-40 border-dashed border-oak-green scale-95'
                  : dragOverIndex === index
                  ? 'border-2 border-amber-500 shadow-xl ring-2 ring-amber-400/30 scale-[1.02]'
                  : 'border-stone-200 shadow-sm hover:border-oak-green hover:shadow-md'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-stone-100 overflow-hidden cursor-grab active:cursor-grabbing">
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Drag Handle & Category Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                  <span className="bg-stone-900/80 backdrop-blur-md text-stone-300 p-1 rounded-md cursor-grab active:cursor-grabbing hover:text-white" title="드래그하여 순서 변경">
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                  <span className="bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {asset.category}
                  </span>
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {onSelectImage && (
                    <button
                      onClick={() => onSelectImage(asset.url)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      이 이미지 선택
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                    className="p-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-xl font-bold text-xs shadow cursor-pointer flex items-center gap-1"
                    title="URL 복사"
                  >
                    {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Info & Footer */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <h4
                    onClick={() => setEditingAsset({ id: asset.id, title: asset.title, category: asset.category || '객실' })}
                    className="font-bold text-xs text-stone-900 truncate hover:text-oak-green cursor-pointer flex-1"
                    title={`${asset.title} (클릭하여 제목 수정)`}
                  >
                    {asset.title}
                  </h4>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingAsset({ id: asset.id, title: asset.title, category: asset.category || '객실' })}
                      className="p-1 text-stone-400 hover:text-oak-green hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      title="제목/카테고리 수정"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAssetId(asset.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="이미지 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-stone-300" />
                    <span>순서 {index + 1}</span>
                  </span>
                  <span>{asset.uploadedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TITLE EDIT MODAL */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-oak-green" />
                <span>이미지 제목 및 카테고리 수정</span>
              </h3>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTitleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  이미지 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingAsset.title}
                  onChange={(e) => setEditingAsset({ ...editingAsset, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green"
                  placeholder="제목 입력..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">카테고리</label>
                <select
                  value={editingAsset.category}
                  onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  <option value="객실">객실 (Room Types)</option>
                  <option value="패키지">패키지 (Packages)</option>
                  <option value="부대시설">부대시설 (Facilities)</option>
                  <option value="기타">기타 (Others)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-oak-green" />
                <span>라이브러리에 신규 이미지 추가</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  이미지 제목/설명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 스위트 로얄 거실 전경"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  <option value="객실">객실 (Room Types)</option>
                  <option value="패키지">패키지 (Packages)</option>
                  <option value="부대시설">부대시설 (Facilities)</option>
                  <option value="기타">기타 (Others)</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50 text-center space-y-3">
                {url ? (
                  <div className="relative h-40 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 group">
                    <img src={url} alt="업로드 미리보기" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow"
                    >
                      삭제 / 재선택
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-stone-700">PC 내 이미지 파일 선택</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, WEBP (최대 5MB)</p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  컴퓨터에서 파일 검색
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  또는 외부 이미지 웹 URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  보관함에 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ASSET CONFIRMATION MODAL */}
      {deletingAssetId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div>
              <h3 className="text-base font-extrabold text-stone-900">이미지 삭제 확인</h3>
              <p className="text-xs text-stone-500 mt-1">
                이 이미지를 라이브러리에서 완전히 제거하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingAssetId(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  deleteMediaAsset(deletingAssetId);
                  setDeletingAssetId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
