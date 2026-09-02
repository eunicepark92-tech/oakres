import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settlement } from '../../types';
import { DollarSign, Download, RefreshCw, CheckCircle2, Clock, FileSpreadsheet, Building2, FileText } from 'lucide-react';

export const SettlementModule: React.FC = () => {
  const { settlements, reservations, generateMonthlySettlements, updateSettlementStatus, showToast } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const filteredSettlements = settlements.filter((s) => s.month === selectedMonth);

  const totalGross = filteredSettlements.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const totalNet = filteredSettlements.reduce((acc, cur) => acc + cur.netSettlementAmount, 0);

  const handleExportCSV = () => {
    const headers = ['월', '제휴사명', '제휴코드', '예약건수', '총매출(원)', '할인율(%)', '정산액(원)', '상태'];
    const rows = filteredSettlements.map((s) => [
      s.month,
      s.partnerName,
      s.partnerCode,
      s.totalBookings,
      s.grossAmount,
      s.discountRate,
      s.netSettlementAmount,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `오크밸리리조트_전체제휴정산요약_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${selectedMonth} 전체 제휴 정산 요약 CSV 파일이 다운로드 되었습니다.`, 'success');
  };

  // Partner-specific reservation itemized reconciliation download
  const handleDownloadPartnerReconciliationCSV = (partnerCode: string, partnerName: string) => {
    const partnerReservations = reservations.filter(
      (r) =>
        r.partnerCode === partnerCode &&
        (r.checkIn?.startsWith(selectedMonth) || r.createdAt?.startsWith(selectedMonth))
    );

    // Fallback if no month filter match, take all reservations for that partner
    const listToExport = partnerReservations.length > 0
      ? partnerReservations
      : reservations.filter((r) => r.partnerCode === partnerCode);

    if (listToExport.length === 0) {
      showToast(`[${partnerName}] 해당 월의 예약 건이 없습니다.`, 'info');
      return;
    }

    const headers = [
      '예약접수번호',
      'PMS예약번호',
      '상태',
      '제휴사명',
      '제휴코드',
      '패키지명',
      '객실타입',
      '체크인',
      '체크아웃',
      '박수',
      '객실수',
      '원래금액(원)',
      '할인금액(원)',
      '최종결제금액(원)',
      '예약자명',
      '연락처',
      '이메일',
      '신청일시',
      '확정/취소일시',
      '취소위약금(원)',
    ];

    const rows = listToExport.map((res) => {
      const statusKorean =
        res.status === 'confirmed'
          ? '예약확정'
          : res.status === 'cancelled'
          ? '예약취소'
          : '확정대기';
      const actionDate = res.confirmedAt || res.cancelledAt || '';

      return [
        res.id,
        res.pmsReservationNo || '',
        statusKorean,
        res.partnerName || partnerName,
        res.partnerCode || partnerCode,
        res.packageName || '',
        res.roomTypeName || '',
        res.checkIn || '',
        res.checkOut || '',
        res.nights || 1,
        res.roomCount || 1,
        res.originalTotalPrice || 0,
        res.discountAmount || 0,
        res.totalPrice || 0,
        res.bookerName || '',
        res.bookerPhone || '',
        res.bookerEmail || '',
        res.createdAt || '',
        actionDate,
        res.penaltyAmount || 0,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `오크밸리리조트_건별예약대사_${partnerCode}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`[${partnerName}] ${selectedMonth} 건별 예약 대사 내역 (${listToExport.length}건) CSV가 다운로드되었습니다.`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-oak-green" />
            <span>제휴사 월별 정산 관리 모듈 (Settlement Engine)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            제휴사별 우대 할인 및 월간 매출액, 순 정산금을 산출하고 지급 상태를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
          >
            <option value="2026-08">2026년 08월 정산</option>
            <option value="2026-07">2026년 07월 정산</option>
            <option value="2026-06">2026년 06월 정산</option>
          </select>

          <button
            onClick={() => generateMonthlySettlements(selectedMonth)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-oak-gold" />
            <span>정산재집계</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">총 발생 원정가 금액</span>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {totalGross.toLocaleString()}원
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">제휴 할인 우대총액</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            -{(totalGross - totalNet).toLocaleString()}원
          </div>
        </div>

        <div className="bg-oak-dark text-white p-5 rounded-2xl border border-amber-900/40 shadow-lg">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">최종 순 정산 대상액</span>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {totalNet.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* Settlement Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-oak-green" />
            <span>[{selectedMonth}] 제휴사별 정산 내역 목록 ({filteredSettlements.length}개)</span>
          </h3>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV/엑셀 다운로드</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-800">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="p-3">제휴사명</th>
                <th className="p-3">제휴코드</th>
                <th className="p-3">예약건수</th>
                <th className="p-3">총 원정가 (원)</th>
                <th className="p-3">할인율</th>
                <th className="p-3">최종 정산금 (원)</th>
                <th className="p-3">상태</th>
                <th className="p-3 text-center">건별 대사 다운로드</th>
                <th className="p-3 text-right">상태 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredSettlements.map((stl) => (
                <tr key={stl.id} className="hover:bg-stone-50">
                  <td className="p-3 font-bold text-stone-900">{stl.partnerName}</td>
                  <td className="p-3 font-mono font-bold text-amber-900">{stl.partnerCode}</td>
                  <td className="p-3 font-bold">{stl.totalBookings}건</td>
                  <td className="p-3 text-stone-600">{stl.grossAmount.toLocaleString()}원</td>
                  <td className="p-3 font-bold text-rose-600">{stl.discountRate}%</td>
                  <td className="p-3 font-extrabold text-oak-dark text-sm">
                    {stl.netSettlementAmount.toLocaleString()}원
                  </td>
                  <td className="p-3">
                    {stl.status === 'SETTLED' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        정산완료
                      </span>
                    )}
                    {stl.status === 'CONFIRMED' && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        승인완료
                      </span>
                    )}
                    {stl.status === 'PENDING' && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        검토중
                      </span>
                    )}
                    {stl.status === 'DRAFT' && (
                      <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border">
                        초안
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDownloadPartnerReconciliationCSV(stl.partnerCode, stl.partnerName)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] rounded-lg border border-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title={`${stl.partnerName} 건별 예약 대사 CSV 다운로드`}
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      <span>대사 리스트 (CSV)</span>
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={stl.status}
                      onChange={(e) => updateSettlementStatus(stl.id, e.target.value as Settlement['status'])}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="DRAFT">초안 (DRAFT)</option>
                      <option value="PENDING">검토중 (PENDING)</option>
                      <option value="CONFIRMED">승인 (CONFIRMED)</option>
                      <option value="SETTLED">정산완료 (SETTLED)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
