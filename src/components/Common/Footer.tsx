import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OakValleyLogo } from './OakValleyLogo';
import { PolicyModals, PolicyTab } from './PolicyModals';
import { PhoneCall, Shield, MapPin, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveMode } = useApp();
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('privacy');

  const handleOpenPolicy = (tab: PolicyTab) => {
    setPolicyTab(tab);
    setIsPolicyOpen(true);
  };

  return (
    <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div className="flex items-center gap-2">
            <OakValleyLogo size="sm" showSubtitle={false} />
            <div className="ml-1">
              <p className="text-[11px] text-stone-400">오크밸리리조트 제휴사 임직원 전용 스마트 예약 시스템</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-stone-300">
            <button
              type="button"
              onClick={() => handleOpenPolicy('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              개인정보 처리방침
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <span className="text-stone-700">|</span>
            <button
              type="button"
              onClick={() => handleOpenPolicy('guarantee')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              오픈카드 보증안내
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-stone-400 leading-relaxed">
          <div className="space-y-1">
            <p className="font-bold text-stone-300">법인명: 아이파크리조트 주식회사 | 대표자: 조영환</p>
            <p>사업자등록번호: 224-81-06308 | 법인등록번호: 141211-0005540</p>
            <p>통신판매신고번호: 2006-강원원주-00147</p>
            <p className="flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-oak-gold shrink-0" />
              <span>강원도 원주시 지정면 오크밸리1길 66, 1층</span>
            </p>
          </div>

          <div className="space-y-2 md:text-right">
            <p className="font-bold text-stone-300 flex items-center md:justify-end gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              <span>고객센터 & 제휴문의: 1588-7676 (운영시간 09:00~18:00)</span>
            </p>
            <p className="text-stone-500 text-[11px]">
              © 2026 Oak Valley Resort / IPARK RESORT. All rights reserved.
            </p>
            <div className="pt-1 flex items-center md:justify-end">
              <button
                type="button"
                onClick={() => setActiveMode('admin')}
                className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-300 text-xs py-1 px-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 transition-colors cursor-pointer"
                title="오크밸리리조트 관리자 페이지 이동"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-oak-gold" />
                <span className="font-medium">관리자 페이지 진입</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <PolicyModals
        isOpen={isPolicyOpen}
        initialTab={policyTab}
        onClose={() => setIsPolicyOpen(false)}
      />
    </footer>
  );
};
