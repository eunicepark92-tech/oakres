import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Plus, Trash2, Key, Percent, CheckCircle2, AlertCircle, Edit3, X } from 'lucide-react';
import { Partner } from '../../types';

export const PartnerManager: React.FC = () => {
  const { partners, addPartner, updatePartner, deletePartner, currentAdmin, showToast } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [discountRate, setDiscountRate] = useState<number>(30);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [formError, setFormError] = useState('');

  // Editing Partner State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editDiscountRate, setEditDiscountRate] = useState(30);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');

  const handleStartEdit = (p: Partner) => {
    setEditingPartner(p);
    setEditName(p.name);
    setEditCode(p.code);
    setEditLogoUrl(p.logoUrl);
    setEditDiscountRate(p.discountRate || 30);
    setEditContactEmail(p.contactEmail || '');
    setEditContactPhone(p.contactPhone || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    if (!editName.trim() || !editCode.trim()) {
      showToast('제휴사명과 코드는 필수입니다.', 'error');
      return;
    }

    const cleanCode = editCode.trim().toUpperCase();
    if (partners.some((p) => p.id !== editingPartner.id && p.code.toUpperCase() === cleanCode)) {
      showToast('이미 사용 중인 제휴사 코드입니다.', 'error');
      return;
    }

    updatePartner(editingPartner.id, {
      name: editName.trim(),
      code: cleanCode,
      logoUrl: editLogoUrl,
      discountRate: editDiscountRate,
      contactEmail: editContactEmail,
      contactPhone: editContactPhone,
    });

    setEditingPartner(null);
  };

  // Sample Preset Brand Logos
  const PRESET_LOGOS = [
    { label: '삼성 style', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' },
    { label: '현대 style', url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=150&q=80' },
    { label: '네이버 style', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80' },
    { label: '카카오 style', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80' },
    { label: '골드 럭셔리', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !code.trim()) {
      setFormError('제휴사명과 제휴사 코드는 필수 입력 사항입니다.');
      return;
    }

    // Check code duplication
    const cleanCode = code.trim().toUpperCase();
    if (partners.some((p) => p.code.toUpperCase() === cleanCode)) {
      setFormError('이미 사용 중인 제휴사 코드입니다. 다른 코드를 사용해주세요.');
      return;
    }

    addPartner({
      name,
      code: cleanCode,
      logoUrl: logoUrl || PRESET_LOGOS[0].url,
      discountRate,
      contactEmail,
      contactPhone,
    });

    setName('');
    setCode('');
    setLogoUrl('');
    setDiscountRate(30);
    setContactEmail('');
    setContactPhone('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-oak-green" />
            <span>제휴사 등록 및 로고 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            신규 제휴사를 등록하고 고유 제휴사 코드 및 앱 상단 표시 전용 로고를 바인딩합니다.
          </p>
        </div>

        <span className="text-xs text-stone-600 font-bold bg-stone-100 px-3 py-1.5 rounded-lg border">
          담당 영업사원: {currentAdmin?.name || '마스터 관리자'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Partner Registration Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b pb-3">
            <Plus className="w-5 h-5 text-oak-green" />
            <span>신규 제휴사 등록</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                제휴사명 (Partner Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: SK하이닉스 임직원"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                제휴사 코드 (Partner Code) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="예: SK2026"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-oak-green/30"
                />
                <Key className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                ※ 일반 사용자가 접속 시 입력하는 유일한 인증 코드입니다.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                우대 할인율 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold focus:outline-none"
                />
                <Percent className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">
                  제휴사 로고 (PC 파일 업로드 / URL / 샘플)
                </label>
                <input
                  type="file"
                  id="partnerLogoInput"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setLogoUrl(reader.result);
                        showToast('제휴사 로고가 성공적으로 선택되었습니다.', 'success');
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('partnerLogoInput')?.click()}
                  className="text-[11px] font-bold text-oak-green hover:underline cursor-pointer"
                >
                  📁 PC 파일 선택
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo preview" className="w-8 h-8 rounded border object-cover shrink-0" />
                )}
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png 또는 PC 파일 업로드"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Preset Logos */}
              <div className="flex flex-wrap gap-2">
                {PRESET_LOGOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLogoUrl(p.url)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-[11px] font-bold rounded-lg border border-stone-300 flex items-center gap-1"
                  >
                    <img src={p.url} alt={p.label} className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">담당자 이메일</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">담당자 연락처</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="02-1234-5678"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              제휴사 생성 및 로고 바인딩
            </button>
          </form>
        </div>

        {/* Right: Registered Partners List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>등록된 제휴사 목록 ({partners.length}개)</span>
            </h3>
          </div>

          <div className="space-y-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 flex items-center justify-between gap-4 hover:bg-stone-100/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Logo Preview */}
                  <div className="w-14 h-12 bg-white rounded-lg border p-1 flex items-center justify-center shrink-0">
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-sm">{partner.name}</span>
                      <span className="text-[10px] font-mono font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        코드: {partner.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                      <span>할인율: <strong className="text-stone-800">{partner.discountRate}%</strong></span>
                      <span>담당자: {partner.salesAgentName}</span>
                      <span>등록일: {partner.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(partner)}
                    className="p-2 text-stone-500 hover:text-oak-green hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                    title="제휴사 수정"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePartner(partner.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="제휴사 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Partner Modal */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-oak-green" />
                <span>제휴사 정보 수정</span>
              </h3>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  제휴사명
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    제휴사 코드
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    할인율 (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editDiscountRate}
                    onChange={(e) => setEditDiscountRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  제휴사 로고 URL
                </label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">담당자 이메일</label>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">담당자 연락처</label>
                  <input
                    type="tel"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow"
                >
                  수정사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
