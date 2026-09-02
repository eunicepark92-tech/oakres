import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Reservation } from '../../types';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpRight,
  AlertCircle,
  XCircle,
  KeyRound,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { reservations, partners, confirmReservation, cancelReservation } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  // Confirmation Modal State
  const [confirmingRes, setConfirmingRes] = useState<Reservation | null>(null);
  const [pmsInput, setPmsInput] = useState('');

  // Cancellation Modal State
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('객실 수량 부족 (만실)으로 인한 예약 불가');

  const pendingReservations = reservations.filter((r) => r.status === 'pending');
  const confirmedReservations = reservations.filter((r) => r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'completed');
  const cancelledReservations = reservations.filter((r) => r.status === 'cancelled');

  const activeReservations = reservations.filter((r) => r.status !== 'cancelled');
  const totalBookingsCount = confirmedReservations.length;
  const totalRevenue = activeReservations.reduce((acc, cur) => acc + cur.totalPrice, 0);

  // Today check-in count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIns = reservations.filter((r) => r.checkIn === todayStr && r.status !== 'cancelled').length;
  const todayCheckOuts = reservations.filter((r) => r.checkOut === todayStr && r.status !== 'cancelled').length;

  const averageOccupancy = 78.4; // %

  // Filtered Reservations List
  const filteredList = reservations.filter((r) => {
    // Status Filter
    if (statusFilter === 'pending' && r.status !== 'pending') return false;
    if (statusFilter === 'confirmed' && (r.status !== 'confirmed' && r.status !== 'checked_in' && r.status !== 'completed')) return false;
    if (statusFilter === 'cancelled' && r.status !== 'cancelled') return false;

    // Search query
    const q = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      (r.pmsReservationNo && r.pmsReservationNo.toLowerCase().includes(q)) ||
      r.bookerName.toLowerCase().includes(q) ||
      r.partnerName.toLowerCase().includes(q) ||
      r.roomTypeName.toLowerCase().includes(q)
    );
  });

  const handleOpenConfirm = (res: Reservation) => {
    setConfirmingRes(res);
    const dateCompact = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    setPmsInput(`PMS-${dateCompact}-${randDigits}`);
  };

  const handleExecuteConfirm = () => {
    if (!confirmingRes || !pmsInput.trim()) return;
    confirmReservation(confirmingRes.id, pmsInput.trim());
    setConfirmingRes(null);
  };

  const handleExecuteCancel = () => {
    if (!cancellingRes) return;
    cancelReservation(cancellingRes.id, adminCancelReason.trim() || '관리자 취소');
    setCancellingRes(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-oak-green" />
            <span>오크밸리리조트 실시간 예약 및 PMS 승인 대시보드</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            대기중인 예약을 확인하고 PMS 확정 예약번호를 부여하거나, 사유 선택 후 예약을 취소합니다.
          </p>
        </div>

        {pendingReservations.length > 0 && (
          <div className="inline-flex items-center gap-2 bg-amber-500 text-amber-950 font-bold text-xs px-4 py-2 rounded-2xl shadow-sm border border-amber-400 animate-pulse">
            <Clock className="w-4 h-4" />
            <span>확정 대기 건수: {pendingReservations.length}건 처리 필요</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">승인 대기 예약</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-600">{pendingReservations.length}</span>
              <span className="text-xs font-bold text-stone-600">건</span>
            </div>
            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-1">
              <Clock className="w-3 h-3" />
              <span>관리자 예약번호 부여 대기</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">총 누적 확정 예약</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-stone-900">{totalBookingsCount}</span>
              <span className="text-xs font-bold text-stone-600">건</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>전월 대비 +14.2%</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-oak-green/10 text-oak-green flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">총 발생 매출액 (현장)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-oak-dark">
                {Math.round(totalRevenue / 10000).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-stone-600">만원</span>
            </div>
            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>우대할인 적용후 실질 매출</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">오늘 체크인 / 체크아웃</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-700">{todayCheckIns}건</span>
              <span className="text-xs text-stone-400">/</span>
              <span className="text-xl font-black text-stone-600">{todayCheckOuts}건</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3 h-3 text-stone-400" />
              <span>실시간 프론트 현황</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Partner Performance Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-900 border-b pb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-oak-green" />
          <span>제휴사별 예약 점유 비중 (Partner Market Share)</span>
        </h3>

        <div className="space-y-3">
          {partners.map((partner) => {
            const partnerRes = activeReservations.filter((r) => r.partnerCode === partner.code);
            const partnerCount = partnerRes.length;
            const percent = totalBookingsCount > 0 ? Math.round((partnerCount / totalBookingsCount) * 100) : 0;
            const revenue = partnerRes.reduce((acc, cur) => acc + cur.totalPrice, 0);

            return (
              <div key={partner.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-900">{partner.name} ({partner.code})</span>
                  <span className="text-stone-600">
                    {partnerCount}건 ({percent}%) • 매출 {revenue.toLocaleString()}원
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-oak-green rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(8, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notice Banner: Dedicated Reservation Desk link */}
      <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>실시간 예약 승인/취소 및 엑셀 다운로드는 [예약 처리 센터]를 이용해주세요</span>
          </div>
          <p className="text-xs text-stone-300">
            PMS 확정번호 발급, 오픈카드 보증 내역 검토, 예약 취소/환불 집행 및 엑셀(CSV) 다운로드 기능이 전용 화면으로 분리 이동되었습니다.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              const deskBtn = document.querySelector('[data-nav-target="reservation_desk"]') as HTMLElement;
              if (deskBtn) deskBtn.click();
            }}
            className="px-5 py-2.5 bg-oak-gold hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>예약 처리 센터 바로가기</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

