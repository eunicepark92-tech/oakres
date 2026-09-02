import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomType } from '../../types';
import { BedDouble, Plus, Trash2, Edit3, Check, Sparkles, Layers, Image as ImageIcon, ArrowRight, ShieldCheck, Tag, X, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface RoomTypeManagerProps {
  onNavigateToPackages?: (roomTypeId?: string) => void;
}

export const RoomTypeManager: React.FC<RoomTypeManagerProps> = ({ onNavigateToPackages }) => {
  const { roomTypes, addRoomType, updateRoomType, deleteRoomType, mediaAssets, addMediaAsset, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaVaultOpen, setIsMediaVaultOpen] = useState(false);
  const [createdRoomNotice, setCreatedRoomNotice] = useState<RoomType | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('기준 4인 / 최대 6인');
  const [bedType, setBedType] = useState('온돌방 1 + 더블베드 1 + 거실 + 욕실 2');
  const [size, setSize] = useState('102.4㎡ (31평)');
  const [standardPrice, setStandardPrice] = useState<number>(350000);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    '4K Smart TV',
    '초속무선 Wi-Fi',
    '냉장고',
    '전자레인지',
    '발뮤다 포트',
    '고급 어메니티',
  ]);
  const [newAmenity, setNewAmenity] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackDefaultImg = mediaAssets[0]?.url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setName('');
    setCapacity('기준 4인 / 최대 6인');
    setBedType('온돌방 1 + 더블베드 1 + 거실 + 욕실 2');
    setSize('102.4㎡ (31평)');
    setStandardPrice(350000);
    setDescription('');
    setImageUrl(fallbackDefaultImg);
    setAmenities(['4K Smart TV', '초속무선 Wi-Fi', '냉장고', '전자레인지', '발뮤다 포트', '고급 어메니티']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: RoomType) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity);
    setBedType(room.bedType);
    setSize(room.size);
    setStandardPrice(room.standardPrice || 350000);
    setDescription(room.description);
    setImageUrl(room.imageUrl || fallbackDefaultImg);
    setAmenities(room.amenities || []);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('이미지 최적화 압축 진행 중...', 'info');
      const compressedDataUrl = await compressImageFile(file, 1600, 1200, 0.82);
      setImageUrl(compressedDataUrl);
      
      // Auto register to central media library
      addMediaAsset({
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: compressedDataUrl,
        category: '객실',
        sizeKb: Math.round((compressedDataUrl.length * 0.75) / 1024),
      });
      showToast('객실 이미지가 최적화되어 선택 및 미디어 보관함에 연동되었습니다.', 'success');
    } catch (err: any) {
      alert(err.message || '파일 처리 중 오류가 발생했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    setAmenities([...amenities, newAmenity.trim()]);
    setNewAmenity('');
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalImage = imageUrl.trim() || fallbackDefaultImg;

    if (editingRoom) {
      updateRoomType(editingRoom.id, {
        name,
        capacity,
        bedType,
        size,
        standardPrice,
        description,
        imageUrl: finalImage,
        amenities,
      });
      setIsModalOpen(false);
    } else {
      const created = addRoomType({
        name,
        capacity,
        bedType,
        size,
        standardPrice,
        description,
        imageUrl: finalImage,
        amenities,
      });
      setIsModalOpen(false);
      setCreatedRoomNotice(created);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingRoom) {
      deleteRoomType(deletingRoom.id);
      setDeletingRoom(null);
    }
  };

  const filteredRoomTypes = roomTypes.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bedType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-oak-green" />
            <span>원천 객실 / 객실 타입 마스터 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            오크밸리리조트의 자산 원천 객실(Room Type)을 등록·수정합니다. 이미지 업로드, 평형, 구비 비품을 수정하여 [패키지 등록] 탭에서 제휴 전용 상품을 구성할 수 있습니다.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>신규 원천 객실 추가</span>
        </button>
      </div>

      {/* Post-Creation Banner Notice */}
      {createdRoomNotice && (
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl text-amber-300 border border-emerald-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>원천 객실 [{createdRoomNotice.name}] 생성 완료!</span>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded">
                  신규 자산
                </span>
              </h4>
              <p className="text-xs text-emerald-200 mt-1">
                원천 객실이 성공적으로 추가되었습니다. 해당 객실에 부대시설 혜택(조식, BBQ, 사우나 등)을 결합하여 판매용 패키지를 등록해보세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCreatedRoomNotice(null)}
              className="px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button
              onClick={() => {
                const roomNoticeId = createdRoomNotice.id;
                setCreatedRoomNotice(null);
                if (onNavigateToPackages) {
                  onNavigateToPackages(roomNoticeId);
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-oak-gold hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎁 패키지 등록 탭으로 이동</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-oak-green" />
          <span>전체 등록 원천 객실 ({roomTypes.length}개)</span>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="객실명, 평형, 방 구성 검색..."
            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30"
          />
        </div>
      </div>

      {/* Room Type Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRoomTypes.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              {/* Photo & Name Bar */}
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback image if broken URL
                    (e.target as HTMLImageElement).src = fallbackDefaultImg;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-stone-900/90 text-oak-gold text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-sm border border-stone-700">
                    {room.size}
                  </span>
                  <span className="bg-oak-green/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {room.capacity}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-lg text-white drop-shadow">
                    {room.name}
                  </h3>
                  <p className="text-xs text-stone-200 font-medium truncate mt-0.5">
                    {room.bedType}
                  </p>
                </div>
              </div>

              {/* Room Content Details */}
              <div className="p-5 space-y-3 text-xs">
                {room.standardPrice && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-stone-500 font-medium">원천 객실 공시 기준가:</span>
                    <span className="font-extrabold text-stone-900 text-sm">
                      {room.standardPrice.toLocaleString()}원 / 1박
                    </span>
                  </div>
                )}

                <p className="text-stone-600 line-clamp-2 leading-relaxed">
                  {room.description}
                </p>

                {/* Amenities Tags */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                      구비 비품 및 편의시설:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-stone-100 text-stone-700 font-medium text-[10px] px-2 py-0.5 rounded-md border border-stone-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (onNavigateToPackages) {
                    onNavigateToPackages(room.id);
                  }
                }}
                className="text-xs text-oak-green hover:text-oak-dark font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <span>이 객실로 패키지 등록</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEditModal(room)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                  <span>수정</span>
                </button>
                <button
                  onClick={() => setDeletingRoom(room)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="객실 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 relative my-auto">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-oak-green/10 text-oak-green">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    {editingRoom ? '원천 객실 정보 수정' : '신규 원천 객실 등록'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    리조트 마스터 자산 객실의 대표 이미지, 수용 인원, 평형, 방 구성 정보를 입력하세요.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  객실명 (Room Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 사우스콘도 52평 펜트하우스 스위트"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    평형 및 면적 (Size)
                  </label>
                  <input
                    type="text"
                    required
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="예: 102.4㎡ (31평)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    수용 인원 (Capacity)
                  </label>
                  <input
                    type="text"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="예: 기준 4인 / 최대 6인"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    방 및 침대 구성 (Bed Type)
                  </label>
                  <input
                    type="text"
                    required
                    value={bedType}
                    onChange={(e) => setBedType(e.target.value)}
                    placeholder="예: 온돌방 1 + 더블베드 룸 1 + 거실 + 욕실 2"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    공시 기준 금액 (Standard Price)
                  </label>
                  <input
                    type="number"
                    required
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(Number(e.target.value))}
                    placeholder="예: 350000"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  객실 상세 설명
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="객실의 주요 특징, 조망, 고객 매력 포인트를 상세히 작성해주세요."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>

              {/* ENHANCED IMAGE UPLOADER & SELECTOR */}
              <div className="space-y-3 border border-stone-200 p-4 rounded-2xl bg-stone-50/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-oak-green" />
                    <span>객실 대표 이미지 등록 및 변경</span>
                  </label>
                  <span className="text-[10px] text-stone-500">PC 파일 업로드 또는 프리셋 선택</span>
                </div>

                {/* Live Image Preview & Upload Dropzone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Live Image Preview Box */}
                  <div className="relative h-32 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 group">
                    <img
                      src={imageUrl || fallbackDefaultImg}
                      alt="객실 이미지 미리보기"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackDefaultImg;
                      }}
                    />
                    <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-[10px] font-bold">
                      실시간 미리보기
                    </div>
                  </div>

                  {/* Upload Action Buttons */}
                  <div className="sm:col-span-2 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-oak-green" />
                        <span>PC 파일 업로드 (최대 10MB/자동압축)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMediaVaultOpen(true)}
                        className="w-full py-2 bg-oak-green/10 hover:bg-oak-green/20 border border-oak-green/40 text-oak-dark font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-oak-green" />
                        <span>🖼️ 미디어 라이브러리 선택</span>
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="또는 이미지 웹 URL 직접 입력 (https://...)"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Assets Selection Options */}
                {mediaAssets.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-bold text-stone-600 mb-1.5">
                      미디어 보관함 이미지 선택:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mediaAssets.slice(0, 6).map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => setImageUrl(asset.url)}
                          className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            imageUrl === asset.url
                              ? 'border-oak-green bg-oak-green/10 ring-2 ring-oak-green/50'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <img src={asset.url} alt={asset.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          <span className="text-[11px] font-bold text-stone-800 truncate">{asset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities Builder */}
              <div className="space-y-2 border border-stone-200 p-3.5 rounded-2xl bg-stone-50/50">
                <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span>구비 비품 및 어메니티</span>
                  <span className="text-[10px] text-stone-500">{amenities.length}개 항목</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="예: 발뮤다 토스터기, 네스프레소 머신"
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="px-3 py-1.5 bg-stone-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    추가
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {amenities.map((item, i) => (
                    <span
                      key={i}
                      className="bg-white text-stone-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1.5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(i)}
                        className="text-stone-400 hover:text-rose-600 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingRoom ? '객실 정보 및 이미지 수정 저장' : '원천 객실 저장'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL (Avoids native confirm iframe blocking) */}
      {deletingRoom && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  원천 객실 삭제 확인
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  해당 자산 객실을 원천 목록에서 영구히 삭제합니다.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1">
              <div className="font-extrabold text-stone-900 text-sm">{deletingRoom.name}</div>
              <div className="text-stone-500">{deletingRoom.size} | {deletingRoom.capacity}</div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              정말로 이 원천 객실을 삭제하시겠습니까? 연결된 결합 상품이 있는 경우 예약 설정 시 영향이 있을 수 있습니다.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingRoom(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>객실 삭제 진행</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA VAULT SELECTION MODAL */}
      {isMediaVaultOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-oak-green" />
                <h3 className="text-base font-extrabold text-stone-900">
                  중앙 미디어 라이브러리 이미지 선택 ({mediaAssets.length}개 자산)
                </h3>
              </div>
              <button
                onClick={() => setIsMediaVaultOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              보관함에 등록된 이미지 중 객실 대표 사진으로 사용할 자산을 클릭하세요.
            </p>

            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setImageUrl(asset.url);
                    setIsMediaVaultOpen(false);
                    showToast(`미디어 자산 [${asset.title}]이 객실 이미지로 적용되었습니다.`, 'success');
                  }}
                  className={`p-2 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 group ${
                    imageUrl === asset.url
                      ? 'border-oak-green bg-oak-green/10 ring-2 ring-oak-green'
                      : 'border-stone-200 bg-stone-50 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="h-28 rounded-xl overflow-hidden bg-stone-200 relative">
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-stone-900/80 text-white text-[9px] font-bold rounded-md backdrop-blur-sm">
                      {asset.category || '일반'}
                    </span>
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-stone-900 block truncate">{asset.title}</span>
                    <span className="text-[10px] text-stone-400 block font-mono">{asset.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setIsMediaVaultOpen(false)}
                className="px-5 py-2 bg-stone-800 text-white font-bold text-xs rounded-xl hover:bg-stone-900 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

