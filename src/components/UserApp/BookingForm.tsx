import React, { useState } from 'react';
import { Package, RoomType, Reservation } from '../../types';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, User, Phone, Mail, FileText, Lock, CreditCard, ShieldCheck, CheckSquare, Square, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';

interface BookingFormProps {
  selectedPackage: Package;
  selectedRoom: RoomType;
  bookingSpecs: {
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
  };
  onBack: () => void;
  onBookingComplete: (reservation: Reservation) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedPackage,
  selectedRoom,
  bookingSpecs,
  onBack,
  onBookingComplete,
}) => {
  const { createReservation, currentPartner } = useApp();

  // Booker Info State
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');
  const [customDomain, setCustomDomain] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Helper for phone formatting
  const formatPhoneNumber = (value: string) => {
    const nums = value.replace(/[^0-9]/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    if (nums.length <= 11) return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  // Terms Agreement State
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeCancelPolicy, setAgreeCancelPolicy] = useState(false);

  // Accordion toggle state for terms text
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [showThirdPartyDetail, setShowThirdPartyDetail] = useState(false);
  const [showCancelDetail, setShowCancelDetail] = useState(false);

  // Open Card Guarantee State
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber1, setCardNumber1] = useState('');
  const [cardNumber2, setCardNumber2] = useState('');
  const [cardNumber3, setCardNumber3] = useState('');
  const [cardNumber4, setCardNumber4] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardType, setCardType] = useState('삼성카드');

  const [formError, setFormError] = useState('');

  const handleAgreeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreePrivacy(checked);
    setAgreeThirdParty(checked);
    setAgreeCancelPolicy(checked);
  };

  const isAllAgreed = agreePrivacy && agreeThirdParty && agreeCancelPolicy;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!bookerName.trim()) {
      setFormError('예약자명을 입력해주세요.');
      return;
    }
    if (!bookerPhone.trim() || bookerPhone.replace(/[^0-9]/g, '').length < 10) {
      setFormError('올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678).');
      return;
    }

    const domainPart = emailDomain === 'custom' ? customDomain.trim() : emailDomain;
    if (!emailPrefix.trim() || !domainPart) {
      setFormError('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    const fullEmail = domainPart.includes('@') ? domainPart : `${emailPrefix.trim()}@${domainPart}`;

    if (!agreePrivacy || !agreeThirdParty || !agreeCancelPolicy) {
      setFormError('모든 필수 약관에 동의하셔야 예약을 진행할 수 있습니다.');
      return;
    }

    if (!cardholderName.trim()) {
      setFormError('오픈카드 소유자명을 입력해주세요.');
      return;
    }

    const fullCardNum = `${cardNumber1}-${cardNumber2}-${cardNumber3}-${cardNumber4}`;
    if (cardNumber1.length !== 4 || cardNumber4.length !== 4) {
      setFormError('오픈카드 번호 16자리를 올바르게 입력해주세요.');
      return;
    }

    if (!cardExpiry.trim() || cardExpiry.length < 4) {
      setFormError('카드 유효기간(MM/YY)을 입력해주세요.');
      return;
    }

    const maskedCard = `${cardNumber1}-${cardNumber2.replace(/./g, '*')}-${cardNumber3.replace(/./g, '*')}-${cardNumber4}`;

    // Auto scroll top smoothly on submit
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Create Reservation
    const newReservation = createReservation({
      partnerCode: currentPartner?.code || 'ALL',
      partnerName: currentPartner?.name || '제휴사 전용',
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      roomTypeId: selectedRoom.id,
      roomTypeName: selectedRoom.name,
      checkIn: bookingSpecs.checkIn,
      checkOut: bookingSpecs.checkOut,
      nights: bookingSpecs.nights,
      roomCount: bookingSpecs.roomCount,
      totalPrice: bookingSpecs.totalPrice,
      originalTotalPrice: bookingSpecs.originalTotalPrice,
      discountAmount: bookingSpecs.discountAmount,
      bookerName,
      bookerPhone,
      bookerEmail: fullEmail,
      specialRequests,
      guaranteeCard: {
        cardholderName,
        cardNumberMasked: maskedCard,
        cardNumberFull: fullCardNum,
        cardExpiry,
        cardType,
      },
    });

    onBookingComplete(newReservation);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <button
          onClick={onBack}
          className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>객실 다시 선택</span>
        </button>

        <h2 className="text-base sm:text-2xl font-extrabold text-stone-900">
          예약자 정보 입력 & 오픈카드 보증
        </h2>
      </div>

      {/* Selected Order Summary Card */}
      <div className="bg-oak-dark text-white p-5 sm:p-6 rounded-2xl border border-amber-900/40 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-bold text-oak-gold uppercase tracking-wider">
            {currentPartner?.name} 임직원 예약 내역
          </span>
          <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
            현장 결제 예정
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-stone-300 font-medium">선택 패키지:</p>
            <p className="text-base font-extrabold text-white mt-0.5">{selectedPackage.name}</p>
          </div>
          <div>
            <p className="text-stone-300 font-medium">선택 객실:</p>
            <p className="text-base font-extrabold text-amber-300 mt-0.5">{selectedRoom.name}</p>
          </div>
          <div>
            <p className="text-stone-300 font-medium">투숙 일정:</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {bookingSpecs.checkIn} ~ {bookingSpecs.checkOut} ({bookingSpecs.nights}박 / {bookingSpecs.roomCount}실)
            </p>
          </div>
          <div>
            <p className="text-stone-300 font-medium">결제 예정 금액 (현장):</p>
            <p className="text-xl font-black text-amber-300 mt-0.5">
              {bookingSpecs.totalPrice.toLocaleString()}원{' '}
              <span className="text-xs text-stone-400 font-normal line-through">
                ({bookingSpecs.originalTotalPrice.toLocaleString()}원)
              </span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Booker Information Inputs */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b pb-3">
            <User className="w-5 h-5 text-oak-green" />
            <span>예약자 (투숙자) 정보</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                예약자 성명 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                휴대폰 번호 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={bookerPhone}
                  onChange={(e) => setBookerPhone(formatPhoneNumber(e.target.value))}
                  placeholder="예: 010-1234-5678"
                  className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                ※ 숫자만 입력해도 하이픈(-)이 자동 입력됩니다. (예약 조회 시 뒷자리 4자리 사용)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                이메일 주소 <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    required
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value.replace(/@.*/, ''))}
                    placeholder="이메일 아이디"
                    className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
                <span className="hidden sm:inline font-bold text-stone-500 text-sm">@</span>
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <select
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    className="w-full px-3 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-oak-green/30 cursor-pointer min-h-[44px]"
                  >
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="hanmail.net">hanmail.net</option>
                    <option value="kakao.com">kakao.com</option>
                    <option value="nate.com">nate.com</option>
                    <option value="custom">✏️ 직접 입력</option>
                  </select>

                  {emailDomain === 'custom' && (
                    <input
                      type="text"
                      required
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="도메인 입력"
                      className="w-full px-3 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                특별 요청사항 (선택)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                placeholder="예: 고층 객실 배정, 아기 침대 대여 등"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-oak-green/30"
              />
            </div>
          </div>
        </div>

        {/* 2. Open Card Guarantee Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-oak-green" />
              <span>오픈카드 (Open Card) 보증 등록</span>
            </h3>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              현장결제 전용 보증
            </span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-xs text-stone-600 space-y-1.5">
            <p className="font-bold text-stone-900 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>오픈카드 보증 안내</span>
            </p>
            <p className="leading-relaxed">
              • 결제는 투숙 당일 리조트 프론트에서 진행됩니다.<br />
              • 본 오픈카드 등록은 노쇼(No-show) 방지 및 예약 확정을 위한 안전 보증용이며, 입실 전 승인 결제가 이루어지지 않습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                카드종류 선택 <span className="text-rose-500">*</span>
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none min-h-[44px]"
              >
                {['삼성카드', '현대카드', 'KB국민카드', '신한카드', '롯데카드', '하나카드', 'BC카드', 'NH농협카드'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                카드 소유자 성명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                placeholder="영문 또는 한글 성명"
                className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                카드 번호 (16자리) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardNumber1}
                  onChange={(e) => setCardNumber1(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1234"
                  className="px-2 sm:px-3 py-2.5 sm:py-3 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardNumber2}
                  onChange={(e) => setCardNumber2(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="px-2 sm:px-3 py-2.5 sm:py-3 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={cardNumber3}
                  onChange={(e) => setCardNumber3(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="px-2 sm:px-3 py-2.5 sm:py-3 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={cardNumber4}
                  onChange={(e) => setCardNumber4(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="5678"
                  className="px-2 sm:px-3 py-2.5 sm:py-3 bg-stone-50 border border-stone-300 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                카드 유효기간 (MM/YY) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={5}
                required
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="예: 10/28"
                className="w-full px-3.5 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-oak-green/30 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* 3. Terms & Conditions Agreement Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-oak-green" />
              <span>약관 동의 및 개인정보 처리방침</span>
            </h3>

            {/* Agree All */}
            <label className="min-h-[44px] flex items-center gap-2 cursor-pointer font-bold text-xs text-oak-dark bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-300 active:scale-98">
              <input
                type="checkbox"
                checked={isAllAgreed}
                onChange={handleAgreeAll}
                className="hidden"
              />
              {isAllAgreed ? (
                <CheckSquare className="w-5 h-5 text-oak-green" />
              ) : (
                <Square className="w-5 h-5 text-stone-400" />
              )}
              <span>전체약관 동의하기</span>
            </label>
          </div>

          <div className="space-y-3">
            {/* 1) Privacy Policy */}
            <div className="border border-stone-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="min-h-[40px] flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800 flex-1">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="w-5 h-5 accent-oak-green cursor-pointer shrink-0"
                  />
                  <span>[필수] 개인정보 수집 및 이용 동의</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                  className="min-h-[40px] px-2 text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{showPrivacyDetail ? '접기' : '내용보기'}</span>
                  {showPrivacyDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {showPrivacyDetail && (
                <div className="bg-stone-50 p-3 rounded-lg text-[11px] text-stone-600 leading-relaxed max-h-32 overflow-y-auto">
                  [개인정보 수집 및 이용 목적]<br />
                  - 오크밸리리조트 제휴사 임직원 예약 진행, 예약자 확인 및 관련 알림톡/문자 서비스 발송<br />
                  - 수집 항목: 성명, 휴대폰 번호, 이메일 주소, 오픈카드 보증 정보<br />
                  - 보유 및 이용 기간: 전자상거래법에 의거 서비스 제공 완료 후 5년간 보관.
                </div>
              )}
            </div>

            {/* 2) 3rd Party Info Sharing */}
            <div className="border border-stone-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="min-h-[40px] flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800 flex-1">
                  <input
                    type="checkbox"
                    checked={agreeThirdParty}
                    onChange={(e) => setAgreeThirdParty(e.target.checked)}
                    className="w-5 h-5 accent-oak-green cursor-pointer shrink-0"
                  />
                  <span>[필수] 제3자 정보 제공 동의</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowThirdPartyDetail(!showThirdPartyDetail)}
                  className="min-h-[40px] px-2 text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{showThirdPartyDetail ? '접기' : '내용보기'}</span>
                  {showThirdPartyDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {showThirdPartyDetail && (
                <div className="bg-stone-50 p-3 rounded-lg text-[11px] text-stone-600 leading-relaxed max-h-32 overflow-y-auto">
                  [제3자 정보 제공 안내]<br />
                  - 제공받는 자: 오크밸리리조트 운영사 (아이파크리조트 주식회사), 제휴사 복지 담당 부서<br />
                  - 제공 목적: 제휴 임직원 신원 확인, 객실 배정, 부대시설 우대혜택 적용<br />
                  - 제공 항목: 성명, 제휴사 코드, 투숙일자, 연락처.
                </div>
              )}
            </div>

            {/* 3) Cancellation Policy */}
            <div className="border border-stone-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="min-h-[40px] flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800 flex-1">
                  <input
                    type="checkbox"
                    checked={agreeCancelPolicy}
                    onChange={(e) => setAgreeCancelPolicy(e.target.checked)}
                    className="w-5 h-5 accent-oak-green cursor-pointer shrink-0"
                  />
                  <span>[필수] 취소 및 환불 위약금 규정 동의</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCancelDetail(!showCancelDetail)}
                  className="min-h-[40px] px-2 text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{showCancelDetail ? '접기' : '내용보기'}</span>
                  {showCancelDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {showCancelDetail && (
                <div className="bg-stone-50 p-3 rounded-lg text-[11px] text-stone-600 leading-relaxed">
                  • 입실 7일 전 취소: 위약금 0% (전액 취소)<br />
                  • 입실 3~6일 전 취소: 총 금액의 20% 위약금 부과<br />
                  • 입실 1~2일 전 취소: 총 금액의 50% 위약금 부과<br />
                  • 당일 취소 및 노쇼(No-show): 총 금액의 100% 위약금이 오픈카드로 청구됩니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full min-h-[52px] py-4 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Lock className="w-5 h-5 text-oak-gold" />
          <span>예약 완료 및 오픈카드 보증 등록</span>
          <Sparkles className="w-4 h-4 text-oak-gold" />
        </button>
      </form>

    </div>
  );
};
