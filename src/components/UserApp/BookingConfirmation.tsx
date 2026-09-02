import React from 'react';
import { Reservation } from '../../types';
import { CheckCircle, Clock, Printer, PlusCircle, Search, Building2, Calendar, User, CreditCard, ShieldCheck, MessageSquare, MapPin, PhoneCall, AlertCircle } from 'lucide-react';

interface BookingConfirmationProps {
  reservation: Reservation;
  onNewBooking: () => void;
  onOpenLookup: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  reservation,
  onNewBooking,
  onOpenLookup,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isPending = reservation.status === 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
      
      {/* Top Banner */}
      {isPending ? (
        <div className="bg-amber-900/90 text-white p-8 rounded-3xl text-center space-y-3 relative overflow-hidden shadow-xl border border-amber-600/40">
          <div className="inline-flex p-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            예약 신청이 접수되었습니다! (대기)
          </h1>

          <p className="text-xs sm:text-sm text-amber-100 font-light max-w-md mx-auto">
            {reservation.partnerName} 우대 혜택으로 접수되었습니다. 관리자 확인 후 예약번호가 발급되면 확정 문자가 발송됩니다.
          </p>

          <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-amber-200 border border-white/20">
            접수번호: {reservation.id} (확정 대기중)
          </div>
        </div>
      ) : (
        <div className="bg-oak-dark text-white p-8 rounded-3xl text-center space-y-3 relative overflow-hidden shadow-xl border border-amber-900/40">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            예약이 최종 확정되었습니다!
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 font-light max-w-md mx-auto">
            {reservation.partnerName} 제휴 우대 혜택이 적용되었으며, 확정 예약번호가 발급되었습니다.
          </p>

          <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300 border border-white/20">
            확정 예약번호: {reservation.pmsReservationNo || reservation.id}
          </div>
        </div>
      )}

      {/* Notification Simulation Alert */}
      <div className="bg-amber-400/10 border border-amber-400/30 p-4 rounded-2xl flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs shrink-0 flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          <span>알림 메시지</span>
        </div>
        <div className="text-xs text-stone-800 space-y-1">
          <p className="font-bold text-stone-900">
            [{reservation.bookerName}] 님께 {isPending ? '예약 신청 접수' : '예약 확정'} 알림이 발송되었습니다.
          </p>
          <p className="text-stone-600 leading-relaxed">
            {isPending ? (
              <>리조트 현장 프론트 배정 및 객실 확인 후 관리자가 예약번호를 등록하면 최종 확정 문자가 발송됩니다. 오픈카드 보증이 완료되어 안전하게 대기 접수되었습니다.</>
            ) : (
              <>체크인 당일 리조트 프론트에서 예약번호({reservation.pmsReservationNo || reservation.id})와 사원증/신분증을 제시해주시면 현장 결제 후 체크인 가능합니다.</>
            )}
          </p>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        
        {/* Receipt Header */}
        <div className="bg-stone-900 text-white p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-oak-gold" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                오크밸리리조트 {isPending ? '예약 신청 접수증' : '예약 확정서'}
              </h3>
              <p className="text-[11px] text-stone-400">Oak Valley Resort Booking Voucher</p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-extrabold bg-amber-950/60 px-3 py-1 rounded-full border border-amber-700/50">
            {reservation.partnerName}
          </span>
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-6 text-stone-800 text-xs">
          
          {/* Section 1: Reservation & Stay Details */}
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 border-b pb-2 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-oak-green" />
              <span>투숙 및 객실 정보</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-stone-500 font-medium block">예약 상태:</span>
                {isPending ? (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    <Clock className="w-3 h-3" /> 대기 (관리자 확인중)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    <CheckCircle className="w-3 h-3" /> 예약 확정 완료
                  </span>
                )}
              </div>
              <div>
                <span className="text-stone-500 font-medium block">
                  {isPending ? '접수번호:' : '확정 예약번호:'}
                </span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {reservation.pmsReservationNo || reservation.id}
                </span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">신청 일시:</span>
                <span className="font-bold text-stone-900">{new Date(reservation.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">선택 패키지:</span>
                <span className="font-bold text-oak-green text-sm">{reservation.packageName}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">객실 타입:</span>
                <span className="font-bold text-stone-900 text-sm">{reservation.roomTypeName}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">입실일 / 퇴실일:</span>
                <span className="font-bold text-stone-900">
                  {reservation.checkIn} ~ {reservation.checkOut} ({reservation.nights}박)
                </span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">객실 수:</span>
                <span className="font-bold text-stone-900">{reservation.roomCount}실</span>
              </div>
            </div>
          </div>

          {/* Section 2: Booker Info */}
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 border-b pb-2 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-oak-green" />
              <span>예약자 정보</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div>
                <span className="text-stone-500 font-medium block">예약자 성명:</span>
                <span className="font-bold text-stone-900 text-sm">{reservation.bookerName}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">휴대폰 번호:</span>
                <span className="font-bold text-stone-900 text-sm">{reservation.bookerPhone}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">이메일:</span>
                <span className="font-bold text-stone-900">{reservation.bookerEmail}</span>
              </div>
              {reservation.specialRequests && (
                <div className="sm:col-span-3 pt-2 border-t border-stone-200">
                  <span className="text-stone-500 font-medium block">요청사항:</span>
                  <span className="font-medium text-stone-800">{reservation.specialRequests}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Payment & Open Card Guarantee */}
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 border-b pb-2 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-oak-green" />
              <span>결제 및 오픈카드 보증 내역</span>
            </h4>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span className="font-bold text-stone-700">현장 결제 예정 금액:</span>
                <span className="text-xl font-black text-oak-dark">
                  {reservation.totalPrice.toLocaleString()}원
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-500">결제 방식:</span>{' '}
                  <span className="font-bold text-emerald-700">현장 후불 결제</span>
                </div>
                <div>
                  <span className="text-stone-500">보증 오픈카드:</span>{' '}
                  <span className="font-bold text-stone-900">
                    {reservation.guaranteeCard.cardType} ({reservation.guaranteeCard.cardNumberMasked})
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">카드 소유자:</span>{' '}
                  <span className="font-bold text-stone-900">{reservation.guaranteeCard.cardholderName}</span>
                </div>
                <div>
                  <span className="text-stone-500">보증 상태:</span>{' '}
                  <span className="font-bold text-emerald-600 flex items-center gap-1 inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>정상 보증 완료</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resort Info Footer */}
          <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-500 space-y-1">
            <div className="flex items-center gap-1 text-stone-700 font-bold">
              <MapPin className="w-3.5 h-3.5 text-oak-gold" />
              <span>오크밸리리조트 위치: 강원특별자치도 원주시 지정면 오크밸리1길 66</span>
            </div>
            <div className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-oak-green" />
              <span>예약 및 모바일 문의: 1588-7676 (운영시간 09:00 ~ 18:00)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-oak-gold" />
          <span>예약 확정서 인쇄 / 저장</span>
        </button>

        <button
          onClick={onOpenLookup}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4 text-oak-green" />
          <span>예약 조회하기</span>
        </button>

        <button
          onClick={onNewBooking}
          className="w-full sm:w-auto px-6 py-3 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-oak-gold" />
          <span>새로운 예약하기</span>
        </button>
      </div>

    </div>
  );
};
