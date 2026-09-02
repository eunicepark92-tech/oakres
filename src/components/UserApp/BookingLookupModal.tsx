import React, { useState } from 'react';
import { Reservation } from '../../types';
import { useApp } from '../../context/AppContext';
import { getReservationCancellationFeeInfo } from '../../utils/cancellationHelper';
import { Search, User, Phone, Calendar, AlertTriangle, XCircle, CheckCircle2, ShieldCheck, Printer, Clock, Building2, AlertCircle } from 'lucide-react';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewConfirmation: (reservation: Reservation) => void;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
  isOpen,
  onClose,
  onViewConfirmation,
}) => {
  const { currentPartner, partners, reservations, cancelReservation, seasonPeriods, seasonalCancellationRules } = useApp();

  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [name, setName] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState<Reservation[]>([]);

  // Cancellation modal state
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen) return null;

  const performSearch = (pCodeInput?: string, nameInput?: string, phoneInput?: string) => {
    setSearchError('');
    const cleanName = (nameInput !== undefined ? nameInput : name).trim();
    const cleanLast4 = (phoneInput !== undefined ? phoneInput : phoneLast4).trim();

    if (!cleanName || !cleanLast4) {
      setSearchError('예약자명과 휴대폰 뒷자리를 입력해주세요.');
      return;
    }

    let targetCode = '';

    if (currentPartner) {
      targetCode = currentPartner.code.toUpperCase();
    } else {
      const inputCode = (pCodeInput !== undefined ? pCodeInput : partnerCodeInput).trim().toUpperCase();
      if (!inputCode) {
        setSearchError('제휴사 코드를 입력해주세요.');
        return;
      }
      const matchedPartner = partners.find((p) => p.code.toUpperCase() === inputCode);
      if (!matchedPartner) {
        setSearchError('존재하지 않거나 유효하지 않은 제휴사 코드입니다.');
        return;
      }
      targetCode = matchedPartner.code.toUpperCase();
    }

    const found = reservations.filter((r) => {
      const matchPartner = r.partnerCode.toUpperCase() === targetCode;
      const matchName = r.bookerName.trim() === cleanName;
      const matchPhone = r.bookerPhoneLast4 === cleanLast4 || r.bookerPhone.slice(-4) === cleanLast4;
      return matchPartner && matchName && matchPhone;
    });

    setResults(found);
    setHasSearched(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleConfirmCancel = () => {
    if (!cancellingRes) return;
    cancelReservation(cancellingRes.id, cancelReason);
    setCancellingRes(null);
    performSearch();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-oak-green/10 text-oak-green">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">예약 조회 및 취소</h3>
              <p className="text-xs text-stone-500">
                {currentPartner
                  ? '예약자명과 휴대폰 번호 뒷자리 4자리를 입력하세요.'
                  : '제휴사 코드, 예약자명, 휴대폰 번호 뒷자리 4자리를 입력하세요.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 font-bold flex items-center justify-center transition-colors shrink-0"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-4">
          
          {currentPartner && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="font-bold text-amber-900">
                  인증된 제휴사: {currentPartner.name} ({currentPartner.code})
                </span>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${currentPartner ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
            
            {!currentPartner && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  제휴사 코드 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={partnerCodeInput}
                    onChange={(e) => {
                      setPartnerCodeInput(e.target.value.toUpperCase());
                      setSearchError('');
                    }}
                    placeholder="예: SAMSUNG2026"
                    className="w-full px-3.5 py-3 bg-white border border-stone-300 rounded-xl text-sm font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                  />
                  <Building2 className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                예약자명 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSearchError('');
                  }}
                  placeholder="예: 홍길동"
                  className="w-full px-3.5 py-3 bg-white border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                휴대폰 번호 뒷자리 4자리 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={phoneLast4}
                  onChange={(e) => {
                    setPhoneLast4(e.target.value.replace(/[^0-9]/g, ''));
                    setSearchError('');
                  }}
                  placeholder="예: 5678"
                  className="w-full px-3.5 py-3 bg-white border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {searchError && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {searchError}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] py-3 bg-oak-green hover:bg-oak-dark text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Search className="w-4 h-4 text-oak-gold" />
            <span>예약 내역 검색하기</span>
          </button>
        </form>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              검색 결과 ({results.length}건)
            </h4>

            {results.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                <XCircle className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700">일치하는 예약 정보를 찾을 수 없습니다.</p>
                <p className="text-xs text-stone-500">작성하신 성함과 휴대폰 번호 뒷자리 4자리를 다시 한번 확인해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((res) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isCancelled = res.status === 'cancelled';
                  const isCompleted = !isCancelled && (res.checkIn < todayStr || res.status === 'completed');
                  const isPending = !isCancelled && !isCompleted && res.status === 'pending';
                  const isConfirmed = !isCancelled && !isCompleted && (res.status === 'confirmed' || res.status === 'checked_in');
                  const cancelInfo = getReservationCancellationFeeInfo(res, seasonPeriods, seasonalCancellationRules);

                  return (
                  <div
                    key={res.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 relative"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md">
                          {res.pmsReservationNo ? `확정번호: ${res.pmsReservationNo}` : `접수번호: ${res.id}`}
                        </span>
                        <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {res.partnerName}
                        </span>
                      </div>

                      {isPending && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>대기 (확정 대기중)</span>
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>예약확정</span>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300 flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                          <span>투숙 완료</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          취소완료
                        </span>
                      )}
                    </div>

                    {/* Cancellation Fee Period Alert Banner (취소 수수료 발생 기간 알림) */}
                    {res.status !== 'cancelled' && (
                      cancelInfo.isInPenaltyPeriod ? (
                        <div className="bg-rose-50 border border-rose-300 p-3.5 rounded-xl text-xs space-y-1.5 text-rose-950 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-extrabold text-rose-700 text-xs">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>⚠️ 취소 위약금 발생 구간입니다</span>
                            </span>
                            <span className="font-mono font-black text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded text-[11px]">
                              위약율 {cancelInfo.penaltyRate}%
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-900 leading-relaxed">
                            입실 잔여일: <strong className="font-bold">{cancelInfo.daysBeforeCheckIn <= 0 ? '입실 당일/경과' : `${cancelInfo.daysBeforeCheckIn}일 전`}</strong> ({cancelInfo.seasonLabel})<br />
                            취소 시 수수료 <strong className="font-black text-rose-700">₩{cancelInfo.penaltyAmount.toLocaleString()}</strong> 부과 (환불 예정액: ₩{cancelInfo.refundAmount.toLocaleString()})
                          </p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl text-xs flex items-center justify-between text-emerald-950">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>✅ 무료 취소 가능 기간 (입실 {cancelInfo.daysBeforeCheckIn}일 전 / 위약율 0%)</span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Content Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-800">
                      <div>
                        <span className="text-stone-500 font-medium block">패키지:</span>
                        <span className="font-bold text-stone-900">{res.packageName}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">객실타입:</span>
                        <span className="font-bold text-stone-900">{res.roomTypeName}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">일정:</span>
                        <span className="font-bold text-oak-dark flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-oak-green" />
                          <span>{res.checkIn} ~ {res.checkOut} ({res.nights}박)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-medium block">현장 결제액:</span>
                        <span className="font-extrabold text-stone-900 text-sm">{res.totalPrice.toLocaleString()}원</span>
                      </div>
                    </div>

                    {/* Open Card Status */}
                    <div className="bg-stone-50 p-3 rounded-xl text-xs flex items-center justify-between text-stone-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>오픈카드 보증: {res.guaranteeCard.cardType} ({res.guaranteeCard.cardNumberMasked})</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2 pt-2 border-t">
                      <button
                        onClick={() => {
                          onClose();
                          onViewConfirmation(res);
                        }}
                        className="min-h-[44px] px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-stone-600" />
                        <span>확정서 보기</span>
                      </button>

                      {(res.status === 'confirmed' || res.status === 'pending') && (
                        <button
                          onClick={() => setCancellingRes(res)}
                          className="min-h-[44px] px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center transition-colors active:scale-98 cursor-pointer"
                        >
                          예약 취소
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cancellation Confirmation Sub-Modal */}
        {cancellingRes && (() => {
          const cancelInfo = getReservationCancellationFeeInfo(cancellingRes, seasonPeriods, seasonalCancellationRules);
          return (
          <div className="fixed inset-0 z-60 bg-stone-950/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-rose-200 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base border-b pb-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>예약 취소 요청 (위약금 안내)</span>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">예약 번호:</span>
                  <span className="font-mono font-bold text-stone-900">{cancellingRes.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">입실 예정일:</span>
                  <span className="font-bold text-stone-900">{cancellingRes.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">총 예약 금액:</span>
                  <span className="font-bold text-stone-900">{cancellingRes.totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${cancelInfo.isInPenaltyPeriod ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
                <div className="font-extrabold flex items-center justify-between">
                  <span>{cancelInfo.isInPenaltyPeriod ? '⚠️ 취소 위약금 발생' : '✅ 100% 무료 취소'}</span>
                  <span className="font-mono font-black text-sm">{cancelInfo.penaltyRate}%</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  구간: {cancelInfo.ruleLabel} ({cancelInfo.seasonLabel})<br />
                  • 취소 수수료: <strong className="font-black text-rose-700">₩{cancelInfo.penaltyAmount.toLocaleString()}</strong><br />
                  • 환불 예정 금액: <strong className="font-black text-emerald-800">₩{cancelInfo.refundAmount.toLocaleString()}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  취소 사유 (선택)
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="예: 개인 일정 변경"
                  className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium min-h-[44px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setCancellingRes(null)}
                  className="flex-1 min-h-[44px] py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors active:scale-98"
                >
                  돌아가기
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 min-h-[44px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors active:scale-98"
                >
                  취소 실행하기
                </button>
              </div>
            </div>
          </div>
          );
        })()}

      </div>
    </div>
  );
};
