import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountProfileModal } from '../Common/AccountProfileModal';
import { WorkHistoryModal } from '../Admin/WorkHistoryModal';
import { OakValleyLogo } from '../Common/OakValleyLogo';
import { SPREADSHEET_URL } from '../../services/googleDriveSheets';
import { LayoutDashboard, Building2, BedDouble, Gift, Calendar, RefreshCw, MessageSquare, DollarSign, ShieldCheck, UserCheck, Image as ImageIcon, ShieldAlert, Key, UserCog, History, Table, ExternalLink, Shield } from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'reservation_desk'
  | 'partners'
  | 'roomTypes'
  | 'mediaGallery'
  | 'packages'
  | 'matrix'
  | 'refunds'
  | 'settlement'
  | 'approvals'
  | 'calendar'
  | 'audit';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onSelectTab }) => {
  const { currentAdmin, adminUsers, loginAdmin, hasPermission, showToast, isGoogleConnected, connectGoogle, googleUser } = useApp();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);

  const isMaster = currentAdmin?.role === 'master';
  const isReservationStaff = currentAdmin?.role === 'reservation_staff';
  const pendingApprovalsCount = adminUsers.filter((u) => u.role === 'sales_agent' && !u.approved).length;

  const allTabs: { id: AdminTab; label: string; icon: React.ReactNode; requiresPermission?: keyof import('../../types').RolePermissions; masterOnly?: boolean }[] = [
    { id: 'dashboard', label: '예약 대시보드', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'reservation_desk', label: '예약 처리 센터 (실시간)', icon: <ShieldCheck className="w-4 h-4" />, requiresPermission: 'canConfirmReservations' },
    { id: 'partners', label: '제휴사/로고 관리', icon: <Building2 className="w-4 h-4" />, requiresPermission: 'canManagePartners' },
    { id: 'roomTypes', label: '원천 객실 관리', icon: <BedDouble className="w-4 h-4" />, requiresPermission: 'canManageRooms' },
    { id: 'packages', label: '패키지 등록/수정', icon: <Gift className="w-4 h-4" />, requiresPermission: 'canManagePackages' },
    { id: 'matrix', label: '요금/재고 관리', icon: <Calendar className="w-4 h-4" />, requiresPermission: 'canManageRates' },
    { id: 'mediaGallery', label: '미디어 라이브러리', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'refunds', label: '약관 및 보증/위약금 규정', icon: <RefreshCw className="w-4 h-4" />, masterOnly: true },
    { id: 'settlement', label: '정산 관리', icon: <DollarSign className="w-4 h-4" /> },
  ];

  // Filter tabs according to current user's role and permissions
  const visibleTabs = allTabs.filter((tab) => {
    if (isMaster) return true;
    if (tab.masterOnly) return false;
    if (tab.requiresPermission) {
      if (tab.id === 'reservation_desk') {
        return hasPermission('canConfirmReservations') || hasPermission('canViewUnmaskedCard');
      }
      return hasPermission(tab.requiresPermission);
    }
    return true;
  });

  const handleQuickSwitchMaster = () => {
    loginAdmin('master@hdc-resort.com', '1234');
    showToast('마스터 총괄 관리자 계정으로 전환되었습니다.', 'info');
  };

  const handleSelectMasterTab = (tabId: AdminTab) => {
    if (!isMaster) {
      // Auto-switch to master account so user can access it immediately
      loginAdmin('master@oakvalley.co.kr', '1234');
      showToast('마스터 계정으로 전환되어 마스터 승인 및 감사로그에 접근합니다.', 'info');
    }
    onSelectTab(tabId);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3 mb-6 space-y-3">
      
      {/* ROW 1: Admin User Badge & Quick Switch Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:px-3 sm:py-2 bg-stone-50 rounded-xl border border-stone-200/80 gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-800 flex-wrap w-full sm:w-auto">
          <OakValleyLogo size="sm" showSubtitle={false} textColorClass="text-[#B7834A]" />
          <span className="font-extrabold text-stone-900 border-l border-stone-300 pl-2">백오피스 관리자 센터</span>
          <span className="text-stone-300 hidden sm:inline">•</span>
          
          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className={`min-h-[40px] sm:min-h-[32px] px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg border flex items-center gap-1.5 font-extrabold hover:opacity-80 transition-opacity cursor-pointer text-xs w-full sm:w-auto justify-center sm:justify-start ${
              isMaster
                ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-900/60'
                : isReservationStaff
                ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-900/60'
                : 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-900/60'
            }`}
            title="클릭하여 내 프로필 정보 및 비밀번호 변경"
          >
            <span>
              {isMaster
                ? '👑 마스터 총괄자'
                : isReservationStaff
                ? '🎧 예약실 담당자'
                : '💼 영업사원 담당자'}
              : {currentAdmin?.name} ({currentAdmin?.employeeId})
            </span>
            <UserCog className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Google Connection & Drive Work History Button */}
          <button
            type="button"
            onClick={() => setIsWorkHistoryOpen(true)}
            className="min-h-[40px] sm:min-h-[34px] flex-1 sm:flex-none px-3 py-2 sm:px-2.5 sm:py-1 bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/25 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-300/80 dark:border-amber-900/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            title="구글드라이브에 저장된 작업 이력 히스토리 조회"
          >
            <History className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>작업 이력 (Drive)</span>
          </button>

          {/* Google Sheets Link Button */}
          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] sm:min-h-[34px] flex-1 sm:flex-none px-3 py-2 sm:px-2.5 sm:py-1 bg-emerald-50/60 hover:bg-emerald-100/80 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300/80 dark:border-emerald-900/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            title="구글 시트 예약 누적 적재 페이지 바로가기"
          >
            <Table className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>구글 시트</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          </a>

          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="min-h-[40px] sm:min-h-[34px] flex-1 sm:flex-none px-3 py-2 sm:px-2.5 sm:py-1 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-lg border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <UserCog className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span>계정 관리</span>
          </button>

          {isMaster && (
            <span className="bg-amber-100/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-900/40 px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1">
              👑 최고 권한
            </span>
          )}
        </div>
      </div>

      <AccountProfileModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      <WorkHistoryModal
        isOpen={isWorkHistoryOpen}
        onClose={() => setIsWorkHistoryOpen(false)}
      />

      {/* ROW 2: Navigation Layout */}
      <div className="space-y-2.5">
        
        {/* ROW 2 - PART 1: Standard Admin Operations Tabs */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-oak-green text-white shadow-md'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ROW 2 - PART 2: Prominent Master Special Authority Bar (MASTER EXCLUSIVE) */}
        {isMaster && (
          <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/40 p-2.5 rounded-xl flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-400 px-1 flex items-center gap-1 shrink-0">
                👑 마스터 관장:
              </span>

              {/* Tab: Master Calendar & Special Days */}
              <button
                onClick={() => onSelectTab('calendar')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  activeTab === 'calendar'
                    ? 'bg-purple-700 dark:bg-purple-800 text-white shadow-sm'
                    : 'bg-white hover:bg-purple-50 dark:bg-stone-900 dark:hover:bg-purple-950/20 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40'
                }`}
              >
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>📅 월력 & 스페셜데이</span>
              </button>

              {/* Tab: Master Sales Agent Approval & Role Permissions */}
              <button
                onClick={() => onSelectTab('approvals')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer relative shadow-sm ${
                  activeTab === 'approvals'
                    ? 'bg-amber-700 dark:bg-amber-800 text-white shadow-sm'
                    : 'bg-white hover:bg-amber-50 dark:bg-stone-900 dark:hover:bg-amber-950/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>👑 역할 권한 & 계정 승인</span>

                {pendingApprovalsCount > 0 && (
                  <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-sm ml-1">
                    {pendingApprovalsCount}건 대기
                  </span>
                )}
              </button>

              {/* Tab: Master Audit Logs */}
              <button
                onClick={() => onSelectTab('audit')}
                className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  activeTab === 'audit'
                    ? 'bg-amber-800 dark:bg-amber-900 text-white shadow-sm'
                    : 'bg-white hover:bg-amber-50 dark:bg-stone-900 dark:hover:bg-amber-950/20 text-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>📜 전체 감사 로그</span>
              </button>
            </div>

            <div className="text-[10px] text-amber-800/80 dark:text-amber-400/60 font-medium px-1 hidden lg:block">
              * 마스터 총괄자는 가입 승인, 세부 역할 스위치 조정 및 약관/전체 시스템 이력을 총괄 관장합니다.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
