import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  FileText,
  CloudUpload,
  Clock,
  User,
} from 'lucide-react';
import { AuditLog } from '../../types';

interface WorkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkHistoryModal: React.FC<WorkHistoryModalProps> = ({ isOpen, onClose }) => {
  const {
    auditLogs,
    googleUser,
    isGoogleConnected,
    connectGoogle,
    driveSyncStatus,
    syncDriveAuditLogs,
    fetchDriveAuditLogs,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleFetchFromDrive = async () => {
    if (!isGoogleConnected) {
      showToast('구글 계정이 연동되지 않았습니다. 먼저 구글 계정을 연결해주세요.', 'info');
      return;
    }
    setIsSyncing(true);
    await fetchDriveAuditLogs();
    setIsSyncing(false);
  };

  const handleSyncToDrive = async () => {
    if (!isGoogleConnected) {
      showToast('구글 계정이 연동되지 않았습니다. 먼저 구글 계정을 연결해주세요.', 'info');
      return;
    }
    setIsSyncing(true);
    await syncDriveAuditLogs();
    setIsSyncing(false);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesFilter = selectedFilter === 'ALL' || log.actionType === selectedFilter;
    const matchesSearch =
      log.actionSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getActionBadgeColor = (type: AuditLog['actionType']) => {
    switch (type) {
      case 'PARTNER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PACKAGE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ROOM':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLATION':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'RESERVATION':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'USER_APPROVAL':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getActionTypeLabel = (type: AuditLog['actionType']) => {
    switch (type) {
      case 'PARTNER':
        return '제휴사';
      case 'PACKAGE':
        return '패키지';
      case 'ROOM':
        return '원천객실';
      case 'RATE':
        return '요금/재고';
      case 'CANCELLATION':
        return '취소규정';
      case 'RESERVATION':
        return '예약';
      case 'USER_APPROVAL':
        return '권한/가입';
      default:
        return '기타';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2D1B10] to-[#422919] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
                <span>작업 이력 히스토리</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Google Drive 연동
                </span>
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                구글드라이브 &gt; 내 드라이브 &gt; AI 스튜디오 &gt; 제휴사 예약창 위치에 실시간 백업됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Controls & Info Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {isGoogleConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>구글 계정 연동됨 ({googleUser?.email || googleUser?.displayName})</span>
              </span>
            ) : (
              <button
                onClick={connectGoogle}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-oak-dark text-amber-200 hover:bg-black text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>구글 계정 연결하기</span>
              </button>
            )}

            <span className="text-stone-500">
              {driveSyncStatus === 'syncing'
                ? '⏳ 구글드라이브 동기화 중...'
                : driveSyncStatus === 'success'
                ? '✅ 동기화 완료'
                : driveSyncStatus === 'error'
                ? '⚠️ 동기화 실패'
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchFromDrive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium border border-stone-300 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="구글드라이브에서 이력 가져오기"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>드라이브에서 동기화</span>
            </button>

            <button
              onClick={handleSyncToDrive}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B7834A] hover:bg-[#A06E39] text-white text-xs font-medium shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="구글드라이브에 이력 백업하기"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>드라이브로 내보내기</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['ALL', 'PARTNER', 'PACKAGE', 'ROOM', 'RATE', 'CANCELLATION', 'RESERVATION', 'USER_APPROVAL'].map(
              (filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedFilter === filterKey
                      ? 'bg-oak-dark text-amber-200 font-bold shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {filterKey === 'ALL' ? '전체 이력' : getActionTypeLabel(filterKey as AuditLog['actionType'])}
                </button>
              )
            )}
          </div>

          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="작업자, 내용, 세부사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Logs List Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-stone-50/50">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-medium">조회된 작업 이력이 없습니다.</p>
              <p className="text-xs text-stone-400">시스템 내에서 변경된 내역이 여기에 기록됩니다.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs hover:border-amber-200 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border ${getActionBadgeColor(
                        log.actionType
                      )}`}
                    >
                      {getActionTypeLabel(log.actionType)}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900">{log.actionSummary}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-700 font-semibold">{log.actorName}</strong> ({log.actorRole})
                    </span>
                    <span className="flex items-center gap-1 text-stone-400">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {log.timestamp}
                    </span>
                  </div>
                </div>

                {log.details && (
                  <div className="p-2.5 rounded-lg bg-stone-50 text-xs text-stone-600 border border-stone-200/60 font-mono break-all">
                    {log.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>총 {filteredLogs.length}건의 작업 기록이 표시됨</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 text-white hover:bg-stone-900 font-medium transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
