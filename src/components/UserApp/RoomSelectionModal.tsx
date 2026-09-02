import React, { useState } from 'react';
import { Package, RoomType } from '../../types';
import { useApp } from '../../context/AppContext';
import { DateRoomSelector } from './DateRoomSelector';
import { ArrowLeft, CheckCircle2, Bed, Users, Maximize, Check, Info, Sparkles, AlertCircle } from 'lucide-react';

interface RoomSelectionModalProps {
  selectedPackage: Package;
  onBack: () => void;
  onSelectRoom: (data: {
    roomType: RoomType;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
  }) => void;
}

export const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  selectedPackage,
  onBack,
  onSelectRoom,
}) => {
  const { roomTypes, dailyRates, currentPartner } = useApp();

  // Date State defaults to tomorrow and +1 night
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(tomorrowStr);
  const [checkOut, setCheckOut] = useState<string>(dayAfterTomorrowStr);
  const [roomCount, setRoomCount] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(2);

  const [detailModalRoom, setDetailModalRoom] = useState<RoomType | null>(null);

  // Calculate Nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const discountRate = currentPartner?.discountRate || 30;

  // Calculate Price for Room
  const getRoomPriceInfo = (room: RoomType) => {
    // Sum daily rates across selected checkIn -> checkOut range
    let totalPrice = 0;
    let minStock = 99;

    for (let i = 0; i < nights; i++) {
      const d = new Date(checkInDate);
      d.setDate(checkInDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const rateObj = dailyRates.find(
        (r) => r.packageId === selectedPackage.id && r.roomTypeId === room.id && r.date === dateStr
      );

      let basePrice = selectedPackage.basePrice;
      if (room.id === 'room-golf-48') basePrice = selectedPackage.basePrice * 1.5;
      if (room.id === 'room-caravan') basePrice = selectedPackage.basePrice * 1.1;
      if (room.id === 'room-museum-penthouse') basePrice = selectedPackage.basePrice * 2.4;

      const dayPrice = rateObj ? rateObj.price : basePrice;
      const dayStock = rateObj ? rateObj.stock : 5;

      totalPrice += dayPrice;
      if (dayStock < minStock) minStock = dayStock;
    }

    const discountedNightPrice = Math.round((totalPrice * (100 - discountRate)) / 100);
    const totalDiscountedPrice = discountedNightPrice * roomCount;
    const totalOriginalPrice = Math.round(totalPrice * 1.4) * roomCount;
    const discountAmount = totalOriginalPrice - totalDiscountedPrice;

    return {
      totalDiscountedPrice,
      totalOriginalPrice,
      discountAmount,
      minStock,
      avgPerNight: Math.round(totalDiscountedPrice / nights),
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Back Button & Package Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <button
          onClick={onBack}
          className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>패키지 목록으로</span>
        </button>

        <div className="text-left sm:text-right">
          <span className="text-[11px] font-bold text-oak-green bg-oak-green/10 px-2.5 py-0.5 rounded-full border border-oak-green/20">
            선택한 패키지
          </span>
          <h2 className="text-base sm:text-xl font-extrabold text-stone-900 mt-0.5">
            {selectedPackage.name}
          </h2>
        </div>
      </div>

      {/* Date & Room Count Selector */}
      <DateRoomSelector
        checkIn={checkIn}
        checkOut={checkOut}
        roomCount={roomCount}
        guestCount={guestCount}
        onCheckInChange={(d) => {
          setCheckIn(d);
          const cinDate = new Date(d);
          if (!isNaN(cinDate.getTime())) {
            const nextDay = new Date(cinDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setCheckOut(nextDay.toISOString().split('T')[0]);
          }
        }}
        onCheckOutChange={(d) => setCheckOut(d)}
        onRoomCountChange={(c) => setRoomCount(c)}
        onGuestCountChange={(g) => setGuestCount(g)}
        nights={nights}
      />

      {/* Available Room Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <span>예약 가능 객실 목록</span>
            <span className="text-xs text-oak-green font-semibold bg-oak-green/10 px-2 py-0.5 rounded-md">
              {roomTypes.length}개 객실타입
            </span>
          </h3>
          <p className="text-xs text-stone-500">
            제휴사 {discountRate}% 우대 할인이 적용된 최종 요금입니다.
          </p>
        </div>

        <div className="space-y-6">
          {roomTypes.map((room) => {
            const priceInfo = getRoomPriceInfo(room);
            const isSoldOut = priceInfo.minStock <= 0;

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0"
              >
                {/* Room Photo */}
                <div className="md:col-span-5 relative h-56 md:h-auto bg-stone-100">
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-stone-100 font-medium text-xs px-2.5 py-1 rounded-lg border border-white/20">
                    {room.size}
                  </div>
                </div>

                {/* Room Details & Pricing */}
                <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-stone-900 leading-tight">
                          {room.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {room.description}
                        </p>
                      </div>

                      {/* Stock Badge */}
                      <div className="shrink-0">
                        {isSoldOut ? (
                          <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-1 rounded-md">
                            마감
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-md border border-emerald-200">
                            잔여 {priceInfo.minStock}실
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room Meta Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-oak-green" />
                        <span className="font-medium">{room.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-oak-green" />
                        <span className="font-medium truncate">{room.bedType}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Maximize className="w-3.5 h-3.5 text-oak-green" />
                        <span className="font-medium">{room.size}</span>
                      </div>
                    </div>

                    {/* Inclusions Detail Preview */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        포함 사항 (Package Inclusions)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPackage.inclusions.map((inc, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-800 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                          >
                            <Check className="w-3 h-3 text-oak-gold" />
                            <span>{inc}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Room Pricing & Action */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 line-through">
                          정가 {priceInfo.totalOriginalPrice.toLocaleString()}원
                        </span>
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {discountRate}% 할인 적용
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-oak-dark">
                          {priceInfo.totalDiscountedPrice.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-stone-800">원</span>
                        <span className="text-xs text-stone-500 font-normal">
                          ({nights}박 x {roomCount}실 총액)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                      {/* Detailed Info Button */}
                      <button
                        onClick={() => setDetailModalRoom(room)}
                        className="min-h-[44px] px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 active:scale-98"
                      >
                        <Info className="w-4 h-4 text-stone-600" />
                        <span>상세정보</span>
                      </button>

                      {/* Select Button */}
                      <button
                        disabled={isSoldOut}
                        onClick={() =>
                          onSelectRoom({
                            roomType: room,
                            checkIn,
                            checkOut,
                            nights,
                            roomCount,
                            totalPrice: priceInfo.totalDiscountedPrice,
                            originalTotalPrice: priceInfo.totalOriginalPrice,
                            discountAmount: priceInfo.discountAmount,
                          })
                        }
                        className={`min-h-[44px] px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98 ${
                          isSoldOut
                            ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                            : 'bg-oak-green hover:bg-oak-dark text-white'
                        }`}
                      >
                        <span>예약 정보 입력</span>
                        <Sparkles className="w-4 h-4 text-oak-gold" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Room Detail Info Modal */}
      {detailModalRoom && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-xl font-bold text-stone-900">
                {detailModalRoom.name} 상세정보
              </h3>
              <button
                onClick={() => setDetailModalRoom(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-800 font-bold text-lg rounded-xl hover:bg-stone-100 transition-colors"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <img
              src={detailModalRoom.imageUrl}
              alt={detailModalRoom.name}
              className="w-full h-56 object-cover rounded-xl"
            />

            <div className="space-y-4 text-xs text-stone-700">
              <div>
                <h4 className="font-bold text-sm text-stone-900 mb-1">객실 개요</h4>
                <p className="text-stone-600 leading-relaxed">{detailModalRoom.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-xl border">
                <div>
                  <span className="font-bold text-stone-900">기준/최대인원:</span> {detailModalRoom.capacity}
                </div>
                <div>
                  <span className="font-bold text-stone-900">객실 면적:</span> {detailModalRoom.size}
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-stone-900">침대 구구성:</span> {detailModalRoom.bedType}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-stone-900 mb-2">객실 구비 시설 (Amenities)</h4>
                <div className="flex flex-wrap gap-2">
                  {detailModalRoom.amenities.map((am, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-200"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-900">
                  <AlertCircle className="w-4 h-4" />
                  <span>투숙 및 이용 안내</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  • 체크인 15:00부터 / 체크아웃 11:00까지<br />
                  • 제휴사 임직원 본인 확인을 위해 입실 시 사원증 또는 명함 제시가 요구될 수 있습니다.<br />
                  • 전 객실 금연입니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDetailModalRoom(null)}
              className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
