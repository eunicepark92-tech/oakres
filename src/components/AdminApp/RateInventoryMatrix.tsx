import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Save, Sparkles, Filter, CheckCircle2, Sliders, FileSpreadsheet, Upload, Download, AlertCircle, FileText } from 'lucide-react';

export const RateInventoryMatrix: React.FC = () => {
  const { packages, roomTypes, dailyRates, updateDailyRate, bulkUpdateDailyRates, batchUpdateDailyRates, showToast, hasPermission } = useApp();

  const canManageRates = hasPermission('canManageRates');

  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomTypes[0]?.id || '');

  // Bulk Update State
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [bulkPrice, setBulkPrice] = useState<number>(185000);
  const [bulkStock, setBulkStock] = useState<number>(5);

  // Day-of-week breakdown state (Weekday / Friday / Saturday / SpecialDay)
  const [useDifferentiated, setUseDifferentiated] = useState(false);
  const [applyWeekday, setApplyWeekday] = useState(true);
  const [weekdayPrice, setWeekdayPrice] = useState<number>(175000);
  const [weekdayStock, setWeekdayStock] = useState<number>(5);

  const [applyFriday, setApplyFriday] = useState(true);
  const [fridayPrice, setFridayPrice] = useState<number>(210000);
  const [fridayStock, setFridayStock] = useState<number>(4);

  const [applySaturday, setApplySaturday] = useState(true);
  const [saturdayPrice, setSaturdayPrice] = useState<number>(260000);
  const [saturdayStock, setSaturdayStock] = useState<number>(3);

  const [applySpecialDay, setApplySpecialDay] = useState(true);
  const [specialDayPrice, setSpecialDayPrice] = useState<number>(290000);
  const [specialDayStock, setSpecialDayStock] = useState<number>(2);

  // Excel Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelInputText, setExcelInputText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ date: string; price: number; stock: number }[]>([]);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  // Filter available room types connected to the selected package
  const availableRooms = React.useMemo(() => {
    if (!selectedPkg) return roomTypes;
    if (selectedPkg.roomTypeIds && selectedPkg.roomTypeIds.length > 0) {
      const filtered = roomTypes.filter((r) => selectedPkg.roomTypeIds?.includes(r.id));
      return filtered.length > 0 ? filtered : roomTypes;
    }
    return roomTypes;
  }, [selectedPkg, roomTypes]);

  // Ensure selectedRoomId is valid whenever selectedPkgId or availableRooms changes
  React.useEffect(() => {
    if (availableRooms.length > 0) {
      const exists = availableRooms.some((r) => r.id === selectedRoomId);
      if (!exists) {
        setSelectedRoomId(availableRooms[0].id);
      }
    }
  }, [selectedPkgId, availableRooms, selectedRoomId]);

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId) || availableRooms[0] || roomTypes[0];

  // Filter Daily Rates for Selected Package + Room (Hide past dates)
  const filteredRates = dailyRates
    .filter((r) => r.packageId === selectedPkgId && r.roomTypeId === selectedRoomId && r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId || !selectedRoomId) return;

    bulkUpdateDailyRates(
      selectedPkgId,
      selectedRoomId,
      startDate,
      endDate,
      bulkPrice,
      bulkStock,
      {
        useDifferentiated,
        applyWeekday,
        applyFriday,
        applySaturday,
        applySpecialDay,
        weekday: { price: weekdayPrice, stock: weekdayStock },
        friday: { price: fridayPrice, stock: fridayStock },
        saturday: { price: saturdayPrice, stock: saturdayStock },
        specialDay: { price: specialDayPrice, stock: specialDayStock },
      }
    );
  };

  const handleDownloadTemplate = () => {
    const csvHeader = "날짜(YYYY-MM-DD),판매가(원),재고수(실)\n";
    const sampleRows = "2026-08-10,190000,8\n2026-08-11,190000,8\n2026-08-12,210000,5\n2026-08-13,210000,5\n2026-08-14,250000,3\n";
    const blob = new Blob(["\uFEFF" + csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `요금재고업로드_양식_${selectedPkg?.name || '패키지'}.csv`;
    a.click();
    showToast('엑셀 샘플 양식 다운로드가 시작되었습니다.', 'info');
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const rows: { date: string; price: number; stock: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('날짜') || line.startsWith('Date')) continue;

      const cols = line.split(/,|\t/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 3) {
        const d = cols[0];
        const p = parseInt(cols[1].replace(/[^0-9]/g, ''), 10);
        const s = parseInt(cols[2].replace(/[^0-9]/g, ''), 10);

        if (d && !isNaN(p) && !isNaN(s)) {
          rows.push({ date: d, price: p, stock: s });
        }
      }
    }

    setParsedPreview(rows);
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setExcelInputText(content);
        parseCsvText(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleApplyExcelData = () => {
    if (parsedPreview.length === 0) {
      alert('적용할 올바른 엑셀 데이터가 없습니다. 양식에 맞게 입력하거나 업로드해주세요.');
      return;
    }

    const updates = parsedPreview.map((item) => ({
      packageId: selectedPkgId,
      roomTypeId: selectedRoomId,
      date: item.date,
      price: item.price,
      stock: item.stock,
    }));

    batchUpdateDailyRates(updates);
    setIsExcelModalOpen(false);
    setExcelInputText('');
    setParsedPreview([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-oak-green" />
            <span>일자별 & 객실타입별 요금/재고 등록 모듈</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            직관적 매트릭스 UI와 엑셀(CSV) 일괄 업로드를 지원하여 성수기/주말/평일 요금 및 재고를 손쉽게 동기화합니다.
          </p>
        </div>

        <button
          onClick={() => setIsExcelModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>엑셀(CSV) 일괄 업로드</span>
        </button>
      </div>

      {!canManageRates && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>예약실 직원 권한 안내:</strong> 날짜별 요금 및 재고 등록/일괄 변경 권한이 부여되지 않았습니다. (영업사원 및 마스터 전용 권한)
            </span>
          </div>
          <span className="text-[11px] font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 shrink-0 font-bold">
            조회 전용 모드
          </span>
        </div>
      )}

      {/* Package & Room Type Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-oak-green" />
            <span>대상 패키지 선택</span>
          </label>
          <select
            value={selectedPkgId}
            onChange={(e) => setSelectedPkgId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                [{pkg.partnerCode}] {pkg.name} ({pkg.basePrice.toLocaleString()}원)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-oak-green" />
            <span>대상 객실타입 선택</span>
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
          >
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.size})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section A: Bulk Price Setter */}
      <div className="bg-oak-dark text-white p-6 rounded-2xl border border-amber-900/40 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
          <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>⚡ 기간 일괄 요금 / 재고 등록 (Bulk Fast Editor)</span>
          </h3>

          <label className="flex items-center gap-2 cursor-pointer bg-stone-900/80 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-stone-800 transition-colors">
            <input
              type="checkbox"
              checked={useDifferentiated}
              onChange={(e) => setUseDifferentiated(e.target.checked)}
              className="w-4 h-4 rounded text-oak-gold focus:ring-amber-400"
            />
            <span>📅 주중 / 금요일 / 토요일 차등 등록 설정</span>
          </label>
        </div>

        <form onSubmit={handleBulkSubmit} className="space-y-4">
          {/* Common Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-oak-gold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-oak-gold"
              />
            </div>
          </div>

          {!useDifferentiated ? (
            /* Uniform Price & Stock */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">일괄 적용 단가 (원)</label>
                <input
                  type="number"
                  step={5000}
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-bold text-amber-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">일일 객실 재고 수</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-bold text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-oak-gold hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-stone-950" />
                <span>일괄 저장하기</span>
              </button>
            </div>
          ) : (
            /* Differentiated Weekday / Friday / Saturday / SpecialDay Price & Stock */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Weekday (Sun ~ Thu) */}
                <div className={`p-3.5 rounded-2xl border transition-all space-y-2 ${applyWeekday ? 'bg-stone-900/90 border-stone-700/80' : 'bg-stone-900/40 border-stone-800 opacity-60'}`}>
                  <div className="text-xs font-extrabold text-sky-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyWeekday}
                        onChange={(e) => setApplyWeekday(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-sky-400 focus:ring-sky-400"
                      />
                      <span>🏢 주중 (일~목)</span>
                    </label>
                    <span className="text-[10px] text-stone-400">{applyWeekday ? '적용함' : '적용제외'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">단가 (원)</label>
                      <input
                        type="number"
                        disabled={!applyWeekday}
                        step={5000}
                        value={weekdayPrice}
                        onChange={(e) => setWeekdayPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-sky-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">재고 (실)</label>
                      <input
                        type="number"
                        disabled={!applyWeekday}
                        min={0}
                        value={weekdayStock}
                        onChange={(e) => setWeekdayStock(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Friday */}
                <div className={`p-3.5 rounded-2xl border transition-all space-y-2 ${applyFriday ? 'bg-stone-900/90 border-stone-700/80' : 'bg-stone-900/40 border-stone-800 opacity-60'}`}>
                  <div className="text-xs font-extrabold text-amber-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyFriday}
                        onChange={(e) => setApplyFriday(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-400 focus:ring-amber-400"
                      />
                      <span>🔥 금요일</span>
                    </label>
                    <span className="text-[10px] text-stone-400">{applyFriday ? '적용함' : '적용제외'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">단가 (원)</label>
                      <input
                        type="number"
                        disabled={!applyFriday}
                        step={5000}
                        value={fridayPrice}
                        onChange={(e) => setFridayPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-amber-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">재고 (실)</label>
                      <input
                        type="number"
                        disabled={!applyFriday}
                        min={0}
                        value={fridayStock}
                        onChange={(e) => setFridayStock(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Saturday */}
                <div className={`p-3.5 rounded-2xl border transition-all space-y-2 ${applySaturday ? 'bg-stone-900/90 border-stone-700/80' : 'bg-stone-900/40 border-stone-800 opacity-60'}`}>
                  <div className="text-xs font-extrabold text-rose-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applySaturday}
                        onChange={(e) => setApplySaturday(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-rose-400 focus:ring-rose-400"
                      />
                      <span>👑 토요일</span>
                    </label>
                    <span className="text-[10px] text-stone-400">{applySaturday ? '적용함' : '적용제외'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">단가 (원)</label>
                      <input
                        type="number"
                        disabled={!applySaturday}
                        step={5000}
                        value={saturdayPrice}
                        onChange={(e) => setSaturdayPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-rose-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">재고 (실)</label>
                      <input
                        type="number"
                        disabled={!applySaturday}
                        min={0}
                        value={saturdayStock}
                        onChange={(e) => setSaturdayStock(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Special Day / Holiday */}
                <div className={`p-3.5 rounded-2xl border transition-all space-y-2 ${applySpecialDay ? 'bg-purple-950/80 border-purple-700/80' : 'bg-stone-900/40 border-stone-800 opacity-60'}`}>
                  <div className="text-xs font-extrabold text-purple-300 flex items-center justify-between border-b border-purple-800/80 pb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applySpecialDay}
                        onChange={(e) => setApplySpecialDay(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-400 focus:ring-purple-400"
                      />
                      <span>🔮 스페셜데이</span>
                    </label>
                    <span className="text-[10px] text-purple-300/80">{applySpecialDay ? '적용함' : '적용제외'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-purple-300/80 mb-0.5">단가 (원)</label>
                      <input
                        type="number"
                        disabled={!applySpecialDay}
                        step={5000}
                        value={specialDayPrice}
                        onChange={(e) => setSpecialDayPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-purple-800 rounded-lg text-xs font-bold text-purple-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-purple-300/80 mb-0.5">재고 (실)</label>
                      <input
                        type="number"
                        disabled={!applySpecialDay}
                        min={0}
                        value={specialDayStock}
                        onChange={(e) => setSpecialDayStock(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-purple-800 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-oak-gold hover:bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-stone-950" />
                  <span>주중 / 금 / 토 / 스페셜데이 선택 요금 일괄 저장</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Section B: Daily Rate Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              [{selectedPkg?.name}] - [{selectedRoom?.name}] 일자별 요금 현황
            </span>
          </h3>
          <span className="text-xs text-stone-500">
            * 수정을 원하시는 날짜의 값을 변경 후 [저장]을 누르세요.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-800">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="p-3">날짜 (Date)</th>
                <th className="p-3">요일</th>
                <th className="p-3">판매가 (원)</th>
                <th className="p-3">잔여 재고 (실)</th>
                <th className="p-3">상태</th>
                <th className="p-3 text-right">수정 저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredRates.map((rate) => {
                const dateObj = new Date(rate.date);
                const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
                const isWeekend = dateObj.getDay() === 5 || dateObj.getDay() === 6;

                return (
                  <DailyRateRow
                    key={rate.id}
                    rate={rate}
                    dayOfWeek={dayOfWeek}
                    isWeekend={isWeekend}
                    onSave={(p, s) => updateDailyRate(rate.packageId, rate.roomTypeId, rate.date, p, s)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXCEL UPLOAD MODAL */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>엑셀 / CSV 일괄 요금재고 업로드</span>
              </h3>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-stone-900 flex items-center justify-between">
                <span>적용 대상: [{selectedPkg?.name}] - [{selectedRoom?.name}]</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>엑셀 샘플 양식 다운로드</span>
                </button>
              </div>
              <p className="text-stone-500 text-[11px]">
                형식: <code>날짜, 판매가, 재고수</code> (예: <code>2026-08-10, 190000, 8</code>)
              </p>
            </div>

            {/* File Upload & Textarea */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={excelFileInputRef}
                  accept=".csv, .txt, .xlsx"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>CSV/엑셀 파일 읽기</span>
                </button>
                <span className="text-xs text-stone-400">또는 아래에 직접 복사/붙여넣기</span>
              </div>

              <textarea
                rows={5}
                value={excelInputText}
                onChange={(e) => {
                  setExcelInputText(e.target.value);
                  parseCsvText(e.target.value);
                }}
                placeholder={`2026-08-10, 190000, 8\n2026-08-11, 190000, 8\n2026-08-12, 210000, 5`}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>파싱된 데이터 미리보기 ({parsedPreview.length}건)</span>
                  <span className="text-emerald-700">✓ 정상 인식됨</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-100 font-bold">
                      <tr>
                        <th className="p-2">날짜</th>
                        <th className="p-2">판매가</th>
                        <th className="p-2">재고 수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {parsedPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2 font-bold">{item.date}</td>
                          <td className="p-2 text-amber-700">{item.price.toLocaleString()}원</td>
                          <td className="p-2">{item.stock}실</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApplyExcelData}
                disabled={parsedPreview.length === 0}
                className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                  parsedPreview.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                {parsedPreview.length}건 요금/재고 반영하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Subcomponent for Inline Edit
const DailyRateRow: React.FC<{
  rate: any;
  dayOfWeek: string;
  isWeekend: boolean;
  onSave: (price: number, stock: number) => void;
}> = ({ rate, dayOfWeek, isWeekend, onSave }) => {
  const [price, setPrice] = useState<number>(rate.price);
  const [stock, setStock] = useState<number>(rate.stock);
  const [isModified, setIsModified] = useState(false);

  React.useEffect(() => {
    setPrice(rate.price);
    setStock(rate.stock);
    setIsModified(false);
  }, [rate.price, rate.stock]);

  return (
    <tr className={`hover:bg-stone-50 transition-colors ${isWeekend ? 'bg-amber-50/30' : ''}`}>
      <td className="p-3 font-bold text-stone-900 font-mono">{rate.date}</td>
      <td className="p-3">
        <span
          className={`font-bold text-xs ${
            dayOfWeek === '일' ? 'text-rose-600' : dayOfWeek === '토' ? 'text-blue-600' : 'text-stone-700'
          }`}
        >
          ({dayOfWeek})
        </span>
      </td>
      <td className="p-3">
        <input
          type="number"
          step={1000}
          value={price}
          onChange={(e) => {
            setPrice(Number(e.target.value));
            setIsModified(true);
          }}
          className="w-32 px-2.5 py-1 bg-white border border-stone-300 rounded-lg font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-oak-green"
        />
      </td>
      <td className="p-3">
        <input
          type="number"
          min={0}
          max={20}
          value={stock}
          onChange={(e) => {
            setStock(Number(e.target.value));
            setIsModified(true);
          }}
          className="w-20 px-2.5 py-1 bg-white border border-stone-300 rounded-lg font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-oak-green"
        />
      </td>
      <td className="p-3">
        {stock > 0 ? (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            예약가능 ({stock}실)
          </span>
        ) : (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            마감
          </span>
        )}
      </td>
      <td className="p-3 text-right">
        <button
          onClick={() => {
            onSave(price, stock);
            setIsModified(false);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto ${
            isModified
              ? 'bg-oak-green text-white shadow-sm hover:bg-oak-dark'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>저장</span>
        </button>
      </td>
    </tr>
  );
};
