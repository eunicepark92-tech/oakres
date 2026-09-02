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

// Admin Mode Components
import { AdminLogin } from './components/AdminApp/AdminLogin';
import { AdminHeader, AdminTab } from './components/AdminApp/AdminHeader';
import { DashboardView } from './components/AdminApp/DashboardView';
import { PartnerManager } from './components/AdminApp/PartnerManager';
import { RoomTypeManager } from './components/AdminApp/RoomTypeManager';
import { PackageManager } from './components/AdminApp/PackageManager';
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

export function App() {
  const {
    activeMode,
    setActiveMode,
    currentPartner,
    logoutPartner: clearPartner,
    currentAdmin,
    logoutAdmin,
    dailyRates,
  } = useApp();

  // User App Step State: 'packages' -> 'booking' -> 'confirmation'
  const [userStep, setUserStep] = useState<'packages' | 'booking' | 'confirmation'>('packages');

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeMode, userStep, adminTab, currentPartner?.id, currentAdmin?.id]);

  // Clear user flow & booking state whenever partner session changes (logout or login as another partner)
  React.useEffect(() => {
    setSelectedPackage(null);
    setSelectedRoom(null);
    setBookingSpecs(null);
    setCompletedReservation(null);
    setIsRoomModalOpen(false);
    setUserStep('packages');
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
    setUserStep('packages');
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

                {/* USER STEP 1: PACKAGE LIST + DATE ROOM SELECTOR */}
                {userStep === 'packages' && (
                  <div className="space-y-6">
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
                  <BookingForm
                    selectedPackage={selectedPackage}
                    selectedRoom={selectedRoom}
                    bookingSpecs={bookingSpecs}
                    onBack={() => setUserStep('packages')}
                    onBookingComplete={handleBookingComplete}
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
                onSelectRoom={(data) => {
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
                  setUserStep('booking');
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
