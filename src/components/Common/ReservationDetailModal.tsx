import React, { useState } from 'react';
import { Reservation } from '../../types';
import { useApp } from '../../context/AppContext';
import { getReservationCancellationFeeInfo } from '../../utils/cancellationHelper';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Gift,
  Bed,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Check,
  Lock,
  AlertTriangle,
} from 'lucide-react';

interface ReservationDetailModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onOpenConfirm?: (res: Reservation) => void;
  onOpenCancel?: (res: Reservation) => void;
}

export const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  reservation,
  onClose,
  onOpenConfirm,
  onOpenCancel,
}) => {
  const { currentAdmin, showToast, seasonPeriods, seasonalCancellationRules } = useApp();

  if (!reservation) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isCancelled = reservation.status === 'cancelled';
  const isCancelRequested = reservation.status === 'cancel_requested';
  const isCompleted = !isCancelled && !isCancelRequested && (reservation.checkIn < todayStr || reservation.status === 'completed');
  const isPending = !isCancelled && !isCancelRequested && !isCompleted && reservation.status === 'pending';
  const isConfirmed = !isCancelled && !isCancelRequested && !isCompleted && (reservation.status === 'confirmed' || reservation.status === 'checked_in');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      {/* Compact single-view container fitting inside screen without scroll */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-oak-gold/20 text-oak-gold border border-oak-gold/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">예약 상세 정보</h3>
                <span className="font-mono text-xs text-amber-300 font-bold bg-amber-900/40 px-2 py-0.5 rounded border border-amber-500/30">
                  ID: {reservation.id}
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                한눈에 확인하는 예약자/객실/결제 상세 명세
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Content Body - Structured compact grid */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-stone-800">
          
          {/* Status & PMS Number Banner */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-bold">예약 상태:</span>
              {isPending && (
                <span className="inline-flex items-center gap-1 bg-amber-500 text-stone-950 font-black px-3 py-1 rounded-full shadow-sm text-xs">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>승인 대기중</span>
                </span>
              )}
              {isConfirmed && (
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-black px-3 py-1 rounded-full shadow-sm text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PMS 확정 완료</span>
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 bg-purple-700 text-white font-black px-3 py-1 rounded-full shadow-sm text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>투숙 완료</span>
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-black px-3 py-1 rounded-full shadow-sm text-xs">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>예약 취소됨</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-stone-500 font-bold">PMS 확정번호:</span>
              {reservation.pmsReservationNo ? (
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                    {reservation.pmsReservationNo}
                  </span>
                  {onOpenConfirm && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenConfirm(reservation);
                      }}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-300 rounded font-sans text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      번호 수정
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    미발급 (대기)
                  </span>
                  {onOpenConfirm && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenConfirm(reservation);
                      }}
                      className="px-2 py-0.5 bg-oak-green hover:bg-emerald-800 text-white rounded font-sans text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      번호 발급
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Penalty Warning Alert (If applicable) */}
          {(() => {
            const cancelInfo = getReservationCancellationFeeInfo(reservation, seasonPeriods, seasonalCancellationRules);
            if (isCancelled) return null;
            if (cancelInfo.isInPenaltyPeriod) {
              return (
                <div className="bg-rose-50 border border-rose-300 p-3 rounded-2xl flex items-center justify-between text-xs text-rose-950">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-rose-800">⚠️ 취소 위약금 발생 기간 (입실 {cancelInfo.daysBeforeCheckIn <= 0 ? '당일/경과' : `${cancelInfo.daysBeforeCheckIn}일 전`})</span>
                      <p className="text-[11px] text-rose-900 mt-0.5">
                        시즌: {cancelInfo.seasonLabel} | 위약율: <strong className="font-black text-rose-700">{cancelInfo.penaltyRate}%</strong> (수수료: ₩{cancelInfo.penaltyAmount.toLocaleString()})
                      </p>
                    </div>
                  </div>
                  <span className="bg-rose-200 text-rose-900 font-black text-[11px] px-2.5 py-1 rounded-lg">
                    위약율 {cancelInfo.penaltyRate}%
                  </span>
                </div>
              );
            }
            return (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✅ 무료 취소 가능 기간 (입실 {cancelInfo.daysBeforeCheckIn}일 전 / 위약율 0%)</span>
                </div>
              </div>
            );
          })()}

          {/* Section 1: Booker & Partner Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
              <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5 border-b pb-1.5">
                <User className="w-3.5 h-3.5 text-oak-green" />
                <span>예약자 (투숙 고객) 정보</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">고객 성명:</span>
                  <span className="font-extrabold text-stone-900">{reservation.bookerName} 님</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">휴대폰:</span>
                  <span className="font-bold text-stone-900 font-mono">{reservation.bookerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">이메일:</span>
                  <span className="font-medium text-stone-800 font-mono">{reservation.bookerEmail}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
              <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5 border-b pb-1.5">
                <Building2 className="w-3.5 h-3.5 text-oak-green" />
                <span>제휴사 / 소속 정보</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">제휴사명:</span>
                  <span className="font-extrabold text-amber-900">{reservation.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">제휴 코드:</span>
                  <span className="font-mono font-bold text-stone-800">{reservation.partnerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">신청 일시:</span>
                  <span className="font-mono text-stone-600">{reservation.createdAt}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Package & Room Details */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
            <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5 border-b pb-1.5">
              <Gift className="w-3.5 h-3.5 text-oak-green" />
              <span>상품 및 객실 투숙 정보</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-stone-500">선택 패키지:</span>
                <p className="font-bold text-stone-900">{reservation.packageName}</p>
              </div>
              <div>
                <span className="text-stone-500">원천 객실타입:</span>
                <p className="font-bold text-oak-dark">{reservation.roomTypeName}</p>
              </div>
              <div>
                <span className="text-stone-500">체크인 ~ 체크아웃:</span>
                <p className="font-bold text-stone-900">
                  {reservation.checkIn} ~ {reservation.checkOut} ({reservation.nights}박 / {reservation.roomCount}실)
                </p>
              </div>
              <div>
                <span className="text-stone-500">결제 방식:</span>
                <p className="font-bold text-emerald-800">현장 후불 결제 (체크인 시 결제)</p>
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Price Box */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
              <span className="text-stone-500 font-bold block border-b pb-1">결제 예정 금액</span>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-stone-500">정상가:</span>
                <span className="line-through text-stone-400">{reservation.originalTotalPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-stone-500">임직원 할인:</span>
                <span className="font-bold text-rose-600">-{reservation.discountAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-stone-200">
                <span className="font-extrabold text-stone-900">최종 현장결제액:</span>
                <span className="text-base font-black text-oak-dark">{reservation.totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            {/* Payment & Check-in Info Box */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                <span className="text-stone-900 font-bold flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-oak-green" />
                  <span>결제 및 투숙 안내</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>현장 후불 결제</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">결제 시점:</span>
                  <span className="font-bold text-stone-900">투숙 당일 체크인 시</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">결제 수단:</span>
                  <span className="font-bold text-stone-900">신용카드 / 체크카드 / 현금</span>
                </div>
                <div className="bg-stone-100 p-2 rounded-xl text-[11px] text-stone-600 mt-1">
                  ※ 체크인 시 프론트 데스크에 예약번호 및 제휴사 사원증/증빙을 제시해주시기 바랍니다.
                </div>
              </div>
            </div>

          </div>

          {/* Special Requests */}
          {reservation.specialRequests && (
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-stone-500 font-bold block mb-0.5">특별 요청사항:</span>
              <p className="text-stone-800 font-medium">{reservation.specialRequests}</p>
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {isCancelled && reservation.cancelReason && (
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900">
              <span className="font-bold block mb-0.5">취소 사유:</span>
              <p>{reservation.cancelReason}</p>
            </div>
          )}

        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-stone-50 p-4 px-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer active:scale-98"
          >
            닫기
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {isPending && onOpenConfirm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfirm(reservation);
                }}
                className="min-h-[44px] px-4 py-2.5 bg-oak-green hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <KeyRound className="w-4 h-4" />
                <span>PMS 확정 및 번호 부여</span>
              </button>
            )}

            {isConfirmed && onOpenConfirm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfirm(reservation);
                }}
                className="min-h-[44px] px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-extrabold text-xs rounded-xl border border-emerald-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <KeyRound className="w-4 h-4 text-emerald-800" />
                <span>PMS 확정번호 수정</span>
              </button>
            )}

            {!isCancelled && onOpenCancel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancel(reservation);
                }}
                className="min-h-[44px] px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer active:scale-98"
              >
                예약 취소
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
