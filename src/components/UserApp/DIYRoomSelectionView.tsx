import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomType } from '../../types';
import { DateRoomSelector } from './DateRoomSelector';
import { ArrowLeft, Bed, Users, Maximize, Check, Info, Sparkles, AlertCircle } from 'lucide-react';

interface DIYRoomSelectionViewProps {
  onBack: () => void;
  onSelectRoom: (data: {
    roomType: RoomType;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    guestCount: number;
  }) => void;
}

export const DIYRoomSelectionView: React.FC<DIYRoomSelectionViewProps> = ({
  onBack,
  onSelectRoom,
}) => {
  const { roomTypes } = useApp();

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-stone-900">나만의 DIY 패키지: 객실 선택</h2>
          <p className="text-xs text-stone-500 mt-0.5">원하시는 날짜와 인원을 설정하고, 나만의 패키지에 담을 객실을 선택하세요.</p>
        </div>
      </div>

      {/* Date & Room Selector */}
      <DateRoomSelector
        checkIn={checkIn}
        checkOut={checkOut}
        roomCount={roomCount}
        guestCount={guestCount}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        onRoomCountChange={setRoomCount}
        onGuestCountChange={setGuestCount}
      />

      {/* Room list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">선택 가능한 객실 유형</h3>

        <div className="grid grid-cols-1 gap-5">
          {roomTypes.map((room) => {
            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row"
              >
                {/* Room Image */}
                <div className="w-full md:w-80 h-48 md:h-auto relative shrink-0">
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-xs uppercase tracking-wider">
                    {room.size}
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-extrabold text-stone-900">{room.name}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
                      {room.description}
                    </p>

                    {/* Specifications badges */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <div className="flex items-center gap-1 text-xs text-stone-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-600 font-semibold">
                        <Bed className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.bedType}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-600 font-semibold">
                        <Maximize className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.size}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (No individual prices shown) */}
                  <div className="flex flex-wrap items-center justify-between border-t border-stone-100 pt-4 gap-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {room.amenities.slice(0, 3).map((am, idx) => (
                        <span key={idx} className="text-[10px] bg-stone-50 text-stone-500 border px-2 py-0.5 rounded">
                          {am}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-[10px] text-stone-400 font-semibold">+{room.amenities.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailModalRoom(room)}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        상세정보
                      </button>

                      <button
                        onClick={() =>
                          onSelectRoom({
                            roomType: room,
                            checkIn,
                            checkOut,
                            nights,
                            roomCount,
                            guestCount,
                          })
                        }
                        className="px-5 py-2.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-98"
                      >
                        <span>이 객실로 패키지 구성하기</span>
                        <Sparkles className="w-3.5 h-3.5 text-oak-gold" />
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
                  <span className="font-bold text-stone-900">침대 구성:</span> {detailModalRoom.bedType}
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
