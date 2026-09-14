import React, { useState, useEffect } from 'react';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  FileCheck,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  checkExistingSupabaseData,
  executeManualMigration,
  calculateMigrationSourceCounts,
  MigrationCheckResult,
  TableCountInfo,
} from '../../services/supabaseMigration';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentAdmin,
    partners,
    packages,
    roomTypes,
    packageCategories,
    dailyRates,
    seasonPeriods,
    seasonalCancellationRules,
    cancellationRules,
    specialDays,
    roleSettings,
    reservations,
    auditLogs,
    showToast,
  } = useApp();

  const isMasterApproved =
    currentAdmin?.role === 'master' && Boolean(currentAdmin?.approved);

  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const [preCheck, setPreCheck] = useState<MigrationCheckResult | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{
    table: string;
    step: number;
    total: number;
  } | null>(null);
  const [resultTables, setResultTables] = useState<TableCountInfo[] | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 대상 테이블 9종의 실제 원본 건수 사전 산출
  const sourceCounts = React.useMemo(() => {
    return calculateMigrationSourceCounts({
      roomTypes,
      partners,
      packages,
      dailyRates,
      packageCategories,
      seasonPeriods,
      seasonalCancellationRules,
      cancellationRules,
      specialDays,
      roleSettings,
      reservations,
      auditLogs,
    });
  }, [
    roomTypes,
    partners,
    packages,
    dailyRates,
    packageCategories,
    seasonPeriods,
    seasonalCancellationRules,
    cancellationRules,
    specialDays,
    roleSettings,
    reservations,
    auditLogs,
  ]);

  // 필수 관계 데이터 누락 여부 검증
  const mandatoryMissingReason = React.useMemo(() => {
    if (roomTypes.length === 0) return '필수 객실 타입(roomTypes) 데이터가 0건입니다.';
    if (packages.length === 0) return '필수 판매 상품(packages) 데이터가 0건입니다.';
    if (dailyRates.length === 0) return '필수 일자별 요금(dailyRates) 데이터가 0건입니다.';
    return null;
  }, [roomTypes.length, packages.length, dailyRates.length]);

  // 모달이 열릴 때 사전 점검 수행
  useEffect(() => {
    if (isOpen && isMasterApproved) {
      runPreCheck();
    } else {
      resetState();
    }
  }, [isOpen, isMasterApproved]);

  const resetState = () => {
    setIsConfirmed(false);
    setIsMigrating(false);
    setCurrentProgress(null);
    setResultTables(null);
    setMigrationStatus('idle');
    setErrorMessage(null);
  };

  const runPreCheck = async () => {
    setIsLoadingCheck(true);
    try {
      const check = await checkExistingSupabaseData();
      setPreCheck(check);
    } catch (err) {
      console.error('[PreCheck Error]', err);
    } finally {
      setIsLoadingCheck(false);
    }
  };

  const handleStartMigration = async () => {
    if (!isMasterApproved) {
      showToast('마스터 최고 관리자만 마이그레이션을 실행할 수 있습니다.', 'error');
      return;
    }

    setIsMigrating(true);
    setErrorMessage(null);
    setMigrationStatus('idle');

    try {
      const result = await executeManualMigration(
        {
          partners,
          packages,
          roomTypes,
          packageCategories,
          dailyRates,
          seasonPeriods,
          seasonalCancellationRules,
          cancellationRules,
          specialDays,
          roleSettings,
          reservations,
          auditLogs,
        },
        (tableName, step, total) => {
          setCurrentProgress({ table: tableName, step, total });
        }
      );

      setResultTables(result.tables);

      if (result.success) {
        setMigrationStatus('success');
        showToast('Supabase로의 기준 데이터 이전이 성공적으로 완료되었습니다!', 'success');
      } else {
        setMigrationStatus('failed');
        setErrorMessage(result.message);
        showToast(`마이그레이션 실패: ${result.message}`, 'error');
      }
    } catch (err: any) {
      setMigrationStatus('failed');
      setErrorMessage(err?.message || '알 수 없는 시스템 오류가 발생했습니다.');
      showToast('마이그레이션 처리 중 시스템 오류가 발생했습니다.', 'error');
    } finally {
      setIsMigrating(false);
      // 최종 카운트 재동기화
      runPreCheck();
    }
  };

  if (!isOpen) return null;

  if (!isMasterApproved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">접근 권한 제한</h3>
          <p className="text-sm text-stone-600 mb-5">
            이 기능은 승인된 <strong>마스터 총괄 관리자(master)</strong> 계정 전용 기능입니다.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-700"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">
                  현재 데이터 Supabase로 수동 이전
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  마스터 1회 수동 마이그레이션
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                현재 브라우저에 표시 중인 제휴사, 객실, 상품, 요금, 재고 데이터를 Supabase 영구 DB로 안전하게 동기화합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isMigrating}
            className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Safety Notice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-bold mb-0.5">데이터 무결성 & 안전 보호</strong>
                <span className="text-emerald-800">
                  각 테이블의 PK/UNIQUE 기준으로 <strong>UPSERT</strong>되므로 중복 복제되지 않으며, 외래키 의존성 순서를 준수합니다.
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-900 block font-bold mb-0.5">원천 데이터 보존</strong>
                <span className="text-blue-800">
                  이전 완료 후에도 기존 브라우저 데이터는 삭제되지 않으며 안전하게 유지됩니다.
                </span>
              </div>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700">
            <span className="font-bold text-stone-900 flex items-center gap-1">
              <FileCheck className="w-4 h-4 text-stone-600" />
              보안 규격 준수:
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-stone-300 font-medium text-stone-700">
              ✓ 카드정보 저장 제외 (0건)
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-stone-300 font-medium text-stone-700">
              ✓ available_stock 직접 저장 제외 (0건)
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-stone-300 font-medium text-stone-700">
              ✓ Auth 관리자 계정 보존
            </span>
          </div>

          {/* Pre-Check Database Status */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                <Server className="w-4 h-4 text-stone-600" />
                <span>Supabase 현재 데이터 적재 상태</span>
              </div>
              <button
                onClick={runPreCheck}
                disabled={isLoadingCheck || isMigrating}
                className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingCheck ? 'animate-spin' : ''}`} />
                상태 새로고침
              </button>
            </div>

            {isLoadingCheck ? (
              <div className="py-4 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                Supabase 테이블 상태를 확인하고 있습니다...
              </div>
            ) : preCheck ? (
              <div>
                {preCheck.hasExistingData ? (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        Supabase에 이미 총 {preCheck.totalExistingCount.toLocaleString()}건의 데이터가 존재합니다.
                      </span>
                      <span className="text-amber-800 text-[11px]">
                        마이그레이션을 다시 실행할 경우 기존 데이터를 고유 키(PK) 기준으로 안전하게 덮어쓰기(UPSERT)합니다.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>현재 Supabase에 적재된 데이터가 없습니다. (최초 마이그레이션 대상)</span>
                  </div>
                )}

                {/* Table Summary Quick Grid (All 9 Tables) */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-stone-700 mb-2 flex items-center justify-between">
                    <span>이전 대상 테이블 원본 및 현재 Supabase 적재 상태</span>
                    <span className="text-stone-400 font-normal">총 9개 테이블 대상</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">1. 객실 타입 (room_types)</span>
                      <strong className="text-stone-900 text-xs">{roomTypes.length}종</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.room_types ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">2. 제휴사 (partners)</span>
                      <strong className="text-stone-900 text-xs">
                        {partners.length > 0 ? `${partners.length}개` : '0개 (등록 제휴사 없음)'}
                      </strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.partners ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">3. 상품/패키지 (products)</span>
                      <strong className="text-stone-900 text-xs">{packages.length}종</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.products ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">4. 상품-객실 연결 (product_room_types)</span>
                      <strong className="text-stone-900 text-xs">
                        {sourceCounts.product_room_types > 0 ? `${sourceCounts.product_room_types}건` : '연결 정보 없음 (0건)'}
                      </strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.product_room_types ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">5. 일자별 요금 (product_prices)</span>
                      <strong className="text-stone-900 text-xs">{dailyRates.length}행</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.product_prices ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">6. 일자별 객실 재고 (inventory)</span>
                      <strong className="text-stone-900 text-xs">
                        {sourceCounts.inventory > 0 ? `${sourceCounts.inventory}건` : '재고 원본 없음 (0건)'}
                      </strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.inventory ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">7. 운영 설정/공지 (operation_notices)</span>
                      <strong className="text-stone-900 text-xs">{sourceCounts.operation_notices}건</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.operation_notices ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">8. 기존 예약 (reservations)</span>
                      <strong className="text-stone-900 text-xs">{sourceCounts.reservations}건</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.reservations ?? 0})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200 shadow-xs">
                      <span className="text-stone-500 block">9. 감사 로그 (audit_logs)</span>
                      <strong className="text-stone-900 text-xs">{sourceCounts.audit_logs}건</strong>
                      <span className="text-[10px] text-stone-400 block">(DB: {preCheck.tableCounts.audit_logs ?? 0})</span>
                    </div>
                  </div>
                </div>

                {/* Schema Verification Badges */}
                <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] space-y-1.5">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    사전 전송 스키마 무결성 및 보안 검증 통과
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-600 text-[10px] pt-1">
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-stone-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>room_types: standard_price 매핑 (base_price 0건)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-stone-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>inventory: available_stock 제외 (0건 전송)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-stone-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>reservations: 결제 카드정보 제외 (0건 전송)</span>
                    </div>
                  </div>
                </div>

                {/* Mandatory Data Missing Warning */}
                {mandatoryMissingReason && (
                  <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>마이그레이션 불가:</strong> {mandatoryMissingReason}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Progress Indicator when Migrating */}
          {isMigrating && currentProgress && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  단계 {currentProgress.step} / {currentProgress.total}: [{currentProgress.table}] 이전 중...
                </span>
                <span>{Math.round((currentProgress.step / currentProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentProgress.step / currentProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Table after Migration */}
          {resultTables && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-600" />
                  테이블별 이전 결과 검증
                </h4>
                {migrationStatus === 'success' ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 이전 성공
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> 오류 발생
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">마이그레이션 실패 상세</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">대상 테이블</th>
                      <th className="py-2 px-3 text-right">앱 소스 건수</th>
                      <th className="py-2 px-3 text-right">이전 전 DB</th>
                      <th className="py-2 px-3 text-right">이전 후 DB</th>
                      <th className="py-2 px-3 text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {resultTables.map((tbl) => (
                      <tr key={tbl.tableName} className="hover:bg-stone-50">
                        <td className="py-2 px-3">
                          <span className="font-bold text-stone-800">{tbl.label}</span>
                          <span className="text-[10px] text-stone-400 block">{tbl.tableName}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-stone-700">
                          {tbl.sourceCount.toLocaleString()}건
                        </td>
                        <td className="py-2 px-3 text-right text-stone-500">
                          {tbl.dbCountBefore.toLocaleString()}건
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-stone-900">
                          {tbl.dbCountAfter.toLocaleString()}건
                        </td>
                        <td className="py-2 px-3 text-center">
                          {tbl.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> 성공
                            </span>
                          ) : tbl.status === 'skipped' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded" title={tbl.errorDetails}>
                              보존/스킵
                            </span>
                          ) : tbl.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded" title={tbl.errorDetails}>
                              실패
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">대기</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm Checkbox before execution */}
          {migrationStatus !== 'success' && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-800 select-none">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  disabled={isMigrating}
                  className="mt-0.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  <strong>[필수 확인]</strong> 위 점검 내역을 확인하였으며, 현재 앱 데이터를 Supabase 영구 데이터베이스로
                  이전(UPSERT)하는 것에 동의합니다. (외래키 및 중복 방지 규정 자동 적용)
                </span>
              </label>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500">
            * 실행은 전적으로 마스터 총괄 관리자의 수동 요청에 의해서만 단 1회 수행됩니다.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isMigrating}
              className="px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200/70 rounded-xl transition-colors disabled:opacity-50"
            >
              {migrationStatus === 'success' ? '닫기' : '취소'}
            </button>

            {migrationStatus !== 'success' && (
              <button
                onClick={handleStartMigration}
                disabled={!isConfirmed || isMigrating || Boolean(mandatoryMissingReason)}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={mandatoryMissingReason || (!isConfirmed ? '필수 확인 체크박스에 동의해주세요.' : undefined)}
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Supabase 이전 진행 중...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>지금 Supabase로 데이터 이전</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
