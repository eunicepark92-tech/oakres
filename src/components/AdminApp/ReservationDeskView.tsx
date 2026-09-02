import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Reservation } from '../../types';
import { ReservationDetailModal } from '../Common/ReservationDetailModal';
import { SPREADSHEET_URL } from '../../services/googleDriveSheets';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  CreditCard,
  Building2,
  Calendar,
  User,
  Phone,
  FileSpreadsheet,
  Filter,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  Table,
  ExternalLink,
  Shield,
  CloudUpload,
  Edit3,
} from 'lucide-react';

export const ReservationDeskView: React.FC = () => {
  const {
    reservations,
    partners,
    confirmReservation,
    cancelReservation,
    hasPermission,
    showToast,
    sheetSyncStatus,
    syncGoogleSheetReservations,
    isGoogleConnected,
    connectGoogle,
    googleUser,
  } = useApp();
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const canViewUnmaskedCard = hasPermission('canViewUnmaskedCard');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedPartnerCode, setSelectedPartnerCode] = useState<string>('ALL');

  // Detail Modal State
  const [viewDetailRes, setViewDetailRes] = useState<Reservation | null>(null);

  // Confirmation Modal State
  const [confirmingRes, setConfirmingRes] = useState<Reservation | null>(null);
  const [pmsInput, setPmsInput] = useState('');

  // Cancellation Modal State
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('객실 수량 부족 (만실)으로 인한 예약 불가');

  // Open-Card Inspector Modal State
  const [inspectCardRes, setInspectCardRes] = useState<Reservation | null>(null);

  // Today Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Logic
  const filteredList = reservations.filter((r) => {
    const isCancelled = r.status === 'cancelled';
    const isCompleted = !isCancelled && (r.checkIn < todayStr || r.status === 'completed');
    const isPending = !isCancelled && !isCompleted && r.status === 'pending';
    const isConfirmed = !isCancelled && !isCompleted && (r.status === 'confirmed' || r.status === 'checked_in');

    if (statusFilter === 'pending' && !isPending) return false;
    if (statusFilter === 'confirmed' && !isConfirmed) return false;
    if (statusFilter === 'completed' && !isCompleted) return false;
    if (statusFilter === 'cancelled' && !isCancelled) return false;

    // Partner Filter
    if (selectedPartnerCode !== 'ALL' && r.partnerCode !== selectedPartnerCode) return false;

    // Search query
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    return (
      r.id.toLowerCase().includes(q) ||
      (r.pmsReservationNo && r.pmsReservationNo.toLowerCase().includes(q)) ||
      r.bookerName.toLowerCase().includes(q) ||
      r.bookerPhone.includes(q) ||
      r.partnerName.toLowerCase().includes(q) ||
      r.packageName.toLowerCase().includes(q) ||
      r.roomTypeName.toLowerCase().includes(q)
    );
  });

  // KPI Calculations
  const pendingCount = reservations.filter((r) => r.status !== 'cancelled' && r.checkIn >= todayStr && r.status === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status !== 'cancelled' && r.checkIn >= todayStr && (r.status === 'confirmed' || r.status === 'checked_in')).length;
  const completedCount = reservations.filter((r) => r.status !== 'cancelled' && (r.checkIn < todayStr || r.status === 'completed')).length;
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length;
  const totalRevenue = reservations
    .filter((r) => r.status !== 'cancelled')
    .reduce((acc, cur) => acc + cur.totalPrice, 0);

  // PMS Confirmation Handler
  const handleOpenConfirm = (res: Reservation) => {
    setConfirmingRes(res);
    setPmsInput(res.pmsReservationNo || '');
  };

  const handleExecuteConfirm = () => {
    if (!confirmingRes || !pmsInput.trim()) return;
    confirmReservation(confirmingRes.id, pmsInput.trim());
    setConfirmingRes(null);
  };

  // Cancellation Handler
  const handleExecuteCancel = () => {
    if (!cancellingRes) return;
    cancelReservation(cancellingRes.id, adminCancelReason.trim() || '예약실 취소 처리');
    setCancellingRes(null);
  };

  // Excel (CSV) Download Handler
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      showToast('다운로드할 예약 내역이 존재하지 않습니다.', 'error');
      return;
    }

    const csvHeaders = [
      '예약번호(시스템)',
      'PMS확정번호',
      '제휴사코드',
      '제휴사명',
      '예약자명',
      '연락처',
      '이메일',
      '패키지명',
      '원천 객실타입',
      '체크인',
      '체크아웃',
      '박수',
      '객실수',
      '최종결제예정액(원)',
      '할인금액(원)',
      '보증카드(카드사)',
      '보증카드(번호)',
      '예약상태',
      '신청일시',
      'PMS확정일시',
    ].join(',');

    const csvRows = filteredList.map((r) => {
      const isCancelled = r.status === 'cancelled';
      const isCompleted = !isCancelled && (r.checkIn < todayStr || r.status === 'completed');
      const statusLabel = isCancelled
        ? '취소완료'
        : isCompleted
        ? '투숙완료'
        : r.status === 'pending'
        ? '승인대기'
        : 'PMS확정';

      return [
        `"${r.id}"`,
        `"${r.pmsReservationNo || '-'}"`,
        `"${r.partnerCode}"`,
        `"${r.partnerName.replace(/"/g, '""')}"`,
        `"${r.bookerName}"`,
        `"${r.bookerPhone}"`,
        `"${r.bookerEmail}"`,
        `"${r.packageName.replace(/"/g, '""')}"`,
        `"${r.roomTypeName.replace(/"/g, '""')}"`,
        `"${r.checkIn}"`,
        `"${r.checkOut}"`,
        r.nights,
        r.roomCount,
        r.totalPrice,
        r.discountAmount,
        `"${r.guaranteeCard?.cardType || '-'}"`,
        `"${r.guaranteeCard?.cardNumberMasked || '-'}"`,
        `"${statusLabel}"`,
        `"${r.createdAt}"`,
        `"${r.confirmedAt || '-'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `오크밸리리조트_예약처리목록_${dateStr}.csv`;
    a.click();
    showToast(`총 ${filteredList.length}건의 예약 내역이 엑셀(CSV) 파일로 추출되었습니다.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-oak-green" />
            <span>오크밸리리조트 예약 처리 센터 (Reservation Desk)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            제휴사 임직원의 실시간 예약 신청 내역을 검토하고 Google Sheet 실시간 자동 동기화 및 PMS 번호 발급을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
            title="구글 시트 예약 누적 적재 시트 바로가기"
          >
            <Table className="w-4 h-4 text-emerald-700" />
            <span>구글 시트 열기</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
          </a>

          <button
            onClick={async () => {
              setIsSyncingSheets(true);
              await syncGoogleSheetReservations();
              setIsSyncingSheets(false);
            }}
            disabled={isSyncingSheets}
            className="min-h-[44px] px-3.5 py-2.5 bg-[#B7834A] hover:bg-[#A06E39] text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0 active:scale-98"
            title="모든 예약을 구글 시트에 즉시 누적 동기화"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>구글 시트 동기화</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="min-h-[44px] px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV 다운로드 ({filteredList.length}건)</span>
          </button>
        </div>
      </div>

      {/* Google Sheet Live Sync Status Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-stone-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Table className="w-4 h-4" />
          </span>
          <div>
            <span className="font-extrabold text-emerald-200">구글 시트 자동 적재 상태: </span>
            <span className="text-stone-300">
              {sheetSyncStatus === 'syncing'
                ? '⏳ 구글 시트에 동기화 중...'
                : sheetSyncStatus === 'success'
                ? '✅ 실시간 자동 적재 작동 중 (https://docs.google.com/spreadsheets/d/1UDi8MePHWE9QF060jg1mePwRspjkm-5JGpUCypAajD0)'
                : isGoogleConnected
                ? '🟢 구글 계정 연동 완료 (모든 예약 접수/확정/취소 시 자동 적재됨)'
                : '🟡 구글 계정 연동 필요 (버튼을 클릭해 계정을 연동하세요)'}
            </span>
          </div>
        </div>

        {!isGoogleConnected && (
          <button
            onClick={connectGoogle}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs transition-all cursor-pointer shadow-xs"
          >
            Google 계정 연결하기
          </button>
        )}
      </div>

      {/* Quick KPI Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500">승인 대기</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{pendingCount}건</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500">확정 완료</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{confirmedCount}건</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500">취소건</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">{cancelledCount}건</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500">유효 확정 매출액</span>
            <div className="text-lg font-black text-stone-900 mt-0.5">
              {Math.round(totalRevenue / 10000).toLocaleString()}만원
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-oak-green/10 text-oak-green flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              전체 목록 ({reservations.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>승인 대기 ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>확정 완료 ({confirmedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === 'completed'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>투숙 완료 ({completedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>취소 내역 ({cancelledCount})</span>
            </button>
          </div>

          {/* Search & Partner Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedPartnerCode}
              onChange={(e) => setSelectedPartnerCode(e.target.value)}
              className="min-h-[44px] px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none shrink-0"
            >
              <option value="ALL">🏢 전체 제휴사</option>
              {partners.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="예약자명, 연락처, 예약번호, 제휴사..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Reservation Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-800">
            <thead className="bg-stone-100 text-stone-600 uppercase font-extrabold text-[11px] border-b border-stone-200">
              <tr>
                <th className="p-3.5">상태</th>
                <th className="p-3.5">예약번호 / PMS번호</th>
                <th className="p-3.5">제휴사</th>
                <th className="p-3.5">예약자 / 연락처</th>
                <th className="p-3.5">패키지 & 객실타입</th>
                <th className="p-3.5">체크인 ~ 체크아웃</th>
                <th className="p-3.5 text-right">결제 예정액</th>
                <th className="p-3.5 text-center">오픈카드 보증</th>
                <th className="p-3.5 text-center">관리자 조치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <span>조회 조건에 해당하는 예약 내역이 존재하지 않습니다.</span>
                  </td>
                </tr>
              ) : (
                filteredList.map((res) => {
                  const isCancelled = res.status === 'cancelled';
                  const isCompleted = !isCancelled && (res.checkIn < todayStr || res.status === 'completed');
                  const isPending = !isCancelled && !isCompleted && res.status === 'pending';
                  const isConfirmed = !isCancelled && !isCompleted && (res.status === 'confirmed' || res.status === 'checked_in');

                  return (
                    <tr
                      key={res.id}
                      onClick={(e) => {
                        // Prevent opening detail if clicking action buttons or card button directly
                        const target = e.target as HTMLElement;
                        if (target.closest('button')) return;
                        setViewDetailRes(res);
                      }}
                      className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                      title="클릭하여 예약 상세 한눈에 보기"
                    >
                      {/* Status Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>승인대기</span>
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>PMS 확정</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-purple-300 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-purple-700" />
                            <span>투숙 완료</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>취소완료</span>
                          </span>
                        )}
                      </td>

                      {/* Reservation IDs */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-stone-900 flex items-center gap-1">
                          <span>{res.id}</span>
                          <Eye className="w-3.5 h-3.5 text-stone-400 group-hover:text-oak-green" />
                        </div>
                        {res.pmsReservationNo ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="font-mono text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                              {res.pmsReservationNo}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirm(res);
                              }}
                              className="p-1 text-stone-400 hover:text-emerald-800 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                              title="PMS 예약번호 수정"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                            PMS 번호 미발급
                          </div>
                        )}
                      </td>

                      {/* Partner Name */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{res.partnerName}</div>
                        <div className="text-[10px] font-mono text-stone-500">{res.partnerCode}</div>
                      </td>

                      {/* Booker Details */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-stone-900">{res.bookerName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{res.bookerPhone}</div>
                      </td>

                      {/* Package & Room */}
                      <td className="p-3.5 min-w-[180px]">
                        <div className="font-bold text-stone-900 line-clamp-1">{res.packageName}</div>
                        <div className="text-[11px] text-stone-500 line-clamp-1">{res.roomTypeName}</div>
                      </td>

                      {/* Dates & Nights */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-stone-900">
                          {res.checkIn} ~ {res.checkOut}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {res.nights}박 {res.roomCount}실
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="font-black text-sm text-oak-dark">
                          {res.totalPrice.toLocaleString()}원
                        </div>
                        {res.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            임직원 -{res.discountAmount.toLocaleString()}원
                          </div>
                        )}
                      </td>

                      {/* Open-Card Info */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectCardRes(res);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
                          title="오픈카드 상세조회"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                          <span>{res.guaranteeCard?.cardType || '카드보증'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewDetailRes(res);
                            }}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="한눈에 보기"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirm(res);
                              }}
                              className="px-3 py-1.5 bg-oak-green hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>PMS 확정</span>
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirm(res);
                              }}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                              title="PMS 예약번호 변경/수정"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                              <span>번호 수정</span>
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancellingRes(res);
                                setAdminCancelReason('객실 수량 부족 (만실)으로 인한 예약 불가');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>취소</span>
                            </button>
                          )}

                          {isCancelled && (
                            <span className="text-[11px] text-stone-400 font-medium">취소 완료됨</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PMS CONFIRMATION MODAL */}
      {confirmingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-oak-green" />
                <span>PMS 확정 예약번호 입력 / 수정</span>
              </h3>
              <button onClick={() => setConfirmingRes(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-xs">
              <p><strong>예약자:</strong> {confirmingRes.bookerName} ({confirmingRes.bookerPhone})</p>
              <p><strong>제휴사:</strong> {confirmingRes.partnerName}</p>
              <p><strong>상품:</strong> {confirmingRes.packageName}</p>
              <p><strong>일정:</strong> {confirmingRes.checkIn} ~ {confirmingRes.checkOut} ({confirmingRes.nights}박)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                오크밸리리조트 PMS 확정 예약번호 입력 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pmsInput}
                onChange={(e) => setPmsInput(e.target.value)}
                placeholder=""
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900 text-sm focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setConfirmingRes(null)}
                className="min-h-[44px] px-4 py-2 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-300 cursor-pointer transition-colors active:scale-98"
              >
                취소
              </button>
              <button
                onClick={handleExecuteConfirm}
                className="min-h-[44px] px-4 py-2 bg-oak-green text-white font-bold text-xs rounded-xl hover:bg-emerald-800 shadow-sm cursor-pointer transition-colors active:scale-98"
              >
                PMS 예약 확정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CANCELLATION MODAL */}
      {cancellingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>예약 강제 취소 처리</span>
              </h3>
              <button onClick={() => setCancellingRes(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p><strong>대상 예약:</strong> {cancellingRes.id}</p>
              <p><strong>예약자:</strong> {cancellingRes.bookerName} ({cancellingRes.bookerPhone})</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">취소 사유 선택 및 입력</label>
              <select
                value={adminCancelReason}
                onChange={(e) => setAdminCancelReason(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
              >
                <option value="객실 수량 부족 (만실)으로 인한 예약 불가">객실 수량 부족 (만실)으로 인한 예약 불가</option>
                <option value="고객 요청에 의한 전화 취소">고객 요청에 의한 전화 취소</option>
                <option value="제휴 임직원 신분 확인 불가">제휴 임직원 신분 확인 불가</option>
                <option value="중복 예약 및 카드 정보 오류">중복 예약 및 카드 정보 오류</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setCancellingRes(null)}
                className="min-h-[44px] px-4 py-2 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-300 cursor-pointer transition-colors active:scale-98"
              >
                닫기
              </button>
              <button
                onClick={handleExecuteCancel}
                className="min-h-[44px] px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-sm cursor-pointer transition-colors active:scale-98"
              >
                예약 취소 집행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OPEN CARD GUARANTEE INSPECTOR MODAL */}
      {inspectCardRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>오픈카드 보증 내역 상세검토</span>
              </h3>
              <button onClick={() => setInspectCardRes(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {inspectCardRes.guaranteeCard?.cardType || '신용카드 보증'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
                  0원 가승인 보증완료
                </span>
              </div>
              <div className="font-mono text-xl font-black tracking-widest text-amber-300 bg-black/40 p-2.5 rounded-xl border border-amber-500/30 text-center shadow-inner">
                {canViewUnmaskedCard
                  ? inspectCardRes.guaranteeCard?.cardNumberFull ||
                    inspectCardRes.guaranteeCard?.cardNumberMasked?.replace(/\*{2,4}/g, '5821') ||
                    '1234-5678-9012-3456'
                  : inspectCardRes.guaranteeCard?.cardNumberMasked || '1234-****-****-9012'}
              </div>
              {!canViewUnmaskedCard && (
                <p className="text-[11px] text-amber-400 bg-amber-950/60 p-2 rounded-lg text-center font-sans border border-amber-500/30">
                  🔒 영업사원 계정 보안 정책: 카드번호 마스킹 해제 권한이 없습니다. (예약실/마스터 전용)
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-stone-300 pt-1 border-t border-stone-700">
                <span>명의자: {inspectCardRes.guaranteeCard?.cardholderName || inspectCardRes.bookerName}</span>
                <span>유효기간: {inspectCardRes.guaranteeCard?.cardExpiry || '12/28'}</span>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>보증 카드 관리 준수 사항</span>
              </p>
              <p className="text-[11px] text-amber-900">
                실제 객실 금액은 숙박 당일 오크밸리리조트 현장 체크인 시 지급 수단으로 결제되며, 노쇼 및 입실 임박 취소 시에만 보증 청구가 진행됩니다.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setInspectCardRes(null)}
                className="min-h-[44px] px-5 py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 cursor-pointer transition-colors active:scale-98"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE VIEW RESERVATION SNAPSHOT MODAL */}
      <ReservationDetailModal
        reservation={viewDetailRes}
        onClose={() => setViewDetailRes(null)}
        onOpenConfirm={handleOpenConfirm}
        onOpenCancel={(r) => {
          setCancellingRes(r);
          setAdminCancelReason('객실 수량 부족 (만실)으로 인한 예약 불가');
        }}
      />

    </div>
  );
};
