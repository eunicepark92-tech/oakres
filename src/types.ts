export type UserRole = 'master' | 'sales_agent' | 'reservation_staff';

export interface RolePermissions {
  canViewUnmaskedCard: boolean;   // 고객 카드번호 마스킹 해제 원본 조회 권한
  canManagePackages: boolean;     // 패키지 및 요금 등록/수정/삭제 권한
  canManagePartners: boolean;     // 제휴사 등록 및 관리 권한
  canManageRooms: boolean;        // 원천 객실 타입 관리 권한
  canManageRates: boolean;        // 요금 및 재고 매트릭스 설정 권한
  canManageCancellation: boolean; // 취소/환불 규정 변경 권한
  canConfirmReservations: boolean;// 예약 PMS 승인 및 취소 처리 권한
}

export interface SystemRoleSettings {
  sales_agent: RolePermissions;
  reservation_staff: RolePermissions;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId: string; // 사번 (e.g. SA-1001, RES-2001)
  approved: boolean; // 마스터 승인 여부
  createdAt: string;
  phone?: string;
  password?: string;
}

export interface Partner {
  id: string;
  code: string; // 제휴사 코드 (e.g. SAMSUNG2026)
  name: string; // 제휴사명 (e.g. 삼성전자 임직원)
  logoUrl: string; // 제휴사 로고 URL
  salesAgentId: string; // 담당 영업사원 ID
  salesAgentName: string; // 담당 영업사원 이름
  createdAt: string;
  active: boolean;
  contactEmail?: string;
  contactPhone?: string;
  discountRate: number; // 제휴 할인율 %
}

export interface CategoryItem {
  key: string; // e.g. 'ROOM_ONLY', 'BREAKFAST', 'PET_PACKAGE'
  label: string; // e.g. '룸온리', '조식 패키지', '펫 친화 패키지'
  description?: string;
}

export type PackageCategory = string;

export interface Package {
  id: string;
  partnerId: string; // 'ALL' or specific partner ID
  partnerCode: string;
  name: string;
  category: PackageCategory;
  categoryLabel: string; // e.g. 룸온리, 조식 패키지
  description: string;
  inclusions: string[]; // 포함사항 목록 (e.g. "골프빌리지 31평 1박", "조식 뷔페 2인 이용권", "아쿠아 가든 2인 입장권")
  imageUrl: string;
  maxOccupancy: number;
  basePrice: number;
  highlightBadge?: string;
  active: boolean;
  roomTypeIds?: string[]; // 연결된 원천 객실 ID 목록 (다중 선택 가능)
}

export interface RoomType {
  id: string;
  name: string; // e.g. 골프빌리지 31평 스위트
  capacity: string; // e.g. 기준 4인 / 최대 6인
  bedType: string; // e.g. 온돌1 + 더블1 + 욕실2
  size: string; // e.g. 31평 (102.4㎡)
  description: string;
  imageUrl: string;
  amenities: string[];
  standardPrice?: number; // 원천 객실 기준 금액
}

export interface CancellationRule {
  id: string;
  minDays: number; // e.g. 7 (meaning >= 7 days before checkin)
  maxDays: number; // e.g. 999
  penaltyRate: number; // percentage % (e.g. 0, 20, 50, 100)
  label: string; // e.g. "입실 7일 전까지"
  description: string; // e.g. "위약금 0% (전액 환불)"
}

export interface SeasonPeriod {
  id: string;
  name: string; // e.g. "여름 럭셔리 성수기", "겨울 연말 성수기"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SpecialDay {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // e.g. "광복절 공휴일", "추석 연휴"
  category: 'holiday' | 'special_rate' | 'peak_season';
  customPriceMultiplier?: number;
  customPriceFixed?: number;
  notes?: string;
}

export interface SeasonalCancellationRule {
  id: string;
  minDays: number; // e.g. 10, 7, 5, 3, 1, 0
  label: string; // e.g. "입실 10일 전까지"
  offPeakWeekdayRate: number; // 비수기 주중 위약율 %
  offPeakWeekendRate: number; // 비수기 주말 위약율 %
  peakSeasonRate: number; // 성수기 위약율 %
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: 'PACKAGE' | 'ROOM' | 'RATE' | 'CANCELLATION' | 'PARTNER' | 'RESERVATION' | 'USER_APPROVAL' | 'MEDIA';
  actionSummary: string;
  details?: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string; // Data URL or Web URL
  category: string; // e.g. '객실', '패키지', '부대시설', '기타'
  uploadedAt: string;
  sizeKb?: number;
}

export interface DailyRate {
  id: string;
  packageId: string;
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  price: number;
  originalPrice: number;
  stock: number; // 잔여 객실 수
  status: 'available' | 'soldout' | 'blocked';
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'completed';
export type RefundStatus = 'none' | 'pending' | 'completed' | 'rejected';

export interface GuaranteeCard {
  cardholderName: string;
  cardNumberMasked: string; // e.g. 1234-56**-****-9012
  cardNumberFull?: string; // e.g. 1234-5678-9012-3456
  cardExpiry: string; // MM/YY
  cardType: string; // e.g. 현대카드 / 삼성카드
}

export interface Reservation {
  id: string; // e.g. OV-REQ-20260805-7721
  pmsReservationNo?: string; // 관리자가 발급한 확정 예약번호 (e.g. PMS-88392)
  confirmedAt?: string;
  confirmedBy?: string;
  partnerCode: string;
  partnerName: string;
  packageId: string;
  packageName: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  roomCount: number;
  totalPrice: number;
  originalTotalPrice: number;
  discountAmount: number;
  bookerName: string;
  bookerPhone: string; // e.g. 010-1234-5678
  bookerPhoneLast4: string; // e.g. 5678
  bookerEmail: string;
  specialRequests?: string;
  guaranteeCard: GuaranteeCard;
  status: ReservationStatus;
  createdAt: string;
  
  // Refund & Cancellation Automation
  refundStatus: RefundStatus;
  cancellationPenaltyRate?: number; // %
  penaltyAmount?: number;
  refundAmount?: number;
  cancelReason?: string;
  cancelledAt?: string;
}

export interface NotificationLog {
  id: string;
  reservationId: string;
  recipientPhone: string;
  recipientName: string;
  recipientEmail?: string;
  senderEmail?: string;
  type: 'BOOKING_CONFIRMED' | 'REMINDER_CHECKIN' | 'CANCELLATION' | 'REFUND_COMPLETED' | 'BOOKING_PENDING';
  channel: 'KAKAO_ALIMTALK' | 'SMS' | 'EMAIL';
  title: string;
  content: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface Settlement {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  month: string; // YYYY-MM
  totalBookings: number;
  grossAmount: number;
  discountRate: number; // e.g. 15%
  discountAmount: number;
  netSettlementAmount: number;
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SETTLED';
  settledAt?: string;
}
