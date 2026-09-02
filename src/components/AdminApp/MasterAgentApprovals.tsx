import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, UserX, ShieldCheck, Clock, CheckCircle2, Lock, KeyRound, RefreshCw, AlertCircle, Settings, Check, X, Trash2, Mail, Save, Eye, EyeOff, Sparkles, Copy } from 'lucide-react';
import { RolePermissions, AdminUser } from '../../types';

export const MasterAgentApprovals: React.FC = () => {
  const {
    adminUsers,
    approveSalesAgent,
    rejectSalesAgent,
    deleteAdminUser,
    updateAdminRole,
    resetAdminUserPassword,
    currentAdmin,
    roleSettings,
    updateRolePermissions,
    resetRolePermissions,
    notificationEmail,
    setNotificationEmail,
    showToast,
  } = useApp();

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [emailInput, setEmailInput] = useState(notificationEmail);

  useEffect(() => {
    setEmailInput(notificationEmail);
  }, [notificationEmail]);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setNotificationEmail(emailInput.trim());
  };

  const isMaster = currentAdmin?.role === 'master';

  const pendingUsers = adminUsers.filter((u) => u.role === 'sales_agent' && !u.approved);
  const approvedUsers = adminUsers.filter((u) => u.approved);

  const permissionItems: {
    key: keyof RolePermissions;
    label: string;
    description: string;
    salesDefault: boolean;
    resDefault: boolean;
  }[] = [
    {
      key: 'canViewUnmaskedCard',
      label: '💳 고객 카드번호 마스킹 해제 (원본 조회)',
      description: '오픈카드 보증 카드번호 원본(Full Number)을 마스킹 없이 전체 열람할 수 있는 권한입니다.',
      salesDefault: false,
      resDefault: true,
    },
    {
      key: 'canManagePackages',
      label: '🎁 패키지 및 요금 상품 등록/수정/삭제',
      description: '제휴사 단독 우대 패키지 상품을 새로 등록하고 포함사항 및 기본 요금을 수정합니다.',
      salesDefault: true,
      resDefault: false,
    },
    {
      key: 'canManagePartners',
      label: '🏢 제휴사 등록 및 우대 할인율 관리',
      description: '신규 제휴기업을 등록하고 기업별 우대 할인율 및 담당 영업사원을 매핑합니다.',
      salesDefault: true,
      resDefault: false,
    },
    {
      key: 'canManageRooms',
      label: '🛏️ 원천 객실 타입 및 가용 설정',
      description: '리조트 원천 객실(스위트/빌리지 등) 정보 및 패키지 연동 타겟 객실을 관리합니다.',
      salesDefault: true,
      resDefault: false,
    },
    {
      key: 'canManageRates',
      label: '📅 날짜별 요금 및 재고 매트릭스 등록',
      description: '일자별 특가 요금 및 일별 객실 재고를 매트릭스/엑셀(CSV)로 설정합니다.',
      salesDefault: true,
      resDefault: false,
    },
    {
      key: 'canManageCancellation',
      label: '🔄 약관 및 보증/위약금 규정 변경 (마스터 전용)',
      description: '약관 및 보증, 비수기/성수기/주말별 위약 수수료율 및 취소 기한 규정을 수정합니다. (마스터 총괄 전용 권한)',
      salesDefault: false,
      resDefault: false,
    },
    {
      key: 'canConfirmReservations',
      label: '🔑 실시간 예약 PMS 승인 & 취소 처리',
      description: '고객의 예약을 검토하고 PMS 번호를 부여하여 최종 확정/취소 처리합니다.',
      salesDefault: false,
      resDefault: true,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-oak-green" />
            <span>역할 권한 세부 설정 및 계정 관리</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            마스터 총괄 권한으로 영업사원과 예약실 직원의 시스템 세부 작업 권한을 각각 차등 설정하고 신규 가입을 승인합니다.
          </p>
        </div>

        {!isMaster && (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            ⚠️ 마스터 권한 열람 전용 모드
          </span>
        )}
      </div>

      {/* MASTER AUTOMATIC RESERVATION NOTIFICATION EMAIL SETTING */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 rounded-2xl shadow-md border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-700/80 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              <span>실시간 예약 신청 자동 알림 이메일 설정</span>
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              신규 제휴예약 신청이 발생하면 설정된 수신 메일 주소로 신규 예약 내역이 실시간으로 자동 발송됩니다.
            </p>
          </div>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold px-3 py-1 rounded-xl self-start sm:self-center shrink-0">
            👑 마스터 수신 메일 지정
          </span>
        </div>

        <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="email"
              required
              disabled={!isMaster}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="예: reservation@oakvalley.co.kr"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-600 rounded-xl font-mono font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
            />
          </div>

          {isMaster && (
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>수신 메일 저장</span>
            </button>
          )}
        </form>

        <p className="text-[11px] text-stone-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>현재 설정된 알림 수신 메일: <strong className="text-amber-300 font-mono">{notificationEmail || '미설정'}</strong> (예약 발생 시 자동 통보)</span>
        </p>
      </div>

      {/* MASTER ROLE PERMISSIONS MATRIX (MASTER EXCLUSIVE CONTROL) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              <span>역할별 세부 작업 권한 매트릭스 (Role Permissions Matrix)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              영업사원(Sales)과 예약실 직원(Reservation)의 업무 성격에 맞게 기능별 접근 권한을 스위치로 설정할 수 있습니다.
            </p>
          </div>

          {isMaster && (
            <button
              onClick={resetRolePermissions}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>권한 설정 기본값 복원</span>
            </button>
          )}
        </div>

        {/* Permissions Table Comparison */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-y border-stone-200 text-stone-700">
                <th className="p-3.5 font-bold w-1/2">기능별 작업 권한 항목</th>
                <th className="p-3.5 font-bold text-center w-1/4 bg-blue-50/60 border-x border-blue-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-blue-950 font-extrabold text-xs">
                    <span>💼 영업사원 (Sales Agent)</span>
                  </div>
                  <p className="text-[10px] text-blue-700 font-normal mt-0.5">패키지/요금/제휴 관리 중심</p>
                </th>
                <th className="p-3.5 font-bold text-center w-1/4 bg-emerald-50/60 border-r border-emerald-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-950 font-extrabold text-xs">
                    <span>🎧 예약실 직원 (Reservation Desk)</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-normal mt-0.5">카드확인/예약승인/취소 규정 중심</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {permissionItems.map((item) => {
                const salesAllowed = roleSettings.sales_agent[item.key];
                const resAllowed = roleSettings.reservation_staff[item.key];

                return (
                  <tr key={item.key} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900 text-xs">{item.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{item.description}</div>
                    </td>

                    {/* Sales Agent Column */}
                    <td className="p-3.5 text-center bg-blue-50/20 border-x border-blue-100">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <button
                          disabled={!isMaster}
                          onClick={() =>
                            updateRolePermissions('sales_agent', {
                              [item.key]: !salesAllowed,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            salesAllowed
                              ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          } disabled:cursor-not-allowed`}
                        >
                          {salesAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>허용 (ON)</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-stone-500" />
                              <span>제한 (OFF)</span>
                            </>
                          )}
                        </button>
                        {item.key === 'canViewUnmaskedCard' && !salesAllowed && (
                          <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                            🔒 마스킹 유지 필수
                          </span>
                        )}
                        {item.key === 'canManagePackages' && salesAllowed && (
                          <span className="text-[10px] text-blue-800 bg-blue-100 font-bold px-1.5 py-0.5 rounded border border-blue-300">
                            ✨ 패키지 등록 가능
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reservation Staff Column */}
                    <td className="p-3.5 text-center bg-emerald-50/20 border-r border-emerald-100">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <button
                          disabled={!isMaster}
                          onClick={() =>
                            updateRolePermissions('reservation_staff', {
                              [item.key]: !resAllowed,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            resAllowed
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          } disabled:cursor-not-allowed`}
                        >
                          {resAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>허용 (ON)</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-stone-500" />
                              <span>제한 (OFF)</span>
                            </>
                          )}
                        </button>
                        {item.key === 'canViewUnmaskedCard' && resAllowed && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            💳 카드 원본조회 허용
                          </span>
                        )}
                        {item.key === 'canManagePackages' && !resAllowed && (
                          <span className="text-[10px] text-stone-600 bg-stone-100 font-bold px-1.5 py-0.5 rounded border border-stone-200">
                            🔒 패키지 등록 제한
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold">마스터 관리자 보안 가이드:</span>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              - <strong>영업사원 (`sales_agent`)</strong>: 고객의 개인정보 보호 및 카드정보 유출 방지를 위해 고객 카드번호는 마스킹 상태로만 열람 가능합니다. 패키지 상품 및 특가 등록 권한을 갖습니다.
              <br />- <strong>예약실 직원 (`reservation_staff`)</strong>: 실시간 예약 승인 및 노쇼 보증 결제를 위해 카드번호 원본 조회가 허용되며, 패키지 신규 등록 권한은 제한됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>승인 대기 중인 영업사원 ({pendingUsers.length}명)</span>
          </h3>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-xl text-stone-500 text-xs">
            현재 승인 대기 중인 신규 영업사원 가입 신청이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-stone-900 text-sm">{user.name}</span>
                    <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      사번: {user.employeeId}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 space-y-0.5 mt-2">
                    <p>이메일: {user.email}</p>
                    <p>연락처: {user.phone || '미입력'}</p>
                    <p className="text-[11px] text-stone-400">
                      신청일시: {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                  <button
                    disabled={!isMaster}
                    onClick={() => approveSalesAgent(user.id)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>가입 승인하기</span>
                  </button>

                  <button
                    disabled={!isMaster}
                    onClick={() => rejectSalesAgent(user.id)}
                    className="py-2 px-3 bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 disabled:opacity-50 font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>거절</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Agents List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>승인 완료된 관리자 계정 ({approvedUsers.length}명)</span>
          </h3>
          {isMaster && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-center">
              🔑 마스터 권한: 임직원 비밀번호 강제 초기화 및 재설정 가능
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-800">
            <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="p-3">성명</th>
                <th className="p-3">권한역할</th>
                <th className="p-3">사번 (ID)</th>
                <th className="p-3">이메일</th>
                <th className="p-3">연락처</th>
                <th className="p-3">비밀번호 상태</th>
                <th className="p-3 text-right">계정 및 비밀번호 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {approvedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="p-3 font-bold text-stone-900">
                    <div className="flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.id === currentAdmin?.id && (
                        <span className="text-[9px] font-extrabold bg-stone-900 text-white px-1.5 py-0.5 rounded">
                          (본인)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {u.role === 'master' ? (
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 inline-flex items-center gap-1">
                        👑 마스터 (최고권한)
                      </span>
                    ) : isMaster ? (
                      <select
                        value={u.role}
                        onChange={(e) => updateAdminRole(u.id, e.target.value as any)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-oak-green/30 cursor-pointer"
                      >
                        <option value="sales_agent">💼 영업사원</option>
                        <option value="reservation_staff">🎧 예약실 직원</option>
                      </select>
                    ) : u.role === 'reservation_staff' ? (
                      <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 inline-flex items-center gap-1">
                        🎧 예약실 직원
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300 inline-flex items-center gap-1">
                        💼 영업사원
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">{u.employeeId}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone || '-'}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>{u.password && u.password !== '1234' ? '변경됨 (사용자 지정)' : '기본값 (1234)'}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Password Reset Button for Master Admin */}
                      {isMaster && (
                        <button
                          type="button"
                          onClick={() => {
                            setResettingUser(u);
                            setCustomPassword('');
                            setShowPassword(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="비밀번호 초기화 또는 새 비밀번호 강제 설정"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          <span>비밀번호 재설정</span>
                        </button>
                      )}

                      {u.role === 'master' ? (
                        <span className="text-[10px] text-stone-400 font-mono italic px-2">
                          [마스터 계정]
                        </span>
                      ) : (
                        <button
                          disabled={!isMaster}
                          onClick={() => setDeletingUser(u)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="관리자 계정 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MASTER PASSWORD RESET MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    임직원 비밀번호 강제 재설정 / 초기화
                  </h3>
                  <p className="text-[11px] text-stone-500">마스터 최고관리자 권한으로 계정 비밀번호를 즉시 변경합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-semibold">대상 직원:</span>
                <span className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                  <span>{resettingUser.name}</span>
                  <span className="text-[10px] font-mono text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                    {resettingUser.employeeId}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-semibold">소속 역할:</span>
                <span className="font-bold text-stone-800">
                  {resettingUser.role === 'master' ? '👑 마스터 총괄' : resettingUser.role === 'reservation_staff' ? '🎧 예약실 직원' : '💼 영업사원'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-semibold">이메일 계정:</span>
                <span className="font-mono text-stone-700">{resettingUser.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-stone-200">
                <span className="text-stone-500 font-semibold">현재 비밀번호:</span>
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                  {resettingUser.password || '1234'}
                </span>
              </div>
            </div>

            {/* Option 1: Quick Reset to Default '1234' */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-700" />
                    <span>옵션 1. 기본 비밀번호(1234)로 즉시 초기화</span>
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    해당 직원의 비밀번호를 시스템 초기값인 <strong>'1234'</strong>로 즉시 복원합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetAdminUserPassword(resettingUser.id, '1234');
                  setResettingUser(null);
                }}
                className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>'1234'로 즉시 초기화 실행</span>
              </button>
            </div>

            {/* Option 2: Custom Password Set */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customPassword || customPassword.trim().length < 4) {
                  showToast('새 비밀번호는 최소 4자리 이상 입력해주세요.', 'error');
                  return;
                }
                resetAdminUserPassword(resettingUser.id, customPassword.trim());
                setResettingUser(null);
              }}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
            >
              <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-oak-green" />
                <span>옵션 2. 새로운 비밀번호 직접 지정하여 변경</span>
              </h4>

              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="새 비밀번호 입력 (4자리 이상)"
                    className="w-full pl-3 pr-20 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-oak-green"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                      title={showPassword ? '숨기기' : '보기'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {customPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(customPassword);
                          showToast('비밀번호가 클립보드에 복사되었습니다.', 'info');
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700"
                        title="복사"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>추천 비밀번호:</span>
                  </span>
                  {['oak2026!', 'hdc-resort1234', 'welcome2026', 'pass7788'].map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => setCustomPassword(suggested)}
                      className="text-[10px] font-mono font-bold bg-white hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md border border-stone-300 transition-colors cursor-pointer"
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!customPassword || customPassword.length < 4}
                  className="flex-1 py-2.5 bg-oak-green hover:bg-emerald-900 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>새 비밀번호로 변경 적용</span>
                </button>
              </div>
            </form>

            <p className="text-[11px] text-stone-400 text-center">
              ⚠️ 마스터 권한으로 재설정된 비밀번호는 시스템 보안 감사 로그에 실시간 기록됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-stone-900">
                관리자 계정을 삭제하시겠습니까?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                <strong className="text-stone-900">{deletingUser.name}</strong> ({deletingUser.employeeId} / {deletingUser.role === 'reservation_staff' ? '예약실' : '영업사원'}) 계정을 영구히 삭제합니다.
                <br />
                삭제 후 해당 사번 및 이메일로 더 이상 어드민에 로그인할 수 없습니다.
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">성명:</span>
                <span className="font-bold text-stone-900">{deletingUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">사번/ID:</span>
                <span className="font-bold text-stone-900">{deletingUser.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">이메일:</span>
                <span className="font-bold text-stone-900">{deletingUser.email}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  deleteAdminUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                삭제 진행
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

