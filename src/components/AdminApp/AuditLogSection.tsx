import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import { ShieldAlert, Search, Filter, History, Clock, UserCheck, Layers, Gift, BedDouble, DollarSign, RefreshCw, Building2, Calendar, FileText, CloudUpload, CheckCircle2, Shield } from 'lucide-react';

export const AuditLogSection: React.FC = () => {
  const {
    auditLogs,
    currentAdmin,
    isGoogleConnected,
    connectGoogle,
    googleUser,
    driveSyncStatus,
    syncDriveAuditLogs,
    fetchDriveAuditLogs,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  const isMaster = currentAdmin?.role === 'master';

  const typeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PACKAGE: { label: '패키지 관리', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Gift className="w-3.5 h-3.5" /> },
    ROOM: { label: '원천 객실', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <BedDouble className="w-3.5 h-3.5" /> },
    RATE: { label: '요금/재고', color: 'bg-amber-100 text-amber-900 border-amber-200', icon: <DollarSign className="w-3.5 h-3.5" /> },
    CANCELLATION: { label: '취소/위약금', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    PARTNER: { label: '제휴사', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: <Building2 className="w-3.5 h-3.5" /> },
    RESERVATION: { label: '예약 처리', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: <Calendar className="w-3.5 h-3.5" /> },
    USER_APPROVAL: { label: '영업사원 승인', color: 'bg-yellow-100 text-yellow-900 border-yellow-200', icon: <UserCheck className="w-3.5 h-3.5" /> },
    MEDIA: { label: '미디어 보관함', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: <FileText className="w-3.5 h-3.5" /> },
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesType = selectedType === 'ALL' || log.actionType === selectedType;
    const matchesSearch =
      log.actionSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <span>마스터 전용 시스템 변경 / 수정 이력 감사 로그 (Audit Trail)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            구글드라이브 (내 드라이브 &gt; AI 스튜디오 &gt; 제휴사 예약창 &gt; 작업이력_기록.json)에 실시간으로 보관 및 적재됩니다.
          </p>
        </div>

        <div className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0">
          👑 마스터 보안 모드 활성화됨
        </div>
      </div>

      {/* Google Drive Sync Bar */}
      <div className="p-4 bg-stone-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 text-xs">
          {isGoogleConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Drive 연동 중 ({googleUser?.email || googleUser?.displayName})</span>
            </span>
          ) : (
            <button
              onClick={connectGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>구글 계정 연동하기</span>
            </button>
          )}

          <span className="text-stone-300">
            {driveSyncStatus === 'syncing'
              ? '⏳ 구글드라이브 동기화 진행 중...'
              : driveSyncStatus === 'success'
              ? '✅ 구글드라이브 동기화 성공'
              : driveSyncStatus === 'error'
              ? '⚠️ 동기화 실패'
              : '경로: 내 드라이브 > AI 스튜디오 > 제휴사 예약창'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsSyncing(true);
              await fetchDriveAuditLogs();
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>드라이브에서 이력 가져오기</span>
          </button>

          <button
            onClick={async () => {
              setIsSyncing(true);
              await syncDriveAuditLogs();
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B7834A] hover:bg-[#A06E39] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>드라이브로 이력 백업</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="수정 내용, 작업자 이름, 상세 변경사항 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-oak-green/30"
          />
        </div>

        <div className="sm:col-span-6 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-stone-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 분류:
          </span>
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === 'ALL'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체 ({auditLogs.length})
          </button>
          {Object.entries(typeLabels).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                selectedType === key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Timeline / Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <History className="w-4 h-4 text-oak-green" />
            <span>최근 변경 이력 레코드 목록 ({filteredLogs.length}건)</span>
          </h3>
          <span className="text-[11px] text-stone-400">실시간 로그 기록 중</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-stone-50 rounded-2xl text-stone-500 text-xs font-medium">
            조건에 해당하는 변경 이력 로그가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const labelInfo = typeLabels[log.actionType] || {
                label: log.actionType,
                color: 'bg-stone-100 text-stone-800 border-stone-200',
                icon: <FileText className="w-3.5 h-3.5" />,
              };

              return (
                <div
                  key={log.id}
                  className="bg-stone-50 hover:bg-stone-100/80 p-4 rounded-2xl border border-stone-200/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border flex items-center gap-1 ${labelInfo.color}`}>
                        {labelInfo.icon}
                        <span>{labelInfo.label}</span>
                      </span>

                      <span className="text-xs font-extrabold text-stone-900">
                        {log.actionSummary}
                      </span>
                    </div>

                    {log.details && (
                      <div className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200 font-mono">
                        {log.details}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/60">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <span className={log.actorRole === 'master' ? 'text-amber-800 font-extrabold' : 'text-stone-700'}>
                        {log.actorRole === 'master' ? '👑' : '💼'} {log.actorName}
                      </span>
                      <span className="text-[10px] text-stone-400">({log.actorRole})</span>
                    </div>

                    <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
