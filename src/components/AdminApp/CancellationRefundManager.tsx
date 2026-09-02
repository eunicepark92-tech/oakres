import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SeasonPeriod, SeasonalCancellationRule } from '../../types';
import { RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Settings2, Plus, Trash2, RotateCcw, Calculator, Calendar, Sun, Palmtree, ArrowRight } from 'lucide-react';

export const CancellationRefundManager: React.FC = () => {
  const {
    currentAdmin,
    reservations,
    processRefund,
    seasonPeriods,
    updateSeasonPeriods,
    seasonalCancellationRules,
    updateSeasonalCancellationRules,
    resetSeasonalCancellationRulesToDefault,
    showToast,
  } = useApp();

  const isMaster = currentAdmin?.role === 'master';

  // Editing state for Seasonal Rules Matrix
  const [editingRules, setEditingRules] = useState<SeasonalCancellationRule[]>(seasonalCancellationRules);
  const [isEditingRules, setIsEditingRules] = useState(false);

  // Editing state for Season Periods
  const [editingPeriods, setEditingPeriods] = useState<SeasonPeriod[]>(seasonPeriods);
  const [isEditingPeriods, setIsEditingPeriods] = useState(false);

  // New Season Period input state
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('2026-07-15');
  const [newSeasonEnd, setNewSeasonEnd] = useState('2026-08-25');

  // Simulator state
  const [simPrice, setSimPrice] = useState<number>(350000);
  const [simCheckInDate, setSimCheckInDate] = useState<string>('2026-08-15');
  const [simDaysBeforeCheckIn, setSimDaysBeforeCheckIn] = useState<number>(5);

  const cancelledReservations = reservations.filter((r) => r.status === 'cancelled');

  // Season Periods Handlers
  const handleAddPeriod = () => {
    if (!newSeasonName.trim()) {
      showToast('성수기 명칭을 입력해주세요.', 'error');
      return;
    }
    const newPeriod: SeasonPeriod = {
      id: `sp-${Date.now()}`,
      name: newSeasonName.trim(),
      startDate: newSeasonStart,
      endDate: newSeasonEnd,
    };
    const updated = [...editingPeriods, newPeriod];
    setEditingPeriods(updated);
    setNewSeasonName('');
  };

  const handleRemovePeriod = (id: string) => {
    setEditingPeriods(editingPeriods.filter((p) => p.id !== id));
  };

  const handleSavePeriods = () => {
    updateSeasonPeriods(editingPeriods);
    setIsEditingPeriods(false);
  };

  // Seasonal Rules Handlers
  const handleRuleChange = (index: number, field: keyof SeasonalCancellationRule, value: string | number) => {
    const updated = [...editingRules];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditingRules(updated);
  };

  const handleAddRule = () => {
    const newRule: SeasonalCancellationRule = {
      id: `sc-custom-${Date.now()}`,
      minDays: 2,
      label: '입실 2일 전',
      offPeakWeekdayRate: 30,
      offPeakWeekendRate: 50,
      peakSeasonRate: 70,
      description: '비수기주중 30%, 주말 50%, 성수기 70%',
    };
    setEditingRules([...editingRules, newRule]);
  };

  const handleRemoveRule = (index: number) => {
    setEditingRules(editingRules.filter((_, i) => i !== index));
  };

  const handleSaveRules = () => {
    updateSeasonalCancellationRules(editingRules);
    setIsEditingRules(false);
  };

  // Simulator helper functions
  const checkSeasonType = (dateStr: string) => {
    if (!dateStr) return { isPeak: false, isWeekend: false, seasonLabel: '비수기 주중' };

    // Check if in peak season
    const isPeak = seasonPeriods.some((p) => dateStr >= p.startDate && dateStr <= p.endDate);
    if (isPeak) {
      const matchedPeriod = seasonPeriods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate);
      return { isPeak: true, isWeekend: false, seasonLabel: `성수기 (${matchedPeriod?.name || '성수기'})` };
    }

    // Check day of week (0: Sun, 5: Fri, 6: Sat)
    const dt = new Date(dateStr);
    const day = dt.getDay();
    const isWeekend = day === 5 || day === 6; // Friday or Saturday
    return {
      isPeak: false,
      isWeekend,
      seasonLabel: isWeekend ? '비수기 주말 (금, 토)' : '비수기 주중 (일~목)',
    };
  };

  const simSeasonInfo = checkSeasonType(simCheckInDate);

  // Match rule
  const sortedRules = [...seasonalCancellationRules].sort((a, b) => b.minDays - a.minDays);
  const matchedRule = sortedRules.find((r) => simDaysBeforeCheckIn >= r.minDays) || sortedRules[sortedRules.length - 1];

  let simPenaltyRate = 100;
  if (matchedRule) {
    if (simSeasonInfo.isPeak) {
      simPenaltyRate = matchedRule.peakSeasonRate;
    } else if (simSeasonInfo.isWeekend) {
      simPenaltyRate = matchedRule.offPeakWeekendRate;
    } else {
      simPenaltyRate = matchedRule.offPeakWeekdayRate;
    }
  }

  const simPenaltyAmount = Math.round((simPrice * simPenaltyRate) / 100);
  const simRefundAmount = simPrice - simPenaltyAmount;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-oak-green" />
            <span>약관 및 보증 / 취소 위약금 및 환불 규정 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            약관 및 보증 규정, 성수기 시즌 기간 및 입실 잔여일 구간별 위약율(%)을 정밀하게 다차원 관리합니다.
          </p>
        </div>

        {!isMaster && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>🔒 약관 및 보증 수정 권한은 마스터(최고 관리자) 전용입니다.</span>
          </div>
        )}
      </div>

      {/* SECTION 1: 성수기 기간 설정 (PEAK SEASON PERIOD CONFIG) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>1. 성수기(High Season) 기간 지정 및 관리</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              지정된 성수기 기간에 해당하는 날짜는 자동으로 '성수기 위약율'이 적용됩니다. (지정되지 않은 날짜는 비수기 주중/주말 분류)
            </p>
          </div>

          {!isEditingPeriods ? (
            <button
              onClick={() => {
                setEditingPeriods(seasonPeriods);
                setIsEditingPeriods(true);
              }}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>성수기 기간 수정</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingPeriods(false)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleSavePeriods}
                className="px-4 py-2 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-sm"
              >
                성수기 기간 저장
              </button>
            </div>
          )}
        </div>

        {/* Periods Display Grid / Edit Forms */}
        {!isEditingPeriods ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seasonPeriods.map((period) => (
              <div
                key={period.id}
                className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1">
                    <Palmtree className="w-4 h-4 text-amber-600" />
                    <span>{period.name}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                    성수기 지정
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-stone-800 flex items-center gap-1.5 pt-1">
                  <span>{period.startDate}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                  <span>{period.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {editingPeriods.map((period, idx) => (
                <div key={period.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={period.name}
                    onChange={(e) => {
                      const updated = [...editingPeriods];
                      updated[idx].name = e.target.value;
                      setEditingPeriods(updated);
                    }}
                    placeholder="성수기 명칭 (예: 여름 하이시즌)"
                    className="w-full sm:w-1/3 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => {
                        const updated = [...editingPeriods];
                        updated[idx].startDate = e.target.value;
                        setEditingPeriods(updated);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold"
                    />
                    <span className="text-stone-400 font-bold">~</span>
                    <input
                      type="date"
                      value={period.endDate}
                      onChange={(e) => {
                        const updated = [...editingPeriods];
                        updated[idx].endDate = e.target.value;
                        setEditingPeriods(updated);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={() => handleRemovePeriod(period.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Period Row */}
            <div className="bg-amber-50/50 p-3 rounded-xl border border-dashed border-amber-300 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="새 성수기 명칭 (예: 단풍 추석 연휴)"
                className="w-full sm:w-1/3 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={newSeasonStart}
                  onChange={(e) => setNewSeasonStart(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold"
                />
                <span className="text-stone-400 font-bold">~</span>
                <input
                  type="date"
                  value={newSeasonEnd}
                  onChange={(e) => setNewSeasonEnd(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <button
                onClick={handleAddPeriod}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1 shrink-0 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>성수기 구간 추가</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: 3단계 위약율 규정 매트릭스 (3-TIER SEASONAL PENALTY MATRIX) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-oak-green" />
              <span>2. 비수기 주중 / 비수기 주말 / 성수기 구간별 취소 위약율 매트릭스</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              입실 잔여 일수별로 [비수기 주중(일~목)], [비수기 주말(금,토)], [성수기] 3개 구분에 따른 위약율(%)을 지정합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingRules ? (
              <>
                <button
                  onClick={() => {
                    setEditingRules(seasonalCancellationRules);
                    setIsEditingRules(true);
                  }}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>위약율 매트릭스 수정</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('모든 취소 규정 및 성수기 설정을 표준 기본값으로 초기화하시겠습니까?')) {
                      resetSeasonalCancellationRulesToDefault();
                      setEditingRules(seasonalCancellationRules);
                      setEditingPeriods(seasonPeriods);
                    }
                  }}
                  className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                  title="표준 기본값 초기화"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditingRules(false)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveRules}
                  className="px-4 py-2 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  변경사항 저장
                </button>
              </>
            )}
          </div>
        </div>

        {/* Matrix Table */}
        {!isEditingRules ? (
          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/80 text-stone-800 font-extrabold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">취소 시점 (구간)</th>
                  <th className="py-3 px-4 text-emerald-800 bg-emerald-50/70 border-l border-emerald-200">
                    🟢 비수기 주중 (일~목)
                  </th>
                  <th className="py-3 px-4 text-blue-900 bg-blue-50/70 border-l border-blue-200">
                    🔵 비수기 주말 (금,토)
                  </th>
                  <th className="py-3 px-4 text-rose-900 bg-rose-50/70 border-l border-rose-200">
                    🔴 성수기 (High Season)
                  </th>
                  <th className="py-3 px-4 border-l border-stone-200">상세 안내</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium">
                {seasonalCancellationRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-stone-50/80">
                    <td className="py-3 px-4 font-extrabold text-stone-900">
                      {rule.label} <span className="text-[10px] text-stone-400 block font-normal">(입실 {rule.minDays}일 이상 전)</span>
                    </td>
                    <td className="py-3 px-4 border-l border-emerald-100 bg-emerald-50/30 font-mono font-bold text-emerald-900">
                      {rule.offPeakWeekdayRate === 0 ? '무료 (0%)' : `위약금 ${rule.offPeakWeekdayRate}%`}
                    </td>
                    <td className="py-3 px-4 border-l border-blue-100 bg-blue-50/30 font-mono font-bold text-blue-900">
                      {rule.offPeakWeekendRate === 0 ? '무료 (0%)' : `위약금 ${rule.offPeakWeekendRate}%`}
                    </td>
                    <td className="py-3 px-4 border-l border-rose-100 bg-rose-50/30 font-mono font-bold text-rose-900">
                      {rule.peakSeasonRate === 0 ? '무료 (0%)' : `위약금 ${rule.peakSeasonRate}%`}
                    </td>
                    <td className="py-3 px-4 border-l border-stone-200 text-stone-500 text-[11px]">
                      {rule.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {editingRules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="bg-stone-50 p-4 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">구간 라벨 & 최소일수</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={rule.label}
                      onChange={(e) => handleRuleChange(idx, 'label', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="number"
                      value={rule.minDays}
                      onChange={(e) => handleRuleChange(idx, 'minDays', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold font-mono"
                    />
                    <span className="text-[10px] text-stone-400 shrink-0">일전</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-emerald-800 mb-1">🟢 비수기 주중 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.offPeakWeekdayRate}
                    onChange={(e) => handleRuleChange(idx, 'offPeakWeekdayRate', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold font-mono text-emerald-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-blue-800 mb-1">🔵 비수기 주말 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.offPeakWeekendRate}
                    onChange={(e) => handleRuleChange(idx, 'offPeakWeekendRate', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold font-mono text-blue-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-rose-800 mb-1">🔴 성수기 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.peakSeasonRate}
                    onChange={(e) => handleRuleChange(idx, 'peakSeasonRate', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold font-mono text-rose-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">안내 문구</label>
                  <input
                    type="text"
                    value={rule.description}
                    onChange={(e) => handleRuleChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-[11px]"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddRule}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-dashed border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 구간 위약율 행 추가</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: 스마트 실시간 시뮬레이터 (SMART REALTIME SIMULATOR) */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm text-stone-100">
              실시간 3차원 위약금 스마트 시뮬레이터
            </h3>
            <p className="text-[11px] text-stone-400">
              체크인 일자 및 결제 금액을 입력하면 해당 날짜의 [비수기 주중/주말/성수기] 구분을 자동 판단하여 정확한 환불액을 산출합니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-stone-400">예약 금액 (원):</label>
            <input
              type="number"
              step={10000}
              value={simPrice}
              onChange={(e) => setSimPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-amber-300 font-mono font-extrabold text-sm"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-stone-400">체크인 예정일:</label>
            <input
              type="date"
              value={simCheckInDate}
              onChange={(e) => setSimCheckInDate(e.target.value)}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 font-mono font-bold text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-stone-400">입실 잔여일 (D-Day):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={simDaysBeforeCheckIn}
                onChange={(e) => setSimDaysBeforeCheckIn(Number(e.target.value))}
                className="w-full px-2 py-2 bg-stone-800 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              />
              <span className="text-xs text-stone-400 shrink-0">일 전</span>
            </div>
          </div>

          <div className="sm:col-span-4 bg-stone-800/90 p-3.5 rounded-2xl border border-stone-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">시즌 구분:</span>
              <span className="font-extrabold text-amber-300">{simSeasonInfo.seasonLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">적용 규칙:</span>
              <span className="font-extrabold text-stone-200">{matchedRule ? matchedRule.label : '-'}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-700/80">
              <span className="text-stone-300">위약율 (부과액):</span>
              <strong className="text-rose-400 font-mono font-bold">
                {simPenaltyRate}% ({simPenaltyAmount.toLocaleString()}원)
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 font-bold">최종 환불 금액:</span>
              <strong className="text-emerald-400 font-mono font-extrabold text-sm">
                {simRefundAmount.toLocaleString()}원
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: 취소 및 환불 처리건 목록 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-stone-900 border-b pb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>취소 접수 및 환불 승인 대상 목록 ({cancelledReservations.length}건)</span>
        </h3>

        {cancelledReservations.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-xl text-stone-500 text-xs">
            현재 처리 대기 중이거나 완료된 예약 취소 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {cancelledReservations.map((res) => (
              <div
                key={res.id}
                className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="font-mono font-bold text-stone-900 text-sm">{res.id}</span>
                    <span className="text-xs text-amber-800 font-bold ml-2">[{res.partnerName}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {res.refundStatus === 'completed' ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>환불/보증해제 완료</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                        환불 승인 대기
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-800">
                  <div>
                    <span className="text-stone-500 block">예약자 / 연락처:</span>
                    <span className="font-bold">{res.bookerName} ({res.bookerPhone})</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">원 예약 금액:</span>
                    <span className="font-bold">{res.totalPrice.toLocaleString()}원</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">취소 일시:</span>
                    <span className="font-medium">{res.cancelledAt ? new Date(res.cancelledAt).toLocaleString() : '-'}</span>
                  </div>
                </div>

                {/* Automated Breakdown Box */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500">적용 위약율:</span>{' '}
                    <strong className="text-rose-600">{res.cancellationPenaltyRate || 0}%</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">부과 위약금:</span>{' '}
                    <strong className="text-stone-900">{(res.penaltyAmount || 0).toLocaleString()}원</strong>
                  </div>
                  <div>
                    <span className="text-stone-500">최종 환불 예정액:</span>{' '}
                    <strong className="text-emerald-700 font-extrabold text-sm">
                      {(res.refundAmount || res.totalPrice).toLocaleString()}원
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-500">
                    사유: {res.cancelReason || '고객 요청'}
                  </span>

                  {res.refundStatus !== 'completed' && (
                    <button
                      onClick={() => processRefund(res.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      환불 및 보증해제 최종 승인
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
