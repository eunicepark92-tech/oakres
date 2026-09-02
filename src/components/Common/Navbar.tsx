import React from 'react';
import { useApp } from '../../context/AppContext';
import { OakValleyLogo } from './OakValleyLogo';
import { Search, LogOut, UserCheck, Building2, Trees, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onOpenLookup: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLookup, onGoHome }) => {
  const {
    activeMode,
    setActiveMode,
    currentPartner,
    currentAdmin,
    logoutPartner,
    logoutAdmin,
    darkMode,
    toggleDarkMode,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#B7834A] dark:bg-[#1E1712] text-white border-b border-amber-800/40 dark:border-stone-800 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand & Partner Logo Display */}
        <div className="flex items-center gap-2 sm:gap-4">
          <OakValleyLogo
            size="md"
            onClick={() => {
              setActiveMode('user');
              if (onGoHome) onGoHome();
            }}
          />

          {/* PARTNER LOGO DISPLAY ON TOP LEFT WHEN AUTHENTICATED IN USER MODE */}
          {activeMode === 'user' && currentPartner && (
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/15 animate-fade-in">
              <div className="h-9 px-3 py-1 bg-white/95 dark:bg-stone-900 rounded-lg flex items-center gap-2 shadow-sm border border-stone-200 dark:border-stone-700">
                {currentPartner.logoUrl ? (
                  <img
                    src={currentPartner.logoUrl}
                    alt={currentPartner.name}
                    className="h-6 max-w-[100px] object-contain"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-oak-green" />
                )}
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 border-l border-stone-300 dark:border-stone-700 pl-2">
                  {currentPartner.name}
                </span>
              </div>
              <span className="text-xs text-amber-300 font-medium px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/30">
                인증 완료
              </span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="min-h-[44px] min-w-[44px] p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-[#2D1B10] dark:bg-stone-800/90 hover:bg-[#1A0E07] dark:hover:bg-stone-700 text-amber-200 dark:text-amber-300 border border-amber-300/30 dark:border-stone-700 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-amber-200" />
            )}
            <span className="hidden md:inline text-xs font-bold">
              {darkMode ? '라이트' : '다크'}
            </span>
          </button>

          {/* Reservation Lookup Button for User */}
          {activeMode === 'user' && (
            <button
              onClick={onOpenLookup}
              className="min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-[#2D1B10] hover:bg-[#1A0E07] dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-100 font-bold text-xs sm:text-sm border border-amber-300/40 dark:border-stone-700 shadow-sm transition-all cursor-pointer active:scale-95"
              title="예약 내역 조회"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span>예약 조회</span>
            </button>
          )}

          {/* Admin mode: User view switch button */}
          {activeMode === 'admin' && (
            <button
              onClick={() => setActiveMode('user')}
              className="min-h-[44px] px-3.5 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="사용자 화면으로 이동"
            >
              <Trees className="w-4 h-4 text-stone-900" />
              <span className="hidden xs:inline">사용자 화면</span>
            </button>
          )}

          {/* User Status / Logout Buttons */}
          {activeMode === 'user' && currentPartner && (
            <button
              onClick={logoutPartner}
              className="min-h-[44px] min-w-[44px] p-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[#2D1B10] hover:bg-red-950 text-stone-300 hover:text-red-200 border border-amber-300/30 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              title="제휴사 인증 해제"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {activeMode === 'admin' && currentAdmin && (
            <div className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 bg-[#2D1B10] dark:bg-stone-800/90 px-3 py-2 sm:px-3 sm:py-2.5 rounded-xl border border-amber-300/30 dark:border-stone-700 text-xs">
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span className="font-semibold text-amber-100 hidden sm:inline">
                {currentAdmin.role === 'master' ? '[마스터]' : '[영업사원]'}{' '}
                {currentAdmin.name}
              </span>
              <button
                onClick={logoutAdmin}
                className="ml-1 min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-rose-300 p-1 cursor-pointer rounded-lg hover:bg-rose-950/40"
                title="관리자 로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Partner Banner when authenticated */}
      {activeMode === 'user' && currentPartner && (
        <div className="sm:hidden bg-[#24170F] dark:bg-[#141418] border-t border-amber-900/40 dark:border-stone-800 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentPartner.logoUrl ? (
              <img
                src={currentPartner.logoUrl}
                alt={currentPartner.name}
                className="h-5 max-w-[70px] object-contain bg-white px-1 rounded shrink-0"
              />
            ) : (
              <Building2 className="w-4 h-4 text-oak-gold shrink-0" />
            )}
            <span className="font-bold text-amber-200 truncate">{currentPartner.name} 전용</span>
          </div>
          <span className="text-[11px] font-mono text-amber-300/80 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
            {currentPartner.code}
          </span>
        </div>
      )}
    </header>
  );
};

