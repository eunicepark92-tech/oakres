import React, { useRef } from 'react';
import { Component, Package, RoomType } from '../../types';
import { useApp } from '../../context/AppContext';
import { OakValleyLogo } from '../Common/OakValleyLogo';
import { FileText, ArrowLeft, RotateCcw, Award, CheckCircle2, DollarSign, Calendar, Sparkles, Printer } from 'lucide-react';

interface DIYQuotationViewProps {
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
  selectedItems: {
    component: Component;
    quantity: number;
    finalPrice: number;
    originalPrice: number;
    totalPrice: number;
    totalOriginalPrice: number;
  }[];
  onBack: () => void;
  onStartOver: () => void;
  onProceedToBooking: () => void;
}

export const DIYQuotationView: React.FC<DIYQuotationViewProps> = ({
  selectedPackage,
  selectedRoom,
  bookingSpecs,
  selectedItems,
  onBack,
  onStartOver,
  onProceedToBooking,
}) => {
  const { currentPartner } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  // Totals calculations
  const diyOriginalTotal = selectedItems.reduce((sum, item) => sum + item.totalOriginalPrice, 0);
  const diyFinalTotal = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const diySavings = diyOriginalTotal - diyFinalTotal;

  const roomOriginalPrice = bookingSpecs.originalTotalPrice;
  const roomDiscountedPrice = bookingSpecs.totalPrice;

  const packageOriginalTotal = roomOriginalPrice + diyOriginalTotal;
  const packageFinalTotal = roomDiscountedPrice + diyFinalTotal;
  const totalSavings = packageOriginalTotal - packageFinalTotal;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-[#B7834A] px-2.5 py-1 rounded-md border border-amber-500/25 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>STEP 4. 선택 구성 및 예상금액 확인</span>
          </span>
          <h2 className="text-xl font-extrabold text-stone-900 mt-1.5 flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-[#B7834A]" />
            <span>나만의 DIY 패키지 견적서</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            선택하신 DIY 구성 및 제휴 우대 금액이 결합된 실시간 단독 견적 명세서입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>구성 변경하기</span>
          </button>

          <button
            onClick={onStartOver}
            className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>새 예약 시작</span>
          </button>

          <button
            onClick={onProceedToBooking}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>이 구성으로 예약하기</span>
          </button>
        </div>
      </div>

      {/* 2. WARNING ALERT NOTICE BOX */}
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 flex items-start gap-3">
        <Award className="w-5 h-5 text-[#B7834A] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-stone-800 space-y-1">
          <p className="font-extrabold text-[#B7834A]">나만의 DIY 패키지 예약 안내</p>
          <p className="font-medium text-stone-600">
            선택하신 DIY 구성(객실 및 추가 컴포넌트)을 확정하고 실시간 예약 신청 단계로 이동할 수 있습니다. 
            아래 '이 구성으로 예약하기' 버튼을 누르시면 예약 신청서 입력 양식으로 바로 연결됩니다.
          </p>
        </div>
      </div>

      {/* 3. PREMIUM PRINTABLE QUOTATION SHEET */}
      <div 
        ref={printRef}
        className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 sm:p-10 space-y-8 font-sans relative overflow-hidden"
      >
        {/* Decorative Watermark background or line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-oak-green via-amber-500 to-oak-green" />

        {/* Invoice Top Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <div className="h-10 flex items-center">
              <OakValleyLogo className="h-8 w-auto text-oak-green" />
            </div>
            <p className="text-[10px] text-stone-400 tracking-wider uppercase font-extrabold">Oak Valley Resort Custom DIY Package</p>
          </div>

          <div className="text-left sm:text-right font-medium">
            <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">OAK VALLEY DIY PROPOSAL</h3>
            <p className="text-xs text-stone-500 mt-1">발행 일시: {todayStr}</p>
            {currentPartner && (
              <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded border border-amber-300 mt-2">
                제휴기관 우대 적용: {currentPartner.name}
              </span>
            )}
          </div>
        </div>

        {/* Guest & Reservation Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 rounded-2xl p-5 border border-stone-100 font-bold text-xs text-stone-700">
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase">기본 객실 예약 정보 (Stay Details)</p>
            <div className="space-y-1.5 font-medium text-stone-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>체크인: <strong className="font-extrabold">{bookingSpecs.checkIn}</strong> ~ 체크아웃: <strong className="font-extrabold">{bookingSpecs.checkOut}</strong> ({bookingSpecs.nights}박)</span>
              </div>
              <p>선택 객실: {selectedRoom.name} ({selectedRoom.size} / 정원 {selectedRoom.capacity}명)</p>
              <p>신청 수량: 객실 {bookingSpecs.roomCount}개</p>
            </div>
          </div>

          <div className="space-y-2 md:border-l md:border-stone-200 md:pl-6">
            <p className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase">제휴사 혜택 기준 (Benefits Apply)</p>
            <div className="space-y-1.5 font-medium text-stone-800">
              <p>제휴 기업명: {currentPartner?.name || '일반'}</p>
              <p>제휴 할인코드: <span className="font-mono">{currentPartner?.code || 'N/A'}</span></p>
              <p>제휴 적용 상태: <span className="text-[#B7834A] font-extrabold">임직원 전용 우대 혜택 적용됨</span></p>
            </div>
          </div>
        </div>

        {/* Itemized Invoice Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-stone-900 tracking-tight uppercase flex items-center gap-1.5">
            <span>나만의 패키지 항목 명세</span>
            <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              총 {selectedItems.length + 1}개 품목
            </span>
          </h4>

          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-extrabold uppercase text-[10px]">
                  <th className="p-4">구분 / 품목명</th>
                  <th className="p-4 text-right">수량 및 구성 상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                
                {/* 1. ROOM STAY ROW */}
                <tr>
                  <td className="p-4">
                    <p className="font-extrabold text-stone-900">{selectedRoom.name} 숙박</p>
                    <span className="text-[10px] text-stone-400 block mt-0.5">({selectedPackage.name})</span>
                  </td>
                  <td className="p-4 text-right font-black text-stone-800">
                    {bookingSpecs.nights}박 x {bookingSpecs.roomCount}실
                  </td>
                </tr>

                {/* 2. DIY COMPONENTS SELECTED */}
                {selectedItems.map((item) => {
                  return (
                    <tr key={item.component.id}>
                      <td className="p-4">
                        <p className="font-extrabold text-stone-900">{item.component.name}</p>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          분류: {
                            item.component.category === 'FB' ? '식음 F&B' :
                            item.component.category === 'ACTIVITY' ? '레저/액티비티' :
                            item.component.category === 'OPTION' ? '객실 옵션' : '고객 혜택/웰컴'
                          }
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-stone-800">
                        {item.quantity}개
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Totals Calculation */}
        <div className="border-t-2 border-stone-200 pt-6 flex flex-col md:flex-row md:items-start justify-between gap-6 font-bold">
          
          <div className="space-y-1.5 text-[11px] text-stone-500 max-w-sm">
            <p className="text-xs font-extrabold text-stone-700">오크밸리 맞춤 패키지 규정</p>
            <p className="leading-relaxed">
              본 견적서는 임시 저장서로 실시간 프로모션 조건이나 잔여 객실 수량 변동에 따라 
              추후 실제 계약 시점에서의 가격 및 인벤토리가 실시간으로 조정될 수 있습니다.
            </p>
          </div>

          <div className="space-y-3 min-w-[280px] self-end bg-[#FAF9F5] p-5 rounded-2xl border border-stone-200">
            <div className="flex justify-between text-stone-500 font-extrabold items-center gap-4 border-b border-stone-200/60 pb-2">
              <span className="text-xs">정상가 합계</span>
              <span className="text-sm font-sans line-through text-stone-400">
                {packageOriginalTotal.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between text-stone-900 font-extrabold items-center gap-4 pt-1">
              <span className="text-xs sm:text-sm">최종 혜택가</span>
              <span className="text-lg sm:text-xl text-rose-600 font-black font-sans">
                {packageFinalTotal.toLocaleString()}원
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. ACTIONS FOR PRINT AND NEXT PLAN */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-white border border-stone-200 rounded-3xl">
        <div className="text-left font-medium">
          <p className="text-xs font-extrabold text-stone-800">이 구성으로 예약을 진행하시겠습니까?</p>
          <p className="text-[11px] text-stone-500 mt-0.5">견적서를 보관용으로 출력/저장하거나, '이 구성으로 예약하기'를 눌러 즉시 예약을 확정해보세요.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none min-h-[44px] px-5 py-2.5 bg-[#FAF9F5] hover:bg-stone-100 border border-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-98"
          >
            <Printer className="w-4 h-4 text-[#B7834A]" />
            <span>견적서 인쇄 / PDF 저장</span>
          </button>

          <button
            onClick={onProceedToBooking}
            className="flex-1 md:flex-none min-h-[44px] px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-white animate-pulse" />
            <span>이 구성으로 예약하기</span>
          </button>
        </div>
      </div>

    </div>
  );
};
