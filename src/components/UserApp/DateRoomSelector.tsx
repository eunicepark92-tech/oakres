import React from 'react';
import { Calendar as CalendarIcon, DoorClosed, Users, Clock, Moon, ChevronDown } from 'lucide-react';

interface DateRoomSelectorProps {
  checkIn: string;
  checkOut: string;
  roomCount: number;
  guestCount?: number;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onRoomCountChange: (count: number) => void;
  onGuestCountChange?: (count: number) => void;
  onNightsChange?: (nights: number) => void;
  nights?: number;
}

export const DateRoomSelector: React.FC<DateRoomSelectorProps> = ({
  checkIn,
  checkOut,
  roomCount,
  guestCount = 2,
  onCheckInChange,
  onCheckOutChange,
  onRoomCountChange,
  onGuestCountChange,
  onNightsChange,
  nights: passedNights,
}) => {
  // Calculate Nights
  const checkInDt = new Date(checkIn);
  const checkOutDt = new Date(checkOut);
  const diffTime = Math.max(0, checkOutDt.getTime() - checkInDt.getTime());
  const calculatedNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const nights = passedNights !== undefined ? passedNights : calculatedNights;

  // Handle Check-In Change -> Auto Set Check-Out to Next Day (+1 day)
  const handleCheckInChangeInternal = (newCheckIn: string) => {
    onCheckInChange(newCheckIn);
    
    // Automatically set check-out to check-in + 1 day as requested
    const cinDate = new Date(newCheckIn);
    if (!isNaN(cinDate.getTime())) {
      const nextDay = new Date(cinDate);
      nextDay.setDate(nextDay.getDate() + 1); // 1 night default
      const nextDayStr = nextDay.toISOString().split('T')[0];
      onCheckOutChange(nextDayStr);
      if (onNightsChange) onNightsChange(1);
    }
  };

  // Handle Stay Nights Change -> Update Check-Out to Check-In + N days
  const handleNightsSelect = (selectedNights: number) => {
    const cinDate = new Date(checkIn);
    if (!isNaN(cinDate.getTime())) {
      const nextOut = new Date(cinDate);
      nextOut.setDate(nextOut.getDate() + selectedNights);
      const nextOutStr = nextOut.toISOString().split('T')[0];
      onCheckOutChange(nextOutStr);
      if (onNightsChange) onNightsChange(selectedNights);
    }
  };

  // Handle Check-Out Date Direct Picker
  const handleCheckOutChangeInternal = (newCheckOut: string) => {
    const cinDate = new Date(checkIn);
    const coutDate = new Date(newCheckOut);

    if (coutDate <= cinDate) {
      // Force at least 1 night
      const minNext = new Date(cinDate);
      minNext.setDate(minNext.getDate() + 1);
      const minNextStr = minNext.toISOString().split('T')[0];
      onCheckOutChange(minNextStr);
      if (onNightsChange) onNightsChange(1);
    } else {
      onCheckOutChange(newCheckOut);
      const diff = Math.ceil((coutDate.getTime() - cinDate.getTime()) / (1000 * 60 * 60 * 24));
      if (onNightsChange) onNightsChange(diff);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-md p-4 sm:p-6 mb-8">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Date Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 flex-1">
          
          {/* 1. Check-In */}
          <div className="bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200/80 hover:border-stone-300 transition-colors flex flex-col justify-center">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <CalendarIcon className="w-3.5 h-3.5 text-oak-green" />
              <span>입실일 (Check-In)</span>
            </label>
            <input
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={(e) => handleCheckInChangeInternal(e.target.value)}
              className="w-full bg-transparent font-bold text-stone-900 text-sm focus:outline-none cursor-pointer min-h-[38px] sm:min-h-[32px] py-1"
            />
          </div>

          {/* 2. Check-Out */}
          <div className="bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200/80 hover:border-stone-300 transition-colors flex flex-col justify-center">
            <label className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <CalendarIcon className="w-3.5 h-3.5 text-oak-green" />
              <span>퇴실일 (Check-Out)</span>
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => handleCheckOutChangeInternal(e.target.value)}
              className="w-full bg-transparent font-bold text-stone-900 text-sm focus:outline-none cursor-pointer min-h-[38px] sm:min-h-[32px] py-1"
            />
          </div>

          {/* 3. Stay Duration (박수 선택 - 변경 시 퇴실일 자동 변경) */}
          <div className="bg-amber-50/80 p-3 sm:p-3.5 rounded-xl border border-amber-200/90 hover:border-amber-300 transition-colors flex flex-col justify-center">
            <label className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Moon className="w-3.5 h-3.5 text-amber-700" />
              <span>숙박 기간 (박수)</span>
            </label>
            <div className="relative">
              <select
                value={nights}
                onChange={(e) => handleNightsSelect(Number(e.target.value))}
                className="w-full bg-transparent font-black text-amber-950 text-sm focus:outline-none cursor-pointer appearance-none pr-6 min-h-[38px] sm:min-h-[32px] py-1"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 30].map((num) => (
                  <option key={num} value={num}>
                    {num}박 ({num + 1}일)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-amber-800 absolute right-1 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 4. Room Count */}
          <div className="bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-center">
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <DoorClosed className="w-3.5 h-3.5 text-oak-green" />
              <span>객실 수 (Rooms)</span>
            </label>
            <select
              value={roomCount}
              onChange={(e) => onRoomCountChange(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-stone-900 text-sm focus:outline-none cursor-pointer min-h-[38px] sm:min-h-[32px] py-1"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}개 객실
                </option>
              ))}
            </select>
          </div>

          {/* 5. Guests */}
          <div className="bg-stone-50 p-3 sm:p-3.5 rounded-xl border border-stone-200/80 flex flex-col justify-center">
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-oak-green" />
              <span>투숙 인원 (Guests)</span>
            </label>
            <select
              value={guestCount}
              onChange={(e) => onGuestCountChange && onGuestCountChange(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-stone-900 text-sm focus:outline-none cursor-pointer min-h-[38px] sm:min-h-[32px] py-1"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                <option key={num} value={num}>
                  성인 {num}인
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>
    </div>
  );
};
