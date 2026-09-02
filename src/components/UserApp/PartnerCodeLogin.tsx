import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OakValleyLogo } from '../Common/OakValleyLogo';
import { ShieldCheck, ArrowRight, Building2, Sparkles, KeyRound } from 'lucide-react';

export const PartnerCodeLogin: React.FC = () => {
  const { authenticatePartnerCode, setActiveMode } = useApp();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('제휴사 코드를 입력해주세요.');
      return;
    }
    setErrorMsg('');
    const result = authenticatePartnerCode(code);
    if (!result.success && result.message) {
      setErrorMsg(result.message);
    }
  };

  const handleQuickCode = (quickCode: string) => {
    setCode(quickCode);
    setErrorMsg('');
    authenticatePartnerCode(quickCode);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-[#F8F7F2]">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Value Proposition */}
        <div className="md:col-span-7 space-y-6 pr-0 md:pr-4">
          <div className="flex items-center gap-3">
            <OakValleyLogo size="lg" showSubtitle={false} textColorClass="text-[#B7834A]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-900 text-xs font-semibold border border-[#B7834A]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#B7834A]" />
            <span>오크밸리리조트 제휴 임직원 전용 우대 서비스</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 leading-tight tracking-tight">
            자연과 함께하는 완벽한 휴식,<br />
            <span className="text-oak-green">임직원 전용 패키지</span>로 모십니다
          </h1>

          <p className="text-sm text-stone-600 leading-relaxed font-normal">
            오크밸리리조트와 협약을 맺은 제휴기업 임직원분들을 위한 특별 우대 가격 및 단독 전용 패키지를 제공합니다. 부여받으신 제휴사 코드를 입력해주세요.
          </p>
        </div>

        {/* Right Side: Code Verification Card */}
        <div className="md:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-oak-green/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-2 text-oak-green font-bold text-sm mb-2">
              <KeyRound className="w-4 h-4 text-oak-gold" />
              <span>제휴사 코드 인증</span>
            </div>

            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              제휴 코드를 입력하세요
            </h2>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              사내 복지몰 또는 영업 담당자가 전달한 영문/숫자 코드를 입력해주세요.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  제휴사 코드 (Partner Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    placeholder="예: OAKVALLEY2026"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-oak-green/30 focus:border-oak-green transition-all tracking-wider text-base"
                  />
                  <Building2 className="w-5 h-5 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
                {errorMsg && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium animate-shake">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-oak-green hover:bg-oak-dark text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>제휴사 인증 및 입장하기</span>
                <ArrowRight className="w-4 h-4 text-oak-gold group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-stone-800 text-center">
              <button
                type="button"
                onClick={() => setActiveMode('admin')}
                className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-oak-green" />
                <span>오크밸리리조트 관리자 센터 바로가기</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
