import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Component, ComponentCategory, Package, RoomType } from '../../types';
import { calculateComponentPrice, getComponentBasePriceForDate } from '../../utils/pricing';
import { Layers, ArrowLeft, ArrowRight, ShoppingCart, Percent, ChevronRight, HelpCircle, Check, Sparkles, Plus, Minus, Info, AlertTriangle } from 'lucide-react';

interface DIYSelectionViewProps {
  selectedPackage: Package;
  selectedRoom: RoomType;
  bookingSpecs: {
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
  };
  onBack: () => void;
  onProceedToQuotation: (selectedItems: { component: Component; quantity: number; finalPrice: number }[]) => void;
  onProceedToNormalBooking: () => void;
}

export const DIYSelectionView: React.FC<DIYSelectionViewProps> = ({
  selectedPackage,
  selectedRoom,
  bookingSpecs,
  onBack,
  onProceedToQuotation,
  onProceedToNormalBooking,
}) => {
  const { components, partnerComponentRules, currentPartner, specialDays } = useApp();

  // Selected DIY Component state: key: componentId, value: quantity
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Defined 4 Categories
  const CATEGORIES: { value: ComponentCategory; label: string; desc: string; emoji: string }[] = [
    { value: 'FB', label: '식음 F&B', desc: '조식뷔페, 바베큐 가든, 다이닝 등 풍성한 미식 옵션', emoji: '🍽️' },
    { value: 'ACTIVITY', label: '레저/액티비티', desc: '바운스 슈퍼파크, 사우나, 수영장 등 다이나믹 활동', emoji: '⛷️' },
    { value: 'OPTION', label: '객실 옵션', desc: '체크아웃 연장, 뷰 업그레이드 등 머무름의 극대화', emoji: '🛌' },
    { value: 'BENEFIT', label: '고객 혜택/웰컴', desc: '웰컴 기프트, 기념품 등 오크밸리가 드리는 정성', emoji: '🎁' },
  ];

  const [activeTab, setActiveTab] = useState<ComponentCategory>('FB');

  // Filter components: isActive = true, not ROOM/GOLF, and isVisible under partnerComponentRules
  const visibleComponents = useMemo(() => {
    return components.filter((comp) => {
      // Exclude ROOM and GOLF
      if (comp.category === 'ROOM' || comp.category === 'GOLF') return false;
      // Only active ones
      if (!comp.isActive) return false;

      // Filter by partner visibility rule
      if (currentPartner) {
        const rule = partnerComponentRules.find(
          (r) => r.partnerId === currentPartner.id && r.componentId === comp.id
        );
        if (rule && !rule.isVisible) {
          return false; // Hidden for this partner
        }
      }
      return true;
    });
  }, [components, partnerComponentRules, currentPartner]);

  // Group visible components by category
  const categorizedComponents = useMemo(() => {
    const map: Record<ComponentCategory, Component[]> = {
      FB: [],
      ACTIVITY: [],
      OPTION: [],
      BENEFIT: [],
      ROOM: [],
      GOLF: [],
    };
    visibleComponents.forEach((comp) => {
      if (map[comp.category]) {
        map[comp.category].push(comp);
      }
    });
    return map;
  }, [visibleComponents]);

  // Adjust item quantity
  const handleQuantityChange = (componentId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[componentId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const updated = { ...prev };
        delete updated[componentId];
        return updated;
      }
      return { ...prev, [componentId]: next };
    });
  };

  // Check if component is selected
  const isSelected = (componentId: string) => {
    return (selectedQuantities[componentId] || 0) > 0;
  };

  // Pricing priority calculation for visible components
  const componentPrices = useMemo(() => {
    const pricesMap: Record<string, { price: number; normalPrice: number; ruleApplied: string; hasDiscount: boolean }> = {};
    
    visibleComponents.forEach((comp) => {
      if (!currentPartner) return;
      const calc = calculateComponentPrice(comp, currentPartner, partnerComponentRules, specialDays, bookingSpecs.checkIn);
      let normalPrice = getComponentBasePriceForDate(comp, bookingSpecs.checkIn, specialDays);
      if (!(comp.startDate && comp.endDate && bookingSpecs.checkIn >= comp.startDate && bookingSpecs.checkIn <= comp.endDate)) {
        if (comp.normalPrice) {
          normalPrice = comp.normalPrice;
        }
      }
      const hasDiscount = calc.price < normalPrice;

      pricesMap[comp.id] = {
        price: calc.price,
        normalPrice,
        ruleApplied: calc.ruleApplied,
        hasDiscount,
      };
    });

    return pricesMap;
  }, [visibleComponents, currentPartner, partnerComponentRules, specialDays, bookingSpecs.checkIn]);

  // Active items package mapping
  const selectedItemsDetails = useMemo(() => {
    return Object.entries(selectedQuantities).map(([id, qty]) => {
      const comp = components.find((c) => c.id === id)!;
      const priceDetails = componentPrices[id] || { price: comp.basePrice, normalPrice: comp.basePrice, hasDiscount: false };
      const quantityNum = Number(qty);
      return {
        component: comp,
        quantity: quantityNum,
        finalPrice: priceDetails.price,
        originalPrice: priceDetails.normalPrice,
        totalPrice: priceDetails.price * quantityNum,
        totalOriginalPrice: priceDetails.normalPrice * quantityNum,
      };
    });
  }, [selectedQuantities, components, componentPrices]);

  // Totals calculations
  const diyOriginalTotal = selectedItemsDetails.reduce((sum, item) => sum + item.totalOriginalPrice, 0);
  const diyFinalTotal = selectedItemsDetails.reduce((sum, item) => sum + item.totalPrice, 0);
  const diySavings = diyOriginalTotal - diyFinalTotal;

  const roomOriginalPrice = bookingSpecs.originalTotalPrice;
  const roomDiscountedPrice = bookingSpecs.totalPrice;

  const packageOriginalTotal = roomOriginalPrice + diyOriginalTotal;
  const packageFinalTotal = roomDiscountedPrice + diyFinalTotal;
  const totalSavings = packageOriginalTotal - packageFinalTotal;

  // Handles moving forward
  const handleProceed = () => {
    onProceedToQuotation(selectedItemsDetails);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-oak-green/10 text-oak-green px-2.5 py-1 rounded-md border border-oak-green/20">
            STEP 3. 나만의 패키지 옵션 추가
          </span>
          <h2 className="text-xl font-extrabold text-stone-900 mt-1.5 flex items-center gap-2">
            <Layers className="w-5.5 h-5.5 text-oak-green" />
            <span>나만의 맞춤 DIY 패키지 만들기</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            오크밸리의 미식(F&B), 짜릿한 액티비티, 체크아웃 연장 등을 원하는 수량만큼 골라담아 세상에 하나뿐인 나만의 단독 패키지를 설계해 보세요.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>객실선택 돌아가기</span>
          </button>

          <button
            onClick={onProceedToNormalBooking}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            title="DIY 옵션 없이 객실만 기존 예약"
          >
            <span>객실만 바로 예약하기</span>
          </button>
        </div>
      </div>

      {/* 2. CHOSEN ROOM BRIEF SUMMARY BANNER */}
      <div className="bg-[#FAF9F5] border border-[#B7834A]/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#B7834A]/10 text-[#B7834A] border border-[#B7834A]/20 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
              기본 숙박 선택 완료
            </span>
            <span className="text-xs text-stone-500 font-bold">
              {bookingSpecs.checkIn} ~ {bookingSpecs.checkOut} ({bookingSpecs.nights}박) • 객실 {bookingSpecs.roomCount}개
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-stone-800">
            {selectedPackage.name} - {selectedRoom.name}
          </h3>
        </div>
      </div>

      {/* 3. MAIN SECTION WITH CATEGORIES & STICKY SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT CATEGORIES */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-3">
            {CATEGORIES.map((cat) => {
              const list = categorizedComponents[cat.value] || [];
              const selectedCount = list.filter((c) => isSelected(c.id)).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveTab(cat.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    activeTab === cat.value
                      ? 'bg-oak-green text-white border-oak-green shadow-xs'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                    activeTab === cat.value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {list.length}
                  </span>
                  {selectedCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Category Header Description */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-2xl pt-0.5">
              {CATEGORIES.find((c) => c.value === activeTab)?.emoji}
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-stone-700">
                {CATEGORIES.find((c) => c.value === activeTab)?.label}
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                {CATEGORIES.find((c) => c.value === activeTab)?.desc}
              </p>
            </div>
          </div>

          {/* List of Products inside selected Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(categorizedComponents[activeTab] || []).length === 0 ? (
              <div className="col-span-2 text-center py-12 border border-stone-200 border-dashed rounded-3xl space-y-2">
                <p className="text-xs text-stone-400 font-bold">노출 가능한 DIY 상품이 없습니다.</p>
                <p className="text-[11px] text-stone-400">관리자 화면에서 {CATEGORIES.find((c) => c.value === activeTab)?.label} 상품을 등록 및 활성화하십시오.</p>
              </div>
            ) : (
              categorizedComponents[activeTab].map((comp) => {
                const qty = selectedQuantities[comp.id] || 0;
                const priceInfo = componentPrices[comp.id] || { price: comp.basePrice, normalPrice: comp.basePrice, hasDiscount: false };
                const selected = qty > 0;

                return (
                  <div
                    key={comp.id}
                    className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-5 relative overflow-hidden group ${
                      selected
                        ? 'border-oak-green ring-2 ring-oak-green/10 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Top corner design indicator */}
                    {selected && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-oak-green text-white flex items-center justify-center rounded-bl-xl">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        {/* Name and tags */}
                        <h4 className="text-xs font-black text-stone-900 group-hover:text-oak-green transition-colors pr-6">
                          {comp.name}
                        </h4>
                        
                        {comp.description ? (
                          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed line-clamp-2">
                            {comp.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-stone-300 italic mt-1">상세설명이 없습니다.</p>
                        )}
                      </div>

                      {comp.tags && comp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {comp.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] bg-stone-50 text-stone-400 border px-1.5 py-0.2 rounded font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                     <div className="mt-5 pt-3.5 border-t border-stone-100/80 flex items-center justify-between gap-4">
                      {/* Show regular price during selection */}
                      <div className="space-y-0.5">
                        <span className="text-xs text-stone-900 font-extrabold block">
                          정상가 {priceInfo.normalPrice.toLocaleString()}원
                        </span>
                      </div>

                      {/* Add/Remove/Qty Counter Controls */}
                      <div className="shrink-0">
                        {!selected ? (
                          <button
                            onClick={() => handleQuantityChange(comp.id, 1)}
                            className="min-h-[36px] px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>담기</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2.5 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1">
                            <button
                              onClick={() => handleQuantityChange(comp.id, -1)}
                              className="p-1 hover:bg-stone-200 rounded text-stone-600 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            
                            <span className="text-xs font-extrabold text-stone-800 min-w-3 text-center">
                              {qty}
                            </span>

                            <button
                              onClick={() => handleQuantityChange(comp.id, 1)}
                              className="p-1 hover:bg-stone-200 rounded text-stone-600 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME STICKY ESTIMATION CARD */}
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-5">
            
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-oak-green" />
                <span>MY PACKAGE</span>
              </h3>
            </div>

            {/* Selected Breakdown */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {/* Room details */}
              <div className="border-b border-dashed border-stone-100 pb-2">
                <span className="font-extrabold text-xs text-stone-800 block">
                  {selectedRoom.name} / {bookingSpecs.nights}박
                </span>
              </div>

              {/* Inclusions / Chosen configuration list */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  포함 구성
                </span>
                {selectedItemsDetails.length === 0 ? (
                  <p className="text-[11px] text-stone-400 italic">선택한 추가 상품이 없습니다.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedItemsDetails.map((item) => (
                      <div key={item.component.id} className="text-xs text-stone-700 flex justify-between">
                        <span>- {item.component.name}</span>
                        <span className="font-bold text-stone-500 shrink-0">
                          {item.quantity}개
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Price Calculations Summary Box */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/60 space-y-1 font-bold">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                패키지 최종금액
              </span>
              <span className="text-xl text-rose-600 font-black">
                {packageFinalTotal.toLocaleString()}원
              </span>
            </div>

            {/* Checkout Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleProceed}
                disabled={selectedItemsDetails.length === 0}
                className={`w-full min-h-[44px] py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  selectedItemsDetails.length === 0
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-200'
                    : 'bg-oak-green text-white hover:bg-emerald-800'
                }`}
              >
                <span>나만의 DIY 패키지 견적 확인</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-stone-400 text-center font-medium leading-relaxed">
                * 이번 단계에서는 실제 예약 데이터 생성을 차단한 상태로<br />
                실시간 맞춤형 견적서 확인 및 계산서 미리보기만 가능합니다.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
