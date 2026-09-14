import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, ShieldCheck, ArrowRight, User, Loader2, Info } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              type="button"
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
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-oak-gold text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <span>계정 신청 안내</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  관리자 계정 이메일
                </label>
                <div className="relative">
                  <input
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
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oak-green/40 transition-colors disabled:opacity-50"
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
                disabled={isLoading}
                className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Tab 2: Sales Agent Sign-up Guide */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                관리자 계정 생성 안내
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-md mx-auto">
                보안 정책에 따라 관리자 및 영업사원 계정은 마스터 총괄 관리자에게 직접 계정 생성을 요청해 주세요.
              </p>
              <div className="pt-2 text-xs font-bold text-oak-green dark:text-oak-gold">
                총괄 문의: master@oakvalley.co.kr
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
