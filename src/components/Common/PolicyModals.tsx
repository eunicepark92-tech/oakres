import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CreditCard, X, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'guarantee';

interface PolicyModalsProps {
  isOpen: boolean;
  initialTab?: PolicyTab;
  onClose: () => void;
}

export const PolicyModals: React.FC<PolicyModalsProps> = ({ isOpen, initialTab = 'privacy', onClose }) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-oak-gold/20 text-oak-gold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">오크밸리리조트 약관 및 고객 보호 정책</h3>
              <p className="text-[11px] text-stone-400">오크밸리리조트 제휴 임직원 스마트 예약 시스템 안전 가이드</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-white text-oak-green border-oak-green shadow-sm'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>개인정보 처리방침</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white text-oak-green border-oak-green shadow-sm'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>서비스 이용약관</span>
          </button>

          <button
            onClick={() => setActiveTab('guarantee')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'guarantee'
                ? 'bg-white text-amber-700 border-amber-600 shadow-sm'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>💳 오픈카드 보증안내</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 leading-relaxed flex-1">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-emerald-900 text-sm">개인정보 수집 및 이용 목적</h4>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    아이파크리조트 오크밸리리조트는 제휴사 임직원의 편리한 리조트 이용 및 객실 예약을 위해 최소한의 개인정보만을 수집하며, 암호화된 전송 및 엄격한 보안 하에 관리합니다.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-extrabold text-stone-900 text-xs text-oak-green">1. 수집하는 개인정보 항목</h5>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>필수항목:</strong> 예약자 성명, 휴대전화번호, 이메일, 제휴사 코드 및 법인명, 입실/퇴실 희망일, 예약 객실수</li>
                  <li><strong>보증항목 (오픈카드):</strong> 카드사명, 신용카드 번호(보안 마스킹 수집), 유효기간(MM/YY), 소유자 성명</li>
                  <li><strong>자동 수집항목:</strong> 접속 IP 주소, 접속 일시, 서비스 이용 기록</li>
                </ul>

                <h5 className="font-extrabold text-stone-900 text-xs text-oak-green">2. 개인정보 수집 및 이용 목적</h5>
                <p>
                  - 오크밸리리조트 임직원 우대 패키지 예약 접수 및 PMS(Property Management System) 연동 확정 처리<br />
                  - 예약 확정 알림톡/SMS 발송 및 입실 전 안내 서비스 제공<br />
                  - 노쇼(No-Show) 및 입실 임박 취소 시 위약금 보증 처리를 위한 오픈카드 가승인
                </p>

                <h5 className="font-extrabold text-stone-900 text-xs text-oak-green">3. 개인정보의 보유 및 이용 기간</h5>
                <p>
                  전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 관련 법령에서 정한 일정한 기간 동안 회원 및 예약 정보를 보관합니다.
                </p>
                <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 text-[11px]">
                  • 계약 또는 청약철회 등에 관한 기록: 5년<br />
                  • 대금결제 및 재화 등의 공급에 관한 기록: 5년<br />
                  • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
                </div>

                <h5 className="font-extrabold text-stone-900 text-xs text-oak-green">4. 제3자 제공에 관한 사항</h5>
                <p>
                  수집된 예약자 정보는 리조트 현장 프론트 데스크 운영사인 아이파크리조트(주) PMS 시스템에 예약 이행 목적으로만 일치되어 연동 제공되며, 타 용도로는 유출 및 이용되지 않습니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200">
                <h4 className="font-extrabold text-stone-900 text-sm">제휴사 임직원 전용 스마트 예약 시스템 이용약관</h4>
                <p className="text-stone-500 text-[11px] mt-0.5">시행일자: 2026년 1월 1일</p>
              </div>

              <div className="space-y-3">
                <h5 className="font-extrabold text-stone-900 text-xs">제 1 조 (목적)</h5>
                <p>
                  본 약관은 아이파크리조트 오크밸리리조트(이하 "리조트")가 제공하는 제휴사 임직원 전용 우대 예약 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 리조트 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>

                <h5 className="font-extrabold text-stone-900 text-xs">제 2 조 (제휴 인증 및 자격)</h5>
                <p>
                  본 서비스는 리조트와 정식 제휴 협약이 체결된 법인 임직원만 이용할 수 있습니다. 예약 시 지정된 제휴사 코드를 입력해야 하며, 체크인 시 사원증 또는 임직원 증빙 서류 지참을 요구받을 수 있습니다. 증빙 미제출 시 우대 요금 적용이 취소되고 일반 요금이 적용될 수 있습니다.
                </p>

                <h5 className="font-extrabold text-stone-900 text-xs">제 3 조 (예약 확정 및 PMS 연동)</h5>
                <p>
                  온라인을 통한 예약 신청은 '예약 대기' 상태이며, 리조트 예약실 담당자의 PMS(객실관리시스템) 검토 후 최종 'PMS 예약번호'가 부여됨으로써 예약이 완전 확정됩니다.
                </p>

                <h5 className="font-extrabold text-stone-900 text-xs">제 4 조 (취소 및 위약금 규정)</h5>
                <p>
                  예약의 변경 및 취소는 입실 기준 취소 규정(시즌별 및 입실 D-Day 기준)에 따라 처리되며, 위약금 발생 기간 내 취소 또는 노쇼 시 등록된 오픈카드로 규정된 위약금이 자진 가승인 및 매입 처리됩니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: OPEN CARD GUARANTEE */}
          {activeTab === 'guarantee' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">오픈카드(Open-Card) 보증 제도란?</h4>
                  <p className="text-amber-900 text-[11px] mt-0.5">
                    예약 시점에 실제 카드 결제가 이루어지지 않는 <strong>0원 사전 보증 결제 시스템</strong>입니다. 
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                    01
                  </div>
                  <h5 className="font-extrabold text-stone-900 text-xs pt-1">예약 시 0원 보증</h5>
                  <p className="text-[11px] text-stone-500">
                    예약 접수 시에는 신용카드 승인액 0원으로 카드 유효성만 확인합니다.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                    02
                  </div>
                  <h5 className="font-extrabold text-stone-900 text-xs pt-1">현장 결제 진행</h5>
                  <p className="text-[11px] text-stone-500">
                    숙박 당일 오크밸리리조트 프론트에서 원하시는 결제 수단으로 결제합니다.
                  </p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center justify-center">
                    03
                  </div>
                  <h5 className="font-extrabold text-stone-900 text-xs pt-1">위약금 발생 시 차감</h5>
                  <p className="text-[11px] text-stone-500">
                    사전 연락 없이 노쇼(No-Show) 및 규정 위반 취소 시에만 약정 위약금이 보증카드로 청구됩니다.
                  </p>
                </div>
              </div>

              <div className="bg-stone-900 text-stone-300 p-4 rounded-2xl space-y-2 border border-stone-800 text-[11px]">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>카드 보안 규정 (PCI-DSS 및 암호화)</span>
                </div>
                <p>
                  입력하신 보증 카드 정보는 마스킹 처리되어 데이터베이스에 안전하게 관리되며, 오크밸리리조트 보안 인증 관리자 외에는 열람할 수 없도록 이중 암호화 처리됩니다.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>오크밸리리조트 통합 예약 시스템은 개인정보보호법 및 가맹점 표준 규정을 준수합니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
