import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar as CalendarIcon, Plus, Trash2, Edit3, ShieldAlert, CheckCircle2, Sparkles, Tag, AlertCircle, CalendarDays, Percent } from 'lucide-react';
import { SpecialDay } from '../../types';

export const CalendarManager: React.FC = () => {
  const { specialDays, addSpecialDay, updateSpecialDay, deleteSpecialDay, currentAdmin } = useApp();

  const isMaster = currentAdmin?.role === 'master';

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'holiday' | 'special_rate' | 'peak_season'>('special_rate');
  const [customPriceMultiplier, setCustomPriceMultiplier] = useState<number>(1.2);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Current Month View State
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleEdit = (sd: SpecialDay) => {
    setEditingId(sd.id);
    setDate(sd.date);
    setName(sd.name);
    setCategory(sd.category);
    setCustomPriceMultiplier(sd.customPriceMultiplier || 1.2);
    setNotes(sd.notes || '');
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setName('');
    setCategory('special_rate');
    setCustomPriceMultiplier(1.2);
    setNotes('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!date || !name.trim()) {
      setFormError('날짜와 스페셜데이 명칭은 필수 입력 항목입니다.');
      return;
    }

    if (editingId) {
      updateSpecialDay(editingId, {
        date,
        name,
        category,
        customPriceMultiplier,
        notes,
      });
      handleCancelEdit();
    } else {
      // Check duplicate date
      if (specialDays.some((sd) => sd.date === date)) {
        setFormError('해당 날짜에는 이미 등록된 스페셜데이가 있습니다. 수정하거나 다른 날짜를 지정해주세요.');
        return;
      }

      addSpecialDay({
        date,
        name,
        category,
        customPriceMultiplier,
        notes,
      });

      setName('');
      setNotes('');
    }
  };

  // Build simple 35-day monthly grid for currentYearMonth
  const [yearStr, monthStr] = currentYearMonth.split('-');
  const viewYear = parseInt(yearStr, 10);
  const viewMonth = parseInt(monthStr, 10);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0: Sun

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const categoryBadges = {
    holiday: { label: '공휴일/명절', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
    special_rate: { label: '스페셜데이', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    peak_season: { label: '성수기', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
  };

  if (!isMaster) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-stone-900">마스터 총괄 전용 메뉴</h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          월력 관리 및 스페셜데이 / 공휴일 요금 적용일 지정은 최고 관리자 (마스터) 전용 기능입니다.
          <br />일반 관리자 계정으로는 조회 및 관리가 제한됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            <span>월력 및 스페셜데이/공휴일 지정 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            마스터 총괄 권한으로 달력상의 공휴일, 스페셜데이, 피크 성수기를 지정하고 일괄 요금 등록시 적용 범위를 설정합니다.
          </p>
        </div>

        <span className="text-xs text-amber-900 font-extrabold bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 flex items-center gap-1">
          👑 마스터 최고 관리자 모드
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Registration / Edit Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center justify-between border-b pb-3">
            <span className="flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
              <span>{editingId ? '스페셜데이 정보 수정' : '신규 스페셜데이/공휴일 등록'}</span>
            </span>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                취소
              </button>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                적용 날짜 (Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                스페셜데이 명칭 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 추석 연휴, 광복절, 크리스마스"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  구분 카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="special_rate">🔮 스페셜데이</option>
                  <option value="holiday">🔴 공휴일/명절</option>
                  <option value="peak_season">☀️ 성수기 지정일</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  권장 요금 배율
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="2.5"
                    value={customPriceMultiplier}
                    onChange={(e) => setCustomPriceMultiplier(parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <Percent className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                비고 및 설명
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="특수 요금 사유 및 영업 참고사항 입력"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none"
              />
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingId ? '스페셜데이 수정 저장' : '스페셜데이 일정 등록'}</span>
            </button>
          </form>
        </div>

        {/* Right: Calendar Preview & Special Days List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Calendar Visual Grid View */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <span>월력 시각화 (Calendar Grid)</span>
              </h3>

              <input
                type="month"
                value={currentYearMonth}
                onChange={(e) => setCurrentYearMonth(e.target.value)}
                className="px-3 py-1 bg-stone-100 border border-stone-300 rounded-lg text-xs font-extrabold text-stone-800"
              />
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 bg-stone-50 p-2 rounded-xl">
              <span className="text-rose-600">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-blue-600">토</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs">
              {calendarCells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="h-16 bg-stone-50/40 rounded-lg" />;
                }

                const dateString = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const matchedSd = specialDays.find((sd) => sd.date === dateString);
                const isSun = (idx % 7) === 0;
                const isSat = (idx % 7) === 6;

                return (
                  <div
                    key={dateString}
                    className={`h-16 p-1 rounded-xl border flex flex-col justify-between transition-all ${
                      matchedSd
                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                        : isSun
                        ? 'bg-rose-50/30 border-rose-100'
                        : isSat
                        ? 'bg-blue-50/30 border-blue-100'
                        : 'bg-white border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isSun ? 'text-rose-600' : isSat ? 'text-blue-600' : 'text-stone-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {matchedSd && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                      )}
                    </div>

                    {matchedSd ? (
                      <div className="bg-purple-600 text-white font-bold text-[10px] px-1 py-0.5 rounded truncate" title={matchedSd.name}>
                        {matchedSd.name}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-300 font-mono">
                        {isSun ? '주중' : isSat ? '토요일' : idx % 7 === 5 ? '금요일' : '주중'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Special Days Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>등록된 스페셜데이 / 공휴일 목록 ({specialDays.length}건)</span>
              </h3>
            </div>

            <div className="space-y-3">
              {specialDays
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((sd) => {
                  const badge = categoryBadges[sd.category] || categoryBadges.special_rate;
                  return (
                    <div
                      key={sd.id}
                      className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between gap-4 hover:bg-stone-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-center shrink-0">
                          <span className="block text-[10px] text-stone-400 font-mono uppercase">Date</span>
                          <span className="text-xs font-mono font-extrabold text-stone-900">{sd.date}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900 text-sm">{sd.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                            <span>권장 배율: <strong className="text-purple-700 font-mono">x{sd.customPriceMultiplier || 1.2}</strong></span>
                            {sd.notes && <span>비고: {sd.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEdit(sd)}
                          className="p-1.5 text-stone-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-transparent hover:border-purple-200"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSpecialDay(sd.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
