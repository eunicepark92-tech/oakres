import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Common/Navbar';
import { Footer } from './components/Common/Footer';
import { Toast } from './components/Common/Toast';

// User Mode Components
import { PartnerCodeLogin } from './components/UserApp/PartnerCodeLogin';
import { DateRoomSelector } from './components/UserApp/DateRoomSelector';
import { PackageList } from './components/UserApp/PackageList';
import { RoomSelectionModal } from './components/UserApp/RoomSelectionModal';
import { BookingForm } from './components/UserApp/BookingForm';
import { BookingConfirmation } from './components/UserApp/BookingConfirmation';
import { BookingLookupModal } from './components/UserApp/BookingLookupModal';
import { DIYSelectionView } from './components/UserApp/DIYSelectionView';
import { DIYQuotationView } from './components/UserApp/DIYQuotationView';
import { DIYRoomSelectionView } from './components/UserApp/DIYRoomSelectionView';

// Admin Mode Components
import { AdminLogin } from './components/AdminApp/AdminLogin';
import { AdminHeader, AdminTab } from './components/AdminApp/AdminHeader';
import { DashboardView } from './components/AdminApp/DashboardView';
import { PartnerManager } from './components/AdminApp/PartnerManager';
import { RoomTypeManager } from './components/AdminApp/RoomTypeManager';
import { PackageManager } from './components/AdminApp/PackageManager';
import { DIYComponentManager } from './components/AdminApp/DIYComponentManager';
import { RateInventoryMatrix } from './components/AdminApp/RateInventoryMatrix';
import { CancellationRefundManager } from './components/AdminApp/CancellationRefundManager';
import { SettlementModule } from './components/AdminApp/SettlementModule';
import { MasterAgentApprovals } from './components/AdminApp/MasterAgentApprovals';
import { AuditLogSection } from './components/AdminApp/AuditLogSection';
import { MediaGalleryManager } from './components/AdminApp/MediaGalleryManager';
import { ReservationDeskView } from './components/AdminApp/ReservationDeskView';
import { CalendarManager } from './components/AdminApp/CalendarManager';

import { Package, RoomType, Reservation } from './types';
import { LogOut, Calendar, Search, Sparkles } from 'lucide-react';
import { calculateDiyRoomStayPrice } from './utils/pricing';

export function App() {
  const {
    activeMode,
    setActiveMode,
    currentPartner,
    logoutPartner: clearPartner,
    currentAdmin,
    logoutAdmin,
    dailyRates,
    diyRoomRates,
    specialDays,
  } = useApp();

  // User App Step State: 'entry' -> 'packages' / 'diy_room_select' -> 'diy_select' -> 'diy_quotation' -> 'booking' -> 'confirmation'
  const [userStep, setUserStep] = useState<'entry' | 'packages' | 'diy_room_select' | 'diy_select' | 'diy_quotation' | 'booking' | 'confirmation'>('entry');

  // Selected DIY Component Items for active proposal/quote
  const [selectedDiyItems, setSelectedDiyItems] = useState<any[]>([]);

  // Selected Booking Search & Filters
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toISOString().split('T')[0];
  });
  const [roomCount, setRoomCount] = useState(1);

  // Active Selected Package & Room for Modal / Booking
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [bookingSpecs, setBookingSpecs] = useState<{
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCount: number;
    totalPrice: number;
    originalTotalPrice: number;
    discountAmount: number;
  } | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Latest Completed Reservation for Confirmation View
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  // Lookup Modal State
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Admin Tab State
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [preSelectedRoomTypeIdForPackage, setPreSelectedRoomTypeIdForPackage] = useState<string | undefined>(undefined);

  // Reset to dashboard on admin login
  React.useEffect(() => {
    if (currentAdmin) {
      setAdminTab('dashboard');
    }
  }, [currentAdmin?.id]);

  // Page change auto-scroll to top
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeMode, userStep, adminTab, currentPartner?.id, currentAdmin?.id, isLookupOpen, completedReservation]);

  // Clear user flow & booking state whenever partner session changes (logout or login as another partner)
  React.useEffect(() => {
    setSelectedPackage(null);
    setSelectedRoom(null);
    setBookingSpecs(null);
    setCompletedReservation(null);
    setIsRoomModalOpen(false);
    setUserStep('entry');
    setSelectedDiyItems([]);
  }, [currentPartner?.id, currentPartner?.code]);

  // Handlers for User Flow
  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsRoomModalOpen(true);
  };

  const handleBookingComplete = (reservation: Reservation) => {
    setCompletedReservation(reservation);
    setUserStep('confirmation');
  };

  const handleNewBooking = () => {
    setSelectedPackage(null);
    setSelectedRoom(null);
    setBookingSpecs(null);
    setCompletedReservation(null);
    setSelectedDiyItems([]);
    setUserStep('entry');
  };

  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    const cinDate = new Date(newCheckIn);
    if (!isNaN(cinDate.getTime())) {
      const nextDay = new Date(cinDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-oak-green/20 selection:text-oak-dark transition-colors">
      
      {/* Toast Notification Layer */}
      <Toast />

      {/* Global Navbar */}
      <Navbar
        onOpenLookup={() => setIsLookupOpen(true)}
        onGoHome={() => {
          setUserStep('packages');
          setSelectedPackage(null);
          setSelectedRoom(null);
          setCompletedReservation(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12">
        
        {/* ========================================================= */}
        {/* MODE A: USER APP MODE */}
        {/* ========================================================= */}
        {activeMode === 'user' && (
          <div>
            {!currentPartner ? (
              /* User Authentication via Partner Code */
              <PartnerCodeLogin />
            ) : (
              <div className="space-y-6">
                
                {/* Authenticated Partner Banner Header */}
                <div className="bg-white dark:bg-[#1C1C22] p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                  <div className="flex items-center gap-3">
                    {currentPartner.logoUrl && (
                      <div className="w-14 h-10 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={currentPartner.logoUrl}
                          alt={currentPartner.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {currentPartner.name}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          {currentPartner.code}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        임직원 전용 우대 혜택 적용 중 ({currentPartner.discountRate}% 할인)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsLookupOpen(true)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-oak-green dark:text-amber-400" />
                      <span>내 예약 조회</span>
                    </button>

                    <button
                      onClick={clearPartner}
                      className="px-3 py-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="제휴사 코드 변경"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">코드 변경</span>
                    </button>
                  </div>
                </div>

                {/* USER STEP 0: LANDING ENTRY SELECTION */}
                {userStep === 'entry' && (
                  <div className="space-y-8 animate-fade-in py-4">
                    {/* Hero introduction */}
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-oak-gold animate-pulse" />
                        <span>Oak Valley Custom Reservation System</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
                        예약 방식을 선택해 주세요
                      </h2>
                      <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                        원하시는 스타일로 오크밸리에서의 완벽한 여정을 설계하세요.
                      </p>
                    </div>

                    {/* Choice cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {/* Option 1: Standard Packages */}
                      <button
                        onClick={() => setUserStep('packages')}
                        className="bg-white hover:bg-stone-50 text-left p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[220px] active:scale-99"
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🎁
                          </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-stone-950 group-hover:text-oak-green transition-colors">
                              일반 / 추천 패키지 예약
                            </h3>
                            <p className="text-stone-500 text-xs mt-2 leading-relaxed">
                              오크밸리가 제휴사 임직원을 위해 정성스럽게 구성한 고품격 추천 시즌 패키지와 합리적인 상품들을 한눈에 확인하고 예약하세요.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-700 font-extrabold mt-6 group-hover:translate-x-1 transition-transform">
                          <span>추천 패키지 보러가기</span>
                          <span>→</span>
                        </div>
                      </button>

                      {/* Option 2: DIY Package */}
                      <button
                        onClick={() => setUserStep('diy_room_select')}
                        className="bg-stone-900 hover:bg-stone-800 text-left p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xs hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[220px] active:scale-99"
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🛠️
                          </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-white group-hover:text-oak-gold transition-colors">
                              나만의 DIY 패키지 만들기
                            </h3>
                            <p className="text-stone-400 text-xs mt-2 leading-relaxed">
                              취향대로 자유롭게 조립하는 1:1 커스텀 메이드! 투숙 날짜와 마음에 드는 객실을 정한 뒤, F&B 식음과 레저 액티비티를 원하는 만큼 담아 맞춤 패키지를 만드세요.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-oak-gold font-extrabold mt-6 group-hover:translate-x-1 transition-transform">
                          <span>DIY 패키지 만들기 시작</span>
                          <span>→</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* USER STEP 0.5: DIY ROOM SELECTION */}
                {userStep === 'diy_room_select' && (
                  <DIYRoomSelectionView
                    onBack={() => setUserStep('entry')}
                    onSelectRoom={(data) => {
                      // Calculate DIY Room Stay Price over period
                      const baseRoomPrice = calculateDiyRoomStayPrice(
                        data.roomType.id,
                        data.checkIn,
                        data.nights,
                        diyRoomRates,
                        specialDays
                      );
                      const totalRoomPrice = baseRoomPrice * data.roomCount;

                      setSelectedRoom(data.roomType);
                      
                      // Construct custom DIY Package object
                      const customDiyPkg: Package = {
                        id: 'diy-package',
                        partnerId: currentPartner?.id || 'ALL',
                        partnerCode: currentPartner?.code || 'ALL',
                        name: '나만의 DIY 패키지',
                        category: 'ROOM_ONLY',
                        categoryLabel: 'DIY 커스텀',
                        description: '직접 원하는 구성품을 조합하여 설계한 오크밸리 1:1 맞춤형 패키지입니다.',
                        inclusions: ['선택한 DIY 객실', '조합한 DIY 옵션 상품'],
                        imageUrl: data.roomType.imageUrl,
                        maxOccupancy: 4,
                        basePrice: 150000,
                        active: true,
                        roomTypeIds: [data.roomType.id],
                      };
                      setSelectedPackage(customDiyPkg);

                      const roomOriginalPrice = totalRoomPrice;
                      const roomDiscountRate = currentPartner?.discountRate || 0;
                      const roomDiscountAmount = Math.round(roomOriginalPrice * (roomDiscountRate / 100));
                      const roomFinalPrice = roomOriginalPrice - roomDiscountAmount;

                      setBookingSpecs({
                        checkIn: data.checkIn,
                        checkOut: data.checkOut,
                        nights: data.nights,
                        roomCount: data.roomCount,
                        totalPrice: roomFinalPrice,
                        originalTotalPrice: roomOriginalPrice,
                        discountAmount: roomDiscountAmount,
                      });

                      setUserStep('diy_select');
                    }}
                  />
                )}

                {/* USER STEP 1: PACKAGE LIST + DATE ROOM SELECTOR */}
                {userStep === 'packages' && (
                  <div className="space-y-6">
                    <button
                      onClick={() => setUserStep('entry')}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 active:scale-98"
                    >
                      <span>← 예약 방식 선택으로 가기</span>
                    </button>
                    
                    {/* Date & Room Count Filter */}
                    <DateRoomSelector
                      checkIn={checkIn}
                      checkOut={checkOut}
                      roomCount={roomCount}
                      onCheckInChange={handleCheckInChange}
                      onCheckOutChange={setCheckOut}
                      onRoomCountChange={setRoomCount}
                    />

                    {/* Available Packages */}
                    <PackageList
                      partnerCode={currentPartner.code}
                      onSelectPackage={handleSelectPackage}
                    />
                  </div>
                )}

                 {/* USER STEP 2: BOOKING FORM */}
                 {userStep === 'booking' && selectedPackage && selectedRoom && bookingSpecs && (
                   (() => {
                     const isDiy = selectedPackage.id === 'diy-package';
                     const diyItemOriginalTotal = isDiy && selectedDiyItems ? selectedDiyItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0) : 0;
                     const diyItemFinalTotal = isDiy && selectedDiyItems ? selectedDiyItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0) : 0;

                     const displaySpecs = {
                       ...bookingSpecs,
                       totalPrice: bookingSpecs.totalPrice + diyItemFinalTotal,
                       originalTotalPrice: bookingSpecs.originalTotalPrice + diyItemOriginalTotal,
                       discountAmount: (bookingSpecs.originalTotalPrice + diyItemOriginalTotal) - (bookingSpecs.totalPrice + diyItemFinalTotal),
                     };

                     return (
                       <BookingForm
                         selectedPackage={selectedPackage}
                         selectedRoom={selectedRoom}
                         bookingSpecs={displaySpecs}
                         selectedDiyItems={selectedDiyItems}
                         onBack={() => setUserStep(isDiy ? 'diy_select' : 'packages')}
                         onBookingComplete={handleBookingComplete}
                       />
                     );
                   })()
                 )}

                {/* USER STEP 2.5: DIY COMPONENT SELECTION */}
                {userStep === 'diy_select' && selectedPackage && selectedRoom && bookingSpecs && (
                  <DIYSelectionView
                    selectedPackage={selectedPackage}
                    selectedRoom={selectedRoom}
                    bookingSpecs={bookingSpecs}
                    onBack={() => {
                      setUserStep('diy_room_select');
                    }}
                    onProceedToQuotation={(items) => {
                      setSelectedDiyItems(items);
                      setUserStep('diy_quotation');
                    }}
                    onProceedToNormalBooking={() => {
                      setSelectedDiyItems([]);
                      setUserStep('booking');
                    }}
                  />
                )}

                {/* USER STEP 2.6: DIY QUOTATION VIEW */}
                {userStep === 'diy_quotation' && selectedPackage && selectedRoom && bookingSpecs && (
                  <DIYQuotationView
                    selectedPackage={selectedPackage}
                    selectedRoom={selectedRoom}
                    bookingSpecs={bookingSpecs}
                    selectedItems={selectedDiyItems}
                    onBack={() => setUserStep('diy_select')}
                    onStartOver={handleNewBooking}
                    onProceedToBooking={() => setUserStep('booking')}
                  />
                )}

                {/* USER STEP 3: BOOKING CONFIRMATION ("한판에 리체크") */}
                {userStep === 'confirmation' && completedReservation && (
                  <BookingConfirmation
                    reservation={completedReservation}
                    onNewBooking={handleNewBooking}
                    onOpenLookup={() => setIsLookupOpen(true)}
                  />
                )}

              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE B: ADMIN APP MODE */}
        {/* ========================================================= */}
        {activeMode === 'admin' && (
          <div>
            {!currentAdmin ? (
              /* Admin Login / Registration Screen */
              <AdminLogin />
            ) : (
              <div className="space-y-6">
                
                {/* Admin Header Tabs */}
                <AdminHeader
                  activeTab={adminTab}
                  onSelectTab={(tab) => setAdminTab(tab)}
                />

                {/* Active Admin Sub-Module */}
                {adminTab === 'dashboard' && <DashboardView />}
                {adminTab === 'reservation_desk' && <ReservationDeskView />}
                {adminTab === 'partners' && <PartnerManager />}
                {adminTab === 'roomTypes' && (
                  <RoomTypeManager
                    onNavigateToPackages={(roomTypeId) => {
                      if (roomTypeId) {
                        setPreSelectedRoomTypeIdForPackage(roomTypeId);
                      }
                      setAdminTab('packages');
                    }}
                  />
                )}
                {adminTab === 'packages' && (
                  <PackageManager initialRoomTypeId={preSelectedRoomTypeIdForPackage} />
                )}
                {adminTab === 'diy_components' && <DIYComponentManager />}
                {adminTab === 'matrix' && <RateInventoryMatrix />}
                {adminTab === 'mediaGallery' && <MediaGalleryManager />}
                {adminTab === 'refunds' && <CancellationRefundManager />}
                {adminTab === 'settlement' && <SettlementModule />}
                {adminTab === 'approvals' && <MasterAgentApprovals />}
                {adminTab === 'calendar' && <CalendarManager />}
                {adminTab === 'audit' && <AuditLogSection />}

              </div>
            )}
          </div>
        )}

        {/* Global Modals */}
        {selectedPackage && isRoomModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-10 sm:pt-16">
            <div className="bg-[#FAF9F5] rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-stone-200 my-auto relative">
              <RoomSelectionModal
                selectedPackage={selectedPackage}
                onBack={() => setIsRoomModalOpen(false)}
                onSelectRoom={(data, isDiy) => {
                  setSelectedRoom(data.roomType);
                  setBookingSpecs({
                    checkIn: data.checkIn,
                    checkOut: data.checkOut,
                    nights: data.nights,
                    roomCount: data.roomCount,
                    totalPrice: data.totalPrice,
                    originalTotalPrice: data.originalTotalPrice,
                    discountAmount: data.discountAmount,
                  });
                  setIsRoomModalOpen(false);
                  setUserStep(isDiy ? 'diy_select' : 'booking');
                }}
              />
            </div>
          </div>
        )}

        <BookingLookupModal
          isOpen={isLookupOpen}
          onClose={() => setIsLookupOpen(false)}
          onViewConfirmation={(res) => {
            setCompletedReservation(res);
            setUserStep('confirmation');
            setActiveMode('user');
          }}
        />

      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}

export default App;
