import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, UserPlus, ShieldCheck, UserCheck, ArrowRight, Building2, User } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, registerSalesAgent, adminUsers } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup Form
  const [regName, setRegName] = useState('');
  const [regEmailPrefix, setRegEmailPrefix] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = loginAdmin(loginId, loginPw);
    if (!res.success && res.message) {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg('');
    setRegSuccessMsg('');

    const fullEmail = `${regEmailPrefix.trim().replace(/@.*/, '')}@hdc-resort.com`;

    if (!regName.trim() || !regEmailPrefix.trim() || !regEmployeeId.trim()) {
      setRegErrorMsg('모든 필수 항목을 입력해주세요.');
      return;
    }

    const res = registerSalesAgent({
      name: regName,
      email: fullEmail,
      phone: regPhone,
      employeeId: regEmployeeId,
    });

    if (res.success) {
      setRegSuccessMsg('영업사원 가입 신청이 성공적으로 접수되었습니다. 마스터 승인 후 로그인 가능합니다.');
      setRegName('');
      setRegEmailPrefix('');
      setRegPhone('');
      setRegEmployeeId('');
    } else {
      setRegErrorMsg(res.message || '가입 신청 중 오류가 발생했습니다.');
    }
  };

  const pendingAgentsCount = adminUsers.filter((u) => u.role === 'sales_agent' && !u.approved).length;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-[#F8F7F2] dark:bg-[#121214] transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C22] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        
        {/* Header Tabs */}
        <div className="bg-oak-dark text-white p-6 sm:p-8 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-oak-gold/20 border border-oak-gold/40 flex items-center justify-center text-oak-gold mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">오크밸리리조트 통합 관리자 센터</h2>
          <p className="text-xs text-stone-300 mt-1">마스터 총괄 및 영업사원 통합 제어</p>

          <div className="flex bg-black/40 p-1 rounded-xl mt-5 sm:mt-6 border border-white/10">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-oak-gold text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              관리자 로그인
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-oak-gold text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>영업사원 가입 신청</span>
              {pendingAgentsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingAgentsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  사번 또는 이메일
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="사번 또는 사내 이메일 입력"
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>관리자 로그인</span>
                <ArrowRight className="w-4 h-4 text-oak-gold" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Sales Agent Sign-up Form */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  영업사원 사번 (Employee ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regEmployeeId}
                  onChange={(e) => setRegEmployeeId(e.target.value.toUpperCase())}
                  placeholder="예: SALE-101"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  사내 이메일 주소 <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-oak-green/30">
                  <input
                    type="text"
                    required
                    value={regEmailPrefix}
                    onChange={(e) => setRegEmailPrefix(e.target.value.replace(/@.*/, ''))}
                    placeholder="sales"
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-sm font-medium text-stone-900 dark:text-white focus:outline-none"
                  />
                  <span className="px-3.5 py-2.5 bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-mono text-xs font-bold border-l border-stone-300 dark:border-stone-600 shrink-0">
                    @hdc-resort.com
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/30"
                />
              </div>

              {regSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              {regErrorMsg && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  {regErrorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                가입 신청하기 (마스터 승인 대기)
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
