import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, Key, User, Phone, Mail, BadgeCheck, X, Check, Lock, Shield } from 'lucide-react';

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentAdmin, updateAdminProfile, changeAdminPassword, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Edit State
  const [name, setName] = useState(currentAdmin?.name || '');
  const [phone, setPhone] = useState(currentAdmin?.phone || '');
  const [employeeId, setEmployeeId] = useState(currentAdmin?.employeeId || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Keep form inputs synced with currentAdmin
  React.useEffect(() => {
    if (currentAdmin && isOpen) {
      setName(currentAdmin.name || '');
      setPhone(currentAdmin.phone || '');
      setEmployeeId(currentAdmin.employeeId || '');
    }
  }, [currentAdmin, isOpen]);

  if (!isOpen || !currentAdmin) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('이름을 입력해주세요.', 'error');
      return;
    }
    updateAdminProfile(currentAdmin.id, {
      name: name.trim(),
      phone: phone.trim(),
      employeeId: employeeId.trim(),
    });
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('현재 비밀번호를 입력해주세요.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showToast('새 비밀번호는 최소 4자리 이상 입력해주세요.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    const success = changeAdminPassword(currentAdmin.id, currentPassword, newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'master') return '👑 마스터 총괄자';
    if (role === 'reservation_staff') return '🛎️ 예약실 담당자';
    return '💼 영업사원 담당자';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-oak-green/20 text-oak-green border border-oak-green/40 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">내 계정 & 비밀번호 관리</h3>
              <p className="text-[11px] text-stone-400">개인 프로필 정보 수정 및 접근 비밀번호를 변경합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>{currentAdmin.name}</span>
              <span className="text-[10px] font-mono text-stone-500 bg-stone-200/80 px-1.5 py-0.5 rounded">
                {currentAdmin.employeeId}
              </span>
            </span>
            <p className="text-[11px] text-stone-500">{currentAdmin.email}</p>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-oak-green/10 text-oak-green border border-oak-green/30 shrink-0">
            {getRoleLabel(currentAdmin.role)}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/60">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-stone-900 border-stone-900 shadow-sm'
                : 'text-stone-500 border-transparent hover:text-stone-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>기본 프로필 수정</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-amber-700 border-amber-600 shadow-sm'
                : 'text-stone-500 border-transparent hover:text-stone-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>비밀번호 변경</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* TAB A: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>이름 <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>사번 (Employee ID)</span>
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>휴대전화 번호</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-oak-green/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>이메일 계정 (변경 불가)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={currentAdmin.email}
                  className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-mono text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-oak-green text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>프로필 정보 저장</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB B: PASSWORD CHANGE */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  안전한 시스템 운영을 위해 주기적으로 비밀번호를 변경해 주세요. (기본 비밀번호: 1234)
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  현재 비밀번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  새 비밀번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (최소 4자리 이상)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  새 비밀번호 확인 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 재입력"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>비밀번호 변경 완료</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 text-stone-800 font-bold text-xs rounded-lg hover:bg-stone-300 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
