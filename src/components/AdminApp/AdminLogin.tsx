import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, ShieldCheck, ArrowRight, User, Loader2, Info, Mail, Phone, Building } from 'lucide-react';
import { UserProfileRole } from '../../types';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, partners, signUpProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register Form
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserProfileRole>('STAFF');
  const [regPartnerId, setRegPartnerId] = useState('');
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setLoginError('');
    setIsLoading(true);

    try {
      const res = await loginAdmin(loginEmail, loginPw);
      if (!res.success && res.message) {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginError('로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regIsLoading) return;

    setRegError('');
    setRegSuccess('');
    setRegIsLoading(true);

    try {
      const res = await signUpProfile({
        email: regEmail.trim(),
        pass: regPw,
        name: regName.trim(),
        phone: regPhone.trim(),
        role: regRole,
        partnerId: regRole === 'PARTNER' ? regPartnerId : undefined,
      });

      if (res.success) {
        setRegSuccess(res.message);
        // Clear form
        setRegEmail('');
        setRegPw('');
        setRegName('');
        setRegPhone('');
        setRegPartnerId('');
      } else {
        setRegError(res.message);
      }
    } catch (err: any) {
      setRegError('가입 신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setRegIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-[#F8F7F2] dark:bg-[#121214] transition-colors" id="admin-login-container">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C22] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors" id="admin-login-card">
        
        {/* Header Tabs */}
        <div className="bg-oak-dark text-white p-6 sm:p-8 text-center relative" id="admin-login-header">
          <div className="w-12 h-12 rounded-2xl bg-oak-gold/20 border border-oak-gold/40 flex items-center justify-center text-oak-gold mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">오크밸리리조트 통합 관리자 센터</h2>
          <p className="text-xs text-stone-300 mt-1 font-medium">마스터 총괄, 영업사원 및 제휴 파트너 포털</p>

          <div className="flex bg-black/40 p-1 rounded-xl mt-5 sm:mt-6 border border-white/10" id="admin-tab-buttons">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setRegError('');
                setRegSuccess('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-oak-gold text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              관리자 로그인
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-oak-gold text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <span>계정 / 제휴 신청</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-6" id="login-form-tab">
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                  관리자 계정 이메일
                </label>
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="예: master@oakvalley.co.kr"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="비밀번호 입력"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800" id="login-error-message">
                  {loginError}
                </p>
              )}

              <button
                id="login-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-oak-gold animate-spin" />
                    <span>인증 확인 중...</span>
                  </>
                ) : (
                  <>
                    <span>관리자 로그인</span>
                    <ArrowRight className="w-4 h-4 text-oak-gold" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Register Form */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8 space-y-6" id="register-form-tab">
            <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    성함 / 담당자명
                  </label>
                  <div className="relative">
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="홍길동"
                      disabled={regIsLoading}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                    />
                    <User className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    휴대폰 번호
                  </label>
                  <div className="relative">
                    <input
                      id="reg-phone-input"
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      disabled={regIsLoading}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                    />
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                  로그인 이메일 (계정 ID)
                </label>
                <div className="relative">
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="example@partner.com"
                    disabled={regIsLoading}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                  비밀번호 설정
                </label>
                <div className="relative">
                  <input
                    id="reg-password-input"
                    type="password"
                    required
                    value={regPw}
                    onChange={(e) => setRegPw(e.target.value)}
                    placeholder="6자리 이상 비밀번호 설정"
                    disabled={regIsLoading}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                  신청 계정 유형
                </label>
                <div className="flex gap-4 bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800" id="reg-role-radio-group">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                    <input
                      type="radio"
                      name="regRole"
                      value="STAFF"
                      checked={regRole === 'STAFF'}
                      onChange={() => setRegRole('STAFF')}
                      className="accent-oak-green"
                    />
                    <span>리조트 본사 STAFF</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                    <input
                      type="radio"
                      name="regRole"
                      value="PARTNER"
                      checked={regRole === 'PARTNER'}
                      onChange={() => setRegRole('PARTNER')}
                      className="accent-oak-green"
                    />
                    <span>제휴 파트너 (PARTNER)</span>
                  </label>
                </div>
              </div>

              {regRole === 'PARTNER' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    소속 제휴사 선택
                  </label>
                  <div className="relative">
                    <select
                      id="reg-partner-select"
                      required={regRole === 'PARTNER'}
                      value={regPartnerId}
                      onChange={(e) => setRegPartnerId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors"
                    >
                      <option value="">-- 소속 제휴 기업을 선택하세요 --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                    <Building className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>
              )}

              {regError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800" id="reg-error-message">
                  {regError}
                </p>
              )}

              {regSuccess && (
                <div className="text-xs text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1" id="reg-success-message">
                  <div className="flex items-center gap-1">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>신청 접수 완료!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                    {regSuccess}
                  </p>
                </div>
              )}

              <button
                id="reg-submit-button"
                type="submit"
                disabled={regIsLoading}
                className="w-full py-3 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {regIsLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-oak-gold animate-spin" />
                    <span>가입 신청 전송 중...</span>
                  </>
                ) : (
                  <>
                    <span>회원가입 / 제휴 신청 접수</span>
                    <ArrowRight className="w-3.5 h-3.5 text-oak-gold" />
                  </>
                )}
              </button>

              <button
                id="reg-back-to-login-btn"
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setRegError('');
                  setRegSuccess('');
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                로그인 화면으로 돌아가기
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
