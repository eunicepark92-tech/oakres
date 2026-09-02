import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PackageCategory, Package } from '../../types';
import { Gift, Plus, Trash2, Edit3, Layers, Tag, Check, Sparkles, Image as ImageIcon, Upload, X, AlertTriangle, BedDouble, CheckSquare, Square } from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';
import { MediaGalleryManager } from './MediaGalleryManager';
import { compressImageFile } from '../../utils/imageCompressor';

interface PackageManagerProps {
  initialRoomTypeId?: string;
}

export const PackageManager: React.FC<PackageManagerProps> = ({ initialRoomTypeId }) => {
  const { packages, packageCategories, partners, roomTypes, mediaAssets, addPackage, updatePackage, deletePackage, addMediaAsset, showToast, hasPermission } = useApp();

  const canManagePackages = hasPermission('canManagePackages');

  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [partnerCode, setPartnerCode] = useState<string>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Multi-room-type selection state
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>(() => {
    if (initialRoomTypeId) return [initialRoomTypeId];
    return roomTypes.map((r) => r.id);
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackageCategory>('ROOM_ONLY');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(180000);
  const [highlightBadge, setHighlightBadge] = useState('인기');
  const [imageUrl, setImageUrl] = useState('');
  const [isMediaVaultOpen, setIsMediaVaultOpen] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState<Package | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Inclusions List
  const [inclusions, setInclusions] = useState<string[]>([
    '선택 객실 1박 숙박',
    '부대시설 20% 우대 할인 쿠폰 4매',
  ]);
  const [newInclusion, setNewInclusion] = useState('');

  const handleStartEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setPartnerCode(pkg.partnerCode);
    setName(pkg.name);
    setCategory(pkg.category);
    setDescription(pkg.description);
    setBasePrice(pkg.basePrice);
    setHighlightBadge(pkg.highlightBadge || '인기');
    setImageUrl(pkg.imageUrl);
    setInclusions(pkg.inclusions || []);

    const existingRoomIds = pkg.roomTypeIds && pkg.roomTypeIds.length > 0 
      ? pkg.roomTypeIds 
      : roomTypes.map((r) => r.id);
    setSelectedRoomTypeIds(existingRoomIds);
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setPartnerCode('ALL');
    setName('');
    setDescription('');
    setBasePrice(180000);
    setHighlightBadge('인기');
    setImageUrl('');
    setInclusions(['선택 객실 1박 숙박', '부대시설 20% 우대 할인 쿠폰 4매']);
    setSelectedRoomTypeIds(roomTypes.map((r) => r.id));
  };

  const toggleRoomType = (id: string) => {
    if (selectedRoomTypeIds.includes(id)) {
      if (selectedRoomTypeIds.length === 1) {
        showToast('최소 하나 이상의 원천 객실을 선택해야 합니다.', 'error');
        return;
      }
      setSelectedRoomTypeIds(selectedRoomTypeIds.filter((item) => item !== id));
    } else {
      setSelectedRoomTypeIds([...selectedRoomTypeIds, id]);
    }
  };

  const selectAllRoomTypes = () => {
    if (selectedRoomTypeIds.length === roomTypes.length) {
      setSelectedRoomTypeIds([roomTypes[0]?.id || '']);
    } else {
      setSelectedRoomTypeIds(roomTypes.map((r) => r.id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('이미지를 최적화 압축 처리 중입니다...', 'info');
      const compressedDataUrl = await compressImageFile(file, 1600, 1200, 0.82);
      setImageUrl(compressedDataUrl);
      showToast('이미지가 최적화되어 설정되었습니다. (최대 10MB 자동압축)', 'success');
      
      // Auto register to media vault
      addMediaAsset({
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: compressedDataUrl,
        category: '패키지',
        sizeKb: Math.round((compressedDataUrl.length * 0.75) / 1024),
      });
    } catch (err: any) {
      alert(err.message || '이미지 파일 업로드 중 오류가 발생했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions([...inclusions, newInclusion.trim()]);
    setNewInclusion('');
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (selectedRoomTypeIds.length === 0) {
      alert('최소 1개 이상의 원천 객실을 패키지에 연결해야 합니다.');
      return;
    }

    const fallbackImg = mediaAssets[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
    const finalImage = imageUrl.trim() || fallbackImg;

    const selectedCategoryLabel = packageCategories.find((c) => c.key === category)?.label || category;

    if (editingPackage) {
      const updatedPkgData = {
        partnerId: partnerCode === 'ALL' ? 'ALL' : partners.find((p) => p.code === partnerCode)?.id || 'ALL',
        partnerCode,
        name,
        category,
        categoryLabel: selectedCategoryLabel,
        description,
        inclusions,
        imageUrl: finalImage,
        basePrice,
        highlightBadge,
        roomTypeIds: selectedRoomTypeIds,
      };
      updatePackage(editingPackage.id, updatedPkgData);
      setEditingPackage({ ...editingPackage, ...updatedPkgData });
      showToast(`[${name}] 패키지 수정 내용이 저장되었습니다.`, 'success');
    } else {
      addPackage({
        partnerId: partnerCode === 'ALL' ? 'ALL' : partners.find((p) => p.code === partnerCode)?.id || 'ALL',
        partnerCode,
        name,
        category,
        categoryLabel: selectedCategoryLabel,
        description,
        inclusions,
        imageUrl: finalImage,
        maxOccupancy: 6,
        basePrice,
        highlightBadge,
        active: true,
        roomTypeIds: selectedRoomTypeIds,
      });

      setName('');
      setDescription('');
      setImageUrl('');
      setInclusions(['선택 객실 1박 숙박', '부대시설 20% 우대 할인 쿠폰 4매']);
      setSelectedRoomTypeIds(roomTypes.map((r) => r.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-oak-green" />
            <span>제휴 패키지 등록 및 수정 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            제휴사별 단독 특가 및 부대시설이 결합된 전용 패키지 상품을 신규 등록하거나 기존 상품을 자유롭게 수정합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <Tag className="w-4 h-4 text-amber-400" />
          <span>🏷️ 카테고리 추가 / 수정 관리</span>
        </button>
      </div>

      {/* Permission Restriction Banner for Reservation Desk */}
      {!canManagePackages && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>예약실 직원 권한 안내:</strong> 패키지 및 요금 상품 신규 등록/수정/삭제 권한이 부여되지 않았습니다. (영업사원 및 마스터 전용 권한)
            </span>
          </div>
          <span className="text-[11px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 shrink-0 font-bold">
            읽기 전용
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Registration / Edit Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              {editingPackage ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-oak-green" />}
              <span>{editingPackage ? `[${editingPackage.name}] 패키지 수정` : '신규 패키지 생성'}</span>
            </h3>
            {editingPackage && (
              <button
                onClick={handleCancelEdit}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                수정 취소
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                대상 제휴사 지정
              </label>
              <select
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
              >
                <option value="ALL">🌐 전체 제휴사 공통 패키지</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.code}>
                    🏢 [{p.name}] 전용 패키지 ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* MULTI ROOM TYPE SELECTION BOX */}
            <div className="border border-stone-200 p-4 rounded-2xl bg-stone-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-oak-green" />
                  <span>연결 원천 객실 다중 선택 (Master Room Types)</span>
                </label>
                <button
                  type="button"
                  onClick={selectAllRoomTypes}
                  className="text-[11px] font-bold text-oak-green hover:underline cursor-pointer"
                >
                  {selectedRoomTypeIds.length === roomTypes.length ? '선택 해제' : '전체 객실 선택'}
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                이 패키지와 연결할 모든 원천 객실을 선택하세요. 요금 등록 시 선택된 원천 객실들만 해당 패키지에 노출됩니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {roomTypes.map((room) => {
                  const isSelected = selectedRoomTypeIds.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoomType(room.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-extrabold text-stone-900 truncate">{room.name}</div>
                        <div className="text-[10px] text-stone-500 font-normal">{room.size} | {room.capacity}</div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-emerald-800 font-bold bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200">
                총 {selectedRoomTypeIds.length}개 원천 객실 선택됨
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                패키지명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: [조식 포함] 숲속 모닝 라이브 패키지"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">카테고리</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[10px] font-bold text-oak-green hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Tag className="w-3 h-3" />
                    <span>카테고리 수정/추가</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PackageCategory)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none"
                >
                  {packageCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label} ({cat.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">기본 요금 (원)</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">패키지 설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="패키지 혜택 및 컨셉을 요약해 입력하세요."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
              />
            </div>

            {/* Inclusions Builder */}
            <div className="space-y-2 border border-stone-200 p-3.5 rounded-xl bg-stone-50/50">
              <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                <span>포함사항 목록 (Inclusions)</span>
                <span className="text-[10px] text-stone-500">{inclusions.length}개 항목</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  placeholder="예: 조식 뷔페 2인 식사권"
                  className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddInclusion}
                  className="px-3 py-1.5 bg-stone-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  추가
                </button>
              </div>

              <div className="space-y-1 pt-2">
                {inclusions.map((inc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-stone-200">
                    <span className="text-stone-800 font-medium">{inc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(i)}
                      className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Upload & Library Selection */}
            <div className="space-y-3 border border-stone-200 p-3.5 rounded-xl bg-stone-50">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-800">대표 사진 설정</label>
                <button
                  type="button"
                  onClick={() => setIsMediaVaultOpen(true)}
                  className="text-[11px] font-bold text-oak-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>중앙 보관함에서 선택</span>
                </button>
              </div>

              {/* Preview & File Upload */}
              <div className="flex items-center gap-3">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0">
                  <img
                    src={imageUrl || mediaAssets[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt="패키지 사진"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = mediaAssets[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 space-y-1.5">
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
                    className="w-full py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-oak-green" />
                    <span>PC 파일 업로드 (최대 10MB/자동압축)</span>
                  </button>

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="또는 이미지 URL 직접 입력"
                    className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* Quick Select from Registered Media Assets */}
              {mediaAssets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-stone-600 block">미디어 보관함 빠른 선택:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaAssets.slice(0, 4).map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setImageUrl(asset.url)}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          imageUrl === asset.url ? 'border-oak-green bg-oak-green/10 ring-1 ring-oak-green' : 'border-stone-200 bg-white hover:bg-stone-100'
                        }`}
                      >
                        <img src={asset.url} alt={asset.title} className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[11px] font-bold text-stone-800 truncate">{asset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canManagePackages}
              className={`w-full py-3.5 font-extrabold text-sm rounded-xl shadow-md transition-all ${
                !canManagePackages
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
                  : editingPackage
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                  : 'bg-oak-green hover:bg-oak-dark text-white cursor-pointer'
              }`}
            >
              {!canManagePackages
                ? '🔒 예약실 권한 제한 (패키지 생성/수정 불가)'
                : editingPackage
                ? '패키지 수정 내용 저장하기'
                : '패키지 신규 생성 완료'}
            </button>
          </form>
        </div>

        {/* Right: Package List Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b pb-3 flex items-center justify-between">
            <span>등록된 패키지 목록 ({packages.length}개)</span>
            <span className="text-xs text-stone-500 font-normal">버튼 클릭 시 전체 정보 수정 가능</span>
          </h3>

          <div className="space-y-4">
            {packages.map((pkg) => {
              const connectedCount = pkg.roomTypeIds?.length || roomTypes.length;

              return (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    editingPackage?.id === pkg.id
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-stone-50 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = mediaAssets[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-stone-900 text-sm">{pkg.name}</span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {pkg.partnerCode === 'ALL' ? '전체 제휴' : pkg.partnerCode}
                        </span>
                        {pkg.highlightBadge && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {pkg.highlightBadge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 mt-1 line-clamp-1">{pkg.description}</p>

                      <div className="flex items-center gap-2 text-xs font-bold text-oak-dark mt-2 flex-wrap">
                        <span>기본가 {pkg.basePrice.toLocaleString()}원</span>
                        <span>• {pkg.categoryLabel}</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          연결 원천객실 {connectedCount}개
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleStartEdit(pkg)}
                      className="p-2 bg-white hover:bg-stone-100 text-stone-700 hover:text-amber-700 border border-stone-300 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      title="패키지 정보 수정"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>수정</span>
                    </button>

                    <button
                      onClick={() => setDeletingPkg(pkg)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="패키지 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MEDIA VAULT SELECTION MODAL */}
      {isMediaVaultOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-fade-in space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-oak-green" />
                <span>중앙 미디어 보관함에서 이미지 선택</span>
              </h3>
              <button
                onClick={() => setIsMediaVaultOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-1 flex-1">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setImageUrl(asset.url);
                    setIsMediaVaultOpen(false);
                    showToast(`[${asset.title}] 이미지가 선택되었습니다.`, 'success');
                  }}
                  className="bg-stone-50 border border-stone-200 hover:border-oak-green rounded-2xl overflow-hidden cursor-pointer group transition-all p-2 space-y-1.5"
                >
                  <div className="h-28 rounded-xl overflow-hidden bg-stone-200">
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="font-bold text-xs text-stone-800 truncate">{asset.title}</div>
                  <div className="text-[10px] text-stone-500">{asset.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div>
              <h3 className="text-base font-extrabold text-stone-900">패키지 삭제 확인</h3>
              <p className="text-xs text-stone-500 mt-1">
                [{deletingPkg.name}] 패키지를 완전히 삭제하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingPkg(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  deletePackage(deletingPkg.id);
                  setDeletingPkg(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA VAULT SELECTOR MODAL */}
      {isMediaVaultOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-oak-green" />
                <span>중앙 미디어 라이브러리에서 패키지 대표 사진 선택</span>
              </h3>
              <button
                onClick={() => setIsMediaVaultOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <MediaGalleryManager
              onSelectImage={(url) => {
                setImageUrl(url);
                setIsMediaVaultOpen(false);
                showToast('미디어 보관함의 이미지가 패키지 사진으로 선택되었습니다.', 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

    </div>
  );
};
