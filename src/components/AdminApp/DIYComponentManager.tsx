import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Component, ComponentCategory, Partner, PartnerComponentRule, DiyRoomRate } from '../../types';
import { Layers, Plus, Edit3, Trash2, Eye, EyeOff, Tags, DollarSign, Building2, Percent, Save, Undo, Search, HelpCircle, Check, X, ToggleLeft, ToggleRight, Info, Calendar, Sparkles } from 'lucide-react';
import { calculateComponentPrice } from '../../utils/pricing';

export const DIYComponentManager: React.FC = () => {
  const {
    partners,
    components,
    partnerComponentRules,
    addComponent,
    updateComponent,
    deleteComponent,
    upsertPartnerComponentRule,
    diyRoomRates,
    roomTypes,
    addDiyRoomRate,
    updateDiyRoomRate,
    deleteDiyRoomRate,
    specialDays,
    showToast,
    addAuditLog,
  } = useApp();

  // Sub Tab Navigation
  const [subTab, setSubTab] = useState<'components' | 'room_rates'>('components');

  // ==========================================
  // [1] DIY Components States & Handlers
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // Component Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('FB');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [normalPrice, setNormalPrice] = useState<number>(0);
  const [isDiscountable, setIsDiscountable] = useState<boolean>(true);
  const [tags, setTags] = useState('');

  // Extended Pricing states for Component (Period/Weekday specific pricing)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekdayPrice, setWeekdayPrice] = useState<number | ''>('');
  const [fridayPrice, setFridayPrice] = useState<number | ''>('');
  const [saturdayPrice, setSaturdayPrice] = useState<number | ''>('');
  const [specialPrice, setSpecialPrice] = useState<number | ''>('');

  // Partner overrides input states
  const [overrideVisible, setOverrideVisible] = useState<Record<string, boolean>>({});
  const [overridePrice, setOverridePrice] = useState<Record<string, string>>({});
  const [overrideDiscount, setOverrideDiscount] = useState<Record<string, string>>({});

  const CATEGORIES: { value: ComponentCategory; label: string; bg: string; text: string }[] = [
    { value: 'FB', label: '식음 F&B', bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700' },
    { value: 'ACTIVITY', label: '레저/액티비티', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
    { value: 'OPTION', label: '객실 옵션', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
    { value: 'BENEFIT', label: '고객 혜택/웰컴', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700' },
  ];

  const getCategoryBadge = (cat: ComponentCategory) => {
    const matched = CATEGORIES.find((c) => c.value === cat);
    if (matched) return matched;
    return { value: cat, label: cat, bg: 'bg-stone-100 text-stone-700 border-stone-200', text: 'text-stone-700' };
  };

  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      if (comp.category === 'ROOM' || comp.category === 'GOLF') return false;
      const matchCat = selectedCategory === 'ALL' || comp.category === selectedCategory;
      const matchSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (comp.description && comp.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [components, selectedCategory, searchQuery]);

  const handleOpenCreate = () => {
    setEditingComponent(null);
    setName('');
    setCategory('FB');
    setDescription('');
    setBasePrice(0);
    setNormalPrice(0);
    setIsDiscountable(true);
    setTags('');
    setStartDate('');
    setEndDate('');
    setWeekdayPrice('');
    setFridayPrice('');
    setSaturdayPrice('');
    setSpecialPrice('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Component, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingComponent(comp);
    setName(comp.name);
    setCategory(comp.category);
    setDescription(comp.description || '');
    setBasePrice(comp.basePrice);
    setNormalPrice(comp.normalPrice || comp.basePrice);
    setIsDiscountable(comp.isDiscountable);
    setTags(comp.tags ? comp.tags.join(', ') : '');
    setStartDate(comp.startDate || '');
    setEndDate(comp.endDate || '');
    setWeekdayPrice(comp.weekdayPrice !== undefined ? comp.weekdayPrice : '');
    setFridayPrice(comp.fridayPrice !== undefined ? comp.fridayPrice : '');
    setSaturdayPrice(comp.saturdayPrice !== undefined ? comp.saturdayPrice : '');
    setSpecialPrice(comp.specialPrice !== undefined ? comp.specialPrice : '');
    setIsModalOpen(true);
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('상품명을 입력해주세요.', 'error');
      return;
    }
    if (basePrice < 0) {
      showToast('가격을 0원 이상으로 입력해주세요.', 'error');
      return;
    }

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const compData = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        basePrice,
        normalPrice: normalPrice || basePrice,
        isDiscountable,
        tags: tagList,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        weekdayPrice: weekdayPrice !== '' ? Number(weekdayPrice) : undefined,
        fridayPrice: fridayPrice !== '' ? Number(fridayPrice) : undefined,
        saturdayPrice: saturdayPrice !== '' ? Number(saturdayPrice) : undefined,
        specialPrice: specialPrice !== '' ? Number(specialPrice) : undefined,
      };

      if (editingComponent) {
        await updateComponent(editingComponent.id, compData);
        addAuditLog('PACKAGE', `DIY 상품 마스터 수정: ${name.trim()}`, `ID: ${editingComponent.id}`);
        showToast('상품 정보가 수정되었습니다.', 'success');

        if (selectedComponent?.id === editingComponent.id) {
          setSelectedComponent({
            ...selectedComponent,
            ...compData,
          });
        }
      } else {
        const created = await addComponent(compData);
        await updateComponent(created.id, { normalPrice: normalPrice || basePrice });
        addAuditLog('PACKAGE', `DIY 상품 마스터 신규등록: ${name.trim()}`, `가격: ${basePrice}`);
        showToast('신규 DIY 상품이 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || '상품 저장 오류', 'error');
    }
  };

  const handleToggleActive = async (comp: Component, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateComponent(comp.id, { isActive: !comp.isActive });
      addAuditLog('PACKAGE', `DIY 상품 활성토글: ${comp.name}`, `활성: ${!comp.isActive}`);
      showToast(`${comp.name} 상태가 변경되었습니다.`, 'success');
    } catch (err: any) {
      showToast('상태 수정 실패', 'error');
    }
  };

  const handleDeleteComponent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 상품을 완전히 삭제하시겠습니까? 관련 제휴사 판매 규칙도 모두 소멸합니다.')) return;
    try {
      await deleteComponent(id);
      if (selectedComponent?.id === id) {
        setSelectedComponent(null);
      }
      showToast('상품이 삭제되었습니다.', 'info');
    } catch (err) {
      showToast('상품 삭제 실패', 'error');
    }
  };

  // Load rules when selected component changes
  React.useEffect(() => {
    if (!selectedComponent) {
      setOverrideVisible({});
      setOverridePrice({});
      setOverrideDiscount({});
      return;
    }

    const vis: Record<string, boolean> = {};
    const prc: Record<string, string> = {};
    const dsc: Record<string, string> = {};

    partners.forEach((p) => {
      const rule = partnerComponentRules.find(
        (r) => r.partnerId === p.id && r.componentId === selectedComponent.id
      );
      vis[p.id] = rule ? rule.isVisible : true;
      prc[p.id] = rule && rule.customPrice !== undefined && rule.customPrice !== null ? String(rule.customPrice) : '';
      dsc[p.id] = rule && rule.customDiscountRate !== undefined && rule.customDiscountRate !== null ? String(rule.customDiscountRate) : '';
    });

    setOverrideVisible(vis);
    setOverridePrice(prc);
    setOverrideDiscount(dsc);
  }, [selectedComponent, partnerComponentRules, partners]);

  const handleSavePartnerRule = async (partnerId: string) => {
    if (!selectedComponent) return;
    const isVis = overrideVisible[partnerId] !== false;
    const priceRaw = overridePrice[partnerId];
    const discRaw = overrideDiscount[partnerId];

    const cPrice = priceRaw.trim() !== '' ? Number(priceRaw) : undefined;
    const cDisc = discRaw.trim() !== '' ? Number(discRaw) : undefined;

    if (cPrice !== undefined && (isNaN(cPrice) || cPrice < 0)) {
      showToast('올바른 전용가를 입력해주세요.', 'error');
      return;
    }
    if (cDisc !== undefined && (isNaN(cDisc) || cDisc < 0 || cDisc > 100)) {
      showToast('할인율은 0% ~ 100% 사이로 입력해주세요.', 'error');
      return;
    }

    try {
      await upsertPartnerComponentRule({
        partnerId,
        componentId: selectedComponent.id,
        isVisible: isVis,
        customPrice: cPrice,
        customDiscountRate: cDisc,
      });
      addAuditLog('PACKAGE', `제휴사 DIY 전용 룰 저장: ${selectedComponent.name}`, `제휴사: ${partnerId}`);
      showToast('제휴사별 특별 요금 및 노출 제어 정보가 적용되었습니다.', 'success');
    } catch {
      showToast('룰 설정 실패', 'error');
    }
  };

  // ==========================================
  // [2] DIY Room Rates States & Handlers
  // ==========================================
  const [isDiyRateModalOpen, setIsDiyRateModalOpen] = useState(false);
  const [editingDiyRate, setEditingDiyRate] = useState<DiyRoomRate | null>(null);
  
  const [rateRoomTypeId, setRateRoomTypeId] = useState('');
  const [rateStartDate, setRateStartDate] = useState('');
  const [rateEndDate, setRateEndDate] = useState('');
  const [rateWeekdayPrice, setRateWeekdayPrice] = useState<number>(150000);
  const [rateFridayPrice, setRateFridayPrice] = useState<number>(180000);
  const [rateSaturdayPrice, setRateSaturdayPrice] = useState<number>(220000);
  const [rateSpecialPrice, setRateSpecialPrice] = useState<number>(250000);
  const [rateIsActive, setRateIsActive] = useState(true);

  const handleOpenCreateDiyRate = () => {
    setEditingDiyRate(null);
    setRateRoomTypeId(roomTypes[0]?.id || '');
    setRateStartDate('');
    setRateEndDate('');
    setRateWeekdayPrice(150000);
    setRateFridayPrice(180000);
    setRateSaturdayPrice(220000);
    setRateSpecialPrice(250000);
    setRateIsActive(true);
    setIsDiyRateModalOpen(true);
  };

  const handleOpenEditDiyRate = (rate: DiyRoomRate) => {
    setEditingDiyRate(rate);
    setRateRoomTypeId(rate.roomTypeId);
    setRateStartDate(rate.startDate);
    setRateEndDate(rate.endDate);
    setRateWeekdayPrice(rate.weekdayPrice);
    setRateFridayPrice(rate.fridayPrice);
    setRateSaturdayPrice(rate.saturdayPrice);
    setRateSpecialPrice(rate.specialPrice);
    setRateIsActive(rate.isActive);
    setIsDiyRateModalOpen(true);
  };

  const handleSaveDiyRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateStartDate || !rateEndDate) {
      showToast('적용 기간 시작일과 종료일을 입력해주세요.', 'error');
      return;
    }
    if (rateStartDate > rateEndDate) {
      showToast('시작일이 종료일보다 늦을 수 없습니다.', 'error');
      return;
    }

    const rateData = {
      roomTypeId: rateRoomTypeId,
      startDate: rateStartDate,
      endDate: rateEndDate,
      weekdayPrice: Number(rateWeekdayPrice),
      fridayPrice: Number(rateFridayPrice),
      saturdayPrice: Number(rateSaturdayPrice),
      specialPrice: Number(rateSpecialPrice),
      isActive: rateIsActive,
    };

    try {
      if (editingDiyRate) {
        await updateDiyRoomRate(editingDiyRate.id, rateData);
        showToast('DIY 객실요금 설정이 수정되었습니다.', 'success');
      } else {
        await addDiyRoomRate(rateData);
        showToast('신규 DIY 객실요금이 등록되었습니다.', 'success');
      }
      setIsDiyRateModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'DIY 객실요금 저장 오류', 'error');
    }
  };

  const handleDeleteDiyRate = async (id: string) => {
    if (!window.confirm('정말 이 DIY 객실요금 설정을 삭제하시겠습니까?')) return;
    try {
      await deleteDiyRoomRate(id);
    } catch {
      showToast('삭제 실패', 'error');
    }
  };

  const getRoomTypeName = (id: string) => {
    return roomTypes.find((r) => r.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-oak-green" />
            <span>DIY 맞춤 패키지 총괄 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            고객 전용 1:1 DIY 맞춤 패키지에서 가동되는 개별 F&B, 액티비티 상품 및 객실의 기간/요일별 차등 요금을 통합 통제합니다.
          </p>
        </div>

        {subTab === 'components' ? (
          <button
            onClick={handleOpenCreate}
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 bg-oak-green hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>신규 상품 등록</span>
          </button>
        ) : (
          <button
            onClick={handleOpenCreateDiyRate}
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 bg-oak-green hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>신규 객실요금 기간 등록</span>
          </button>
        )}
      </div>

      {/* SEGMENTED CONTROL TABS */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          onClick={() => setSubTab('components')}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            subTab === 'components'
              ? 'border-oak-green text-oak-green'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          🎁 DIY 부대 옵션 상품 관리
        </button>
        <button
          onClick={() => setSubTab('room_rates')}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            subTab === 'room_rates'
              ? 'border-oak-green text-oak-green'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          🛌 DIY 객실 기간/요일별 요금 관리
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: DIY COMPONENTS (F&B, ACTIVITY, etc.) */}
      {/* ======================================================== */}
      {subTab === 'components' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: COMPONENT LIST */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl">
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="상품명 또는 설명으로 마스터 상품을 직접 검색하십시오..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-bold text-stone-800 focus:outline-none focus:ring-0 placeholder-stone-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  전체보기
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedCategory === cat.value
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List block */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
                <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                  마스터 상품 목록 ({filteredComponents.length}개)
                </h3>
              </div>

              {filteredComponents.length === 0 ? (
                <div className="p-12 text-center text-stone-400">
                  <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-bold">등록된 DIY 전용 마스터 상품이 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                  {filteredComponents.map((comp) => {
                    const badge = getCategoryBadge(comp.category);
                    const isSelected = selectedComponent?.id === comp.id;
                    const hasSpecialPeriod = comp.startDate && comp.endDate;

                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp)}
                        className={`p-4 transition-colors cursor-pointer flex items-center justify-between gap-4 hover:bg-stone-50 ${
                          isSelected ? 'bg-amber-50/40 hover:bg-amber-50/50 border-l-4 border-oak-green pl-3' : ''
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 border rounded-md text-[9px] font-black tracking-wider uppercase ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-stone-900 text-xs font-black truncate">{comp.name}</span>
                            {comp.tags && comp.tags.map((tag) => (
                              <span key={tag} className="text-[9px] text-stone-400 font-bold bg-stone-100 px-1 py-0.2 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <p className="text-[11px] text-stone-500 line-clamp-1">
                            {comp.description || '상세 설명이 등록되지 않았습니다.'}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] text-stone-500 font-medium flex-wrap">
                            <div>
                              정상가: <span className="font-bold text-stone-800">{(comp.normalPrice || comp.basePrice).toLocaleString()}원</span>
                            </div>
                            <div>
                              기본가: <span className="font-bold text-oak-green">{comp.basePrice.toLocaleString()}원</span>
                            </div>
                            <div>
                              할인상속: <span className="font-bold">{comp.isDiscountable ? '예' : '아니오'}</span>
                            </div>
                            {hasSpecialPeriod && (
                              <div className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded">
                                <Calendar className="w-3 h-3" />
                                <span>기간 특별가 설정 활성 ({comp.startDate}~{comp.endDate})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Active Toggle Button */}
                          <button
                            onClick={(e) => handleToggleActive(comp, e)}
                            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                            title={comp.isActive ? '판매중지 처리' : '판매개시 처리'}
                          >
                            {comp.isActive ? (
                              <Eye className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-stone-400" />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={(e) => handleOpenEdit(comp, e)}
                            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteComponent(comp.id, e)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PARTNER RATE RULE OVERRIDES */}
          <div className="lg:col-span-5">
            {selectedComponent ? (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-5 p-5 animate-fade-in">
                <div>
                  <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider">제휴사별 특별 룰 & 노출 설정</h3>
                  <h4 className="text-base font-extrabold text-stone-900 mt-1">{selectedComponent.name}</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    해당 상품에 대해 제휴사별로 노출을 제한하거나, 기본 판매가를 덮어쓰는 제휴사 특별 전용가(or 개별 할인율)를 정의할 수 있습니다.
                  </p>
                </div>

                <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
                  {partners.map((partner) => {
                    const isVis = overrideVisible[partner.id] !== false;
                    const cPrice = overridePrice[partner.id] || '';
                    const cDisc = overrideDiscount[partner.id] || '';

                    // Calculate preview price
                    const calcResult = calculateComponentPrice(
                      selectedComponent,
                      partner,
                      partnerComponentRules,
                      specialDays,
                      new Date().toISOString().split('T')[0] // current date preview
                    );

                    return (
                      <div key={partner.id} className="py-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-stone-900">
                            {partner.name} <span className="text-[10px] text-stone-400 font-normal">({partner.code})</span>
                          </span>

                          <button
                            onClick={() => {
                              setOverrideVisible((prev) => ({
                                ...prev,
                                [partner.id]: !isVis,
                              }));
                            }}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-lg border flex items-center gap-1 transition-all ${
                              isVis
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isVis ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{isVis ? '노출중' : '숨김(Hole)'}</span>
                          </button>
                        </div>

                        {isVis && (
                          <div className="grid grid-cols-2 gap-2">
                            {/* Override price */}
                            <div>
                              <span className="text-[9px] font-bold text-stone-500 block mb-1">제휴사 전용가(원)</span>
                              <input
                                type="text"
                                value={cPrice}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setOverridePrice((prev) => ({ ...prev, [partner.id]: val }));
                                }}
                                placeholder={`기본: ${selectedComponent.basePrice.toLocaleString()}`}
                                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800"
                              />
                            </div>

                            {/* Override discount */}
                            <div>
                              <span className="text-[9px] font-bold text-stone-500 block mb-1">제휴사 개별 할인율(%)</span>
                              <input
                                type="text"
                                value={cDisc}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setOverrideDiscount((prev) => ({ ...prev, [partner.id]: val }));
                                }}
                                placeholder={`기본: ${selectedComponent.isDiscountable ? partner.discountRate : 0}%`}
                                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800"
                              />
                            </div>
                          </div>
                        )}

                        {isVis && (
                          <div className="flex items-center justify-between text-[10px] bg-stone-50 border px-3 py-1.5 rounded-lg flex-wrap gap-2">
                            <div>
                              적용 가격: <span className="font-extrabold text-stone-900">{calcResult.price.toLocaleString()}원</span>
                            </div>
                            <div className="text-stone-400 font-semibold">{calcResult.ruleApplied}</div>
                            
                            <button
                              onClick={() => handleSavePartnerRule(partner.id)}
                              className="px-2 py-1 bg-stone-900 text-white rounded font-bold cursor-pointer hover:bg-stone-850"
                            >
                              적용
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl p-8 text-center text-stone-400">
                <HelpCircle className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-bold leading-relaxed">
                  상품 목록에서 항목을 클릭하시면<br />
                  제휴사별 특별 요금 및 노출을 제어할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: DIY ROOM RATES (PERIOD-BASED ROOM PRICES) */}
      {/* ======================================================== */}
      {subTab === 'room_rates' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                DIY 객실 기간별 요금 마스터 테이블 ({diyRoomRates.length}개 설정)
              </h3>
              <p className="text-[10px] text-stone-400 mt-0.5">객실의 DIY 요금은 일반 패키지와 완전히 독립되어 g요청일에 맞게 계산됩니다.</p>
            </div>
            
            <button
              onClick={handleOpenCreateDiyRate}
              className="px-3 py-1.5 bg-stone-950 text-white hover:bg-stone-850 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 요금대 설정 추가</span>
            </button>
          </div>

          {diyRoomRates.length === 0 ? (
            <div className="p-16 text-center text-stone-400">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-bold">등록된 DIY 객실 기간 요금제가 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">우측 상단 버튼을 클릭하여 새 기간 요금대를 등록하세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-4">객실 유형</th>
                    <th className="p-4">적용 기간</th>
                    <th className="p-4 text-right">주중 가격</th>
                    <th className="p-4 text-right">금요일 가격</th>
                    <th className="p-4 text-right">토요일 가격</th>
                    <th className="p-4 text-right">스페셜 가격</th>
                    <th className="p-4 text-center">상태</th>
                    <th className="p-4 text-center">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-bold">
                  {diyRoomRates.map((rate) => {
                    return (
                      <tr key={rate.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 text-stone-900">{getRoomTypeName(rate.roomTypeId)}</td>
                        <td className="p-4">
                          <span className="bg-stone-100 border border-stone-200 px-2 py-0.8 rounded text-[11px]">
                            {rate.startDate} ~ {rate.endDate}
                          </span>
                        </td>
                        <td className="p-4 text-right">{rate.weekdayPrice.toLocaleString()}원</td>
                        <td className="p-4 text-right text-indigo-700">{rate.fridayPrice.toLocaleString()}원</td>
                        <td className="p-4 text-right text-rose-600">{rate.saturdayPrice.toLocaleString()}원</td>
                        <td className="p-4 text-right text-amber-700">{rate.specialPrice.toLocaleString()}원</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            rate.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}>
                            {rate.isActive ? '가동중' : '중단'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditDiyRate(rate)}
                              className="p-1 hover:bg-stone-100 rounded text-stone-600 hover:text-stone-900"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDiyRate(rate.id)}
                              className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COMPONENT CREATION & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-oak-green" />
                <span>{editingComponent ? 'DIY 단품 마스터 정보 수정' : '신규 DIY 상품 등록'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-4">
              
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  카테고리 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all ${
                        category === cat.value
                          ? 'bg-oak-green text-white border-oak-green shadow-xs'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  상품명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 그릴라 셀프 BBQ 가든 2인 대여권"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 text-stone-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  상품 상세 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="고객에게 노출될 상세한 이용 조건, 인클루전, 유효시간 등을 입력하십시오."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Normal Price */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    정상가 (비할인가) <span className="text-stone-400 font-medium">(선택)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={normalPrice || ''}
                      onChange={(e) => setNormalPrice(Number(e.target.value))}
                      placeholder="예: 80000"
                      className="w-full pl-3 pr-8 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 text-stone-800"
                    />
                    <span className="absolute right-3 text-xs text-stone-400 font-bold">원</span>
                  </div>
                </div>

                {/* Base Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    기본 판매가 (적용 가격) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      value={basePrice || ''}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      placeholder="예: 68000"
                      className="w-full pl-3 pr-8 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 text-stone-800"
                    />
                    <span className="absolute right-3 text-xs text-stone-400 font-bold">원</span>
                  </div>
                </div>
              </div>

              {/* Is Discountable */}
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-800 block">제휴사 기본 할인 상속 여부</span>
                  <p className="text-[10px] text-stone-400">
                    활성화 시 특정 제휴사 룰이 지정되지 않으면 제휴사의 계약 할인율이 기본 적용됩니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDiscountable(!isDiscountable)}
                  className="p-1 hover:opacity-85 text-oak-green transition-opacity shrink-0 cursor-pointer"
                >
                  {isDiscountable ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-stone-400" />
                  )}
                </button>
              </div>

              {/* Period and Day-of-week rate setting - Optional */}
              <div className="border-t border-stone-200 pt-4 space-y-3.5">
                <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-oak-green" />
                  <span>특정 이용 기간 및 요일별 특별가 (선택 사항)</span>
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">적용 시작일</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.8 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">적용 종료일</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.8 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-800 focus:outline-none"
                    />
                  </div>
                </div>

                {(startDate || endDate) && (
                  <div className="grid grid-cols-2 gap-3.5 bg-stone-50/50 p-3 rounded-2xl border border-stone-200 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">주중 요금(원)</label>
                      <input
                        type="number"
                        value={weekdayPrice}
                        onChange={(e) => setWeekdayPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder={`기본: ${basePrice}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">금요일 요금(원)</label>
                      <input
                        type="number"
                        value={fridayPrice}
                        onChange={(e) => setFridayPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder={`기본: ${basePrice}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">토요일 요금(원)</label>
                      <input
                        type="number"
                        value={saturdayPrice}
                        onChange={(e) => setSaturdayPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder={`기본: ${basePrice}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1">스페셜데이 요금(원)</label>
                      <input
                        type="number"
                        value={specialPrice}
                        onChange={(e) => setSpecialPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder={`기본: ${basePrice}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 text-[10px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/50">
                      우선순위: 스페셜데이 &gt; 토요일 &gt; 금요일 &gt; 주중 순으로 결정됩니다.
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-oak-green hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingComponent ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIY ROOM RATE CREATION & EDIT MODAL */}
      {isDiyRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF9F5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 relative">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-oak-green" />
                <span>{editingDiyRate ? 'DIY 객실 기간 요금제 수정' : '신규 DIY 객실 기간 요금제 등록'}</span>
              </h3>
              <button
                onClick={() => setIsDiyRateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiyRate} className="space-y-4">
              
              {/* Room Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  객실 유형 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rateRoomTypeId}
                  onChange={(e) => setRateRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                >
                  {roomTypes.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Range Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">적용 시작일</label>
                  <input
                    type="date"
                    required
                    value={rateStartDate}
                    onChange={(e) => setRateStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">적용 종료일</label>
                  <input
                    type="date"
                    required
                    value={rateEndDate}
                    onChange={(e) => setRateEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Day Price Breakdowns */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">주중 요금 (일~목)</label>
                  <input
                    type="number"
                    required
                    value={rateWeekdayPrice}
                    onChange={(e) => setRateWeekdayPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">금요일 요금 (금)</label>
                  <input
                    type="number"
                    required
                    value={rateFridayPrice}
                    onChange={(e) => setRateFridayPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">토요일 요금 (토)</label>
                  <input
                    type="number"
                    required
                    value={rateSaturdayPrice}
                    onChange={(e) => setRateSaturdayPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">스페셜데이 요금 (특가)</label>
                  <input
                    type="number"
                    required
                    value={rateSpecialPrice}
                    onChange={(e) => setRateSpecialPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">요금 규칙 적용 가동 여부</span>
                <button
                  type="button"
                  onClick={() => setRateIsActive(!rateIsActive)}
                  className="p-1 text-oak-green shrink-0 cursor-pointer"
                >
                  {rateIsActive ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-stone-400" />
                  )}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsDiyRateModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-oak-green hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingDiyRate ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
