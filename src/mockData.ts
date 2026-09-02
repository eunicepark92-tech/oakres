import { Partner, Package, RoomType, DailyRate, Reservation, AdminUser, NotificationLog, Settlement, SeasonPeriod, SeasonalCancellationRule, AuditLog, MediaAsset, CategoryItem, SystemRoleSettings } from './types';

export const DEFAULT_ROLE_SETTINGS: SystemRoleSettings = {
  sales_agent: {
    canViewUnmaskedCard: false,     // 영업사원은 고객의 카드번호를 마스킹된 상태로만 유지 (보안 상 해제 불허)
    canManagePackages: true,       // 영업사원은 패키지 및 요금 등록/수정 권한 있음
    canManagePartners: true,       // 영업사원은 담당 제휴사 관리 가능
    canManageRooms: true,          // 영업사원은 객실 타입 연결 가능
    canManageRates: true,          // 영업사원은 요금/재고 matrix 설정 가능
    canManageCancellation: false,  // 취소/약관/보증 규정 관리는 마스터 전용
    canConfirmReservations: false, // 예약 승인은 예약실 전용
  },
  reservation_staff: {
    canViewUnmaskedCard: true,      // 예약실 직원은 고객의 카드번호 원본 조회 가능 (오픈카드 실결제 보증 확인)
    canManagePackages: false,      // 예약실 직원은 패키지 요금 등록 권한 없음 (영업 전용)
    canManagePartners: false,      // 예약실 직원은 제휴사 등록 권한 없음
    canManageRooms: false,         // 예약실 직원은 객실 타입 수정 권한 없음
    canManageRates: false,         // 예약실 직원은 요금/재고 matrix 수정 권한 없음
    canManageCancellation: false,  // 약관 및 위약금/보증 관리 수정은 마스터 전용
    canConfirmReservations: true,  // 예약실 직원은 PMS 예약 승인/확정 가능
  },
};

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin-master-1',
    email: 'master@oakvalley.co.kr',
    name: '최마스터 총괄이사',
    role: 'master',
    employeeId: 'master',
    approved: true,
    createdAt: '2026-01-01T09:00:00Z',
    phone: '010-9999-8888',
    password: '1234',
  },
];

export const INITIAL_PARTNERS: Partner[] = [];

export const INITIAL_ROOM_TYPES: RoomType[] = [
  {
    id: 'room-golf-31',
    name: '골프빌리지 31평 노블 스위트',
    capacity: '기준 4인 / 최대 6인',
    bedType: '온돌방 1 + 더블베드 룸 1 + 거실 + 욕실 2',
    size: '102.4㎡ (31평)',
    description: '청정 원주 치악산 숲 조망과 품격 있는 아늑함을 자랑하는 오크밸리리조트 대표 스위트 객실입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['4K Smart TV', '초속무선 Wi-Fi', '냉장고', '전자레인지', '발뮤다 포트', '고급 록시땅 어메니티', '헤어드라이어', '테라스'],
  },
  {
    id: 'room-golf-48',
    name: '골프빌리지 48평 로얄 스위트',
    capacity: '기준 6인 / 최대 8인',
    bedType: '킹베드 룸 1 + 퀸베드 룸 1 + 온돌방 1 + 대형거실 + 욕실 2',
    size: '158.6㎡ (48평)',
    description: '대가족 및 프라이빗 임직원 모임에 최적화된 대형 스위트 객실로 전용 대형 와이드 테라스를 갖추고 있습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['65인치 OLED TV', 'Nespresso 캡슐머신', '대형 와인셀러', '프리미엄 욕조', '발코니 다이닝 테이블', '무료 발렛 파킹'],
  },
  {
    id: 'room-caravan',
    name: '노블 글램핑 카라반 (프라이빗 파이어핏)',
    capacity: '기준 2인 / 최대 4인',
    bedType: '퀸 스위트 베드 1 + 2층 벙크베드 1',
    size: '33.0㎡ (10평 outdoor)',
    description: '오크밸리리조트 숲속 야외 프리미엄 카라반으로 개인 파이어핏 바비큐존과 최신식 내부 편의시설을 완비했습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    amenities: ['개별 야외 데크 파이어핏', '개별 냉난방기', '프라이빗 샤워실/수건', '바비큐 그릴 세트', '블루투스 스피커'],
  },
  {
    id: 'room-museum-penthouse',
    name: '뮤지엄 SAN 뷰 52평 프라이빗 펜트하우스',
    capacity: '기준 6인 / 최대 8인',
    bedType: '마스터 킹 베드 2 + 온돌 룸 1 + 프라이빗 자쿠지',
    size: '171.9㎡ (52평)',
    description: '세계적인 건축가 안도 타다오의 뮤지엄 SAN 단풍 숲을 한눈에 조망할 수 있는 최고급 VIP 전용 펜트하우스입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    amenities: ['프라이빗 야외 자쿠지', '뱅앤올룹슨 사운드바', '웰컴 와인 & 과일 바스켓', '전용 컨시어지 서비스', '조식 객실 룸서비스'],
  },
];

export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg-room-only',
    partnerId: 'ALL',
    partnerCode: 'ALL',
    name: '[임직원 특가] 룸 온리 (Room Only) 객실 1박',
    category: 'ROOM_ONLY',
    categoryLabel: '룸온리',
    description: '오크밸리리조트의 자생 자연 숲속에서 누리는 온전한 휴식. 군더더기 없는 순수 객실 힐링 상품입니다.',
    inclusions: [
      '선택 객실 1박 숙박',
      '리조트 내 주요 부대시설(사우나, 수영장, 골프연습장) 20% 우대 할인권 4매',
      '뮤지엄 SAN 관람권 10% 할인 쿠폰',
      '무료 레이트 체크아웃 1시간 (일~목 입실 시)',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    maxOccupancy: 6,
    basePrice: 145000,
    highlightBadge: '인기 NO.1',
    active: true,
    roomTypeIds: ['room-golf-31', 'room-golf-48', 'room-caravan', 'room-museum-penthouse'],
  },
  {
    id: 'pkg-breakfast',
    partnerId: 'ALL',
    partnerCode: 'ALL',
    name: '[조식 패키지] 오크뷰 모닝 뷔페 2인 패키지',
    category: 'BREAKFAST',
    categoryLabel: '조식패키지',
    description: '신선한 강원도 로컬 식재료로 차려낸 프리미엄 라이브 셰프 모닝 뷔페 2인이 포함된 시그니처 패키지입니다.',
    inclusions: [
      '선택 객실 1박 숙박',
      '오크뷰 라이브 모닝 뷔페 2인 식사권 (성인 2인)',
      '어린이 뷔페 이용 시 30% 현장 할인',
      '아메리카노 2잔 커피 쿠폰 (라운지 바)',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
    maxOccupancy: 6,
    basePrice: 189000,
    highlightBadge: '조식포함',
    active: true,
    roomTypeIds: ['room-golf-31', 'room-golf-48'],
  },
  {
    id: 'pkg-aqua-sauna',
    partnerId: 'ALL',
    partnerCode: 'ALL',
    name: '[아쿠아 & 사우나] 아쿠아가든 & 천연 사우나 패키지',
    category: 'AQUA_SAUNA',
    categoryLabel: '아쿠아&사우나',
    description: '실내외 온수 풀장 아쿠아가든과 피로를 말끔히 풀어주는 치악산 암반수 천연 사우나 이용권이 포함되어 있습니다.',
    inclusions: [
      '선택 객실 1박 숙박',
      '아쿠아가든 온수풀 올데이 올패스 2인',
      '치악산 암반수 사우나 2인 이용권',
      '비치타월 & 로브 대여 서비스',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    maxOccupancy: 6,
    basePrice: 205000,
    highlightBadge: '힐링&스파',
    active: true,
    roomTypeIds: ['room-golf-31', 'room-caravan'],
  },
  {
    id: 'pkg-bbq-dining',
    partnerId: 'ALL',
    partnerCode: 'ALL',
    name: '[야외 BBQ] 밸리 테라스 숯불 바비큐 2~3인 다이닝 패키지',
    category: 'BBQ_DINING',
    categoryLabel: 'BBQ 야외다이닝',
    description: '별빛 가득한 오크밸리리조트 잔디 광장에서 즐기는 최고급 한우/한돈 모듬 바비큐 세트 세팅 포함 상품입니다.',
    inclusions: [
      '선택 객실 1박 숙박',
      '밸리 테라스 BBQ 플래터 (국산 한돈 삼겹/목살 500g + 훈제소시지 + 수제맥주 2잔 + 야채/모듬구이)',
      '야외 숯불 그릴 세팅 및 정리 포함',
      '음료/주류 10% 할인권',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    maxOccupancy: 8,
    basePrice: 249000,
    highlightBadge: '디너세트',
    active: true,
  },
];

// Generate Daily Rates for Next 30 Days
export function generateInitialDailyRates(): DailyRate[] {
  const rates: DailyRate[] = [];
  const today = new Date('2026-08-05');

  INITIAL_PACKAGES.forEach((pkg) => {
    INITIAL_ROOM_TYPES.forEach((room) => {
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri or Sat
        
        let multiplier = 1.0;
        if (room.id === 'room-golf-48') multiplier = 1.6;
        if (room.id === 'room-caravan') multiplier = 1.1;
        if (room.id === 'room-museum-penthouse') multiplier = 2.5;

        const basePrice = Math.round((pkg.basePrice * multiplier) / 1000) * 1000;
        const weekendSurge = isWeekend ? 50000 : 0;
        const finalPrice = basePrice + weekendSurge;
        const origPrice = Math.round((finalPrice * 1.45) / 1000) * 1000;

        rates.push({
          id: `rate-${pkg.id}-${room.id}-${dateStr}`,
          packageId: pkg.id,
          roomTypeId: room.id,
          date: dateStr,
          price: finalPrice,
          originalPrice: origPrice,
          stock: Math.floor(Math.random() * 5) + 3, // 3~7 rooms
          status: 'available',
        });
      }
    });
  });

  return rates;
}

export const INITIAL_RESERVATIONS: Reservation[] = [];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];

export const INITIAL_SETTLEMENTS: Settlement[] = [];

export const DEFAULT_CANCELLATION_RULES = [
  {
    id: 'rule-7d',
    minDays: 7,
    maxDays: 999,
    penaltyRate: 0,
    label: '입실 7일 전까지',
    description: '위약금 0% (전액 취소/환불)',
  },
  {
    id: 'rule-3d',
    minDays: 3,
    maxDays: 6,
    penaltyRate: 20,
    label: '입실 3~6일 전',
    description: '위약금 20% 부과',
  },
  {
    id: 'rule-1d',
    minDays: 1,
    maxDays: 2,
    penaltyRate: 50,
    label: '입실 1~2일 전',
    description: '위약금 50% 부과',
  },
  {
    id: 'rule-0d',
    minDays: 0,
    maxDays: 0,
    penaltyRate: 100,
    label: '당일 취소 및 노쇼',
    description: '위약금 100% 부과 (환불 불가)',
  },
];

export const DEFAULT_SEASON_PERIODS: SeasonPeriod[] = [
  {
    id: 'sp-summer-2026',
    name: '여름 썸머 하이시즌 (성수기)',
    startDate: '2026-07-15',
    endDate: '2026-08-25',
  },
  {
    id: 'sp-winter-2026',
    name: '겨울 연말/신년 하이시즌 (성수기)',
    startDate: '2026-12-20',
    endDate: '2027-01-05',
  },
];

export const DEFAULT_SEASONAL_CANCELLATION_RULES: SeasonalCancellationRule[] = [
  {
    id: 'sc-10d',
    minDays: 10,
    label: '입실 10일 전까지',
    offPeakWeekdayRate: 0,
    offPeakWeekendRate: 0,
    peakSeasonRate: 10,
    description: '비수기 무료 취소, 성수기 10% 위약금',
  },
  {
    id: 'sc-7d',
    minDays: 7,
    label: '입실 7~9일 전',
    offPeakWeekdayRate: 0,
    offPeakWeekendRate: 10,
    peakSeasonRate: 20,
    description: '비수기주중 무료, 주말 10%, 성수기 20%',
  },
  {
    id: 'sc-5d',
    minDays: 5,
    label: '입실 5~6일 전',
    offPeakWeekdayRate: 10,
    offPeakWeekendRate: 20,
    peakSeasonRate: 30,
    description: '비수기주중 10%, 주말 20%, 성수기 30%',
  },
  {
    id: 'sc-3d',
    minDays: 3,
    label: '입실 3~4일 전',
    offPeakWeekdayRate: 20,
    offPeakWeekendRate: 30,
    peakSeasonRate: 50,
    description: '비수기주중 20%, 주말 30%, 성수기 50%',
  },
  {
    id: 'sc-1d',
    minDays: 1,
    label: '입실 1~2일 전',
    offPeakWeekdayRate: 50,
    offPeakWeekendRate: 70,
    peakSeasonRate: 80,
    description: '비수기주중 50%, 주말 70%, 성수기 80%',
  },
  {
    id: 'sc-0d',
    minDays: 0,
    label: '당일 취소 및 노쇼',
    offPeakWeekdayRate: 100,
    offPeakWeekendRate: 100,
    peakSeasonRate: 100,
    description: '전구간 위약금 100% (환불 불가)',
  },
];

export const INITIAL_PACKAGE_CATEGORIES: CategoryItem[] = [
  { key: 'ROOM_ONLY', label: '룸온리', description: '객실 단품 전용 기본 숙박 상품' },
  { key: 'BREAKFAST', label: '조식 패키지', description: '신선한 뷔페 조식이 포함된 다이닝 결합 상품' },
  { key: 'AQUA_SAUNA', label: '아쿠아&사우나', description: '온천수 워터파크 및 사우나 이용권 결합 상품' },
  { key: 'BBQ_DINING', label: 'BBQ 야외다이닝', description: '더 뷰 야외 바비큐 가든 전용 다이닝 패키지' },
  { key: 'GOLF_PACKAGE', label: '골프 패키지', description: '36홀 챔피언십 골프 그린피 우대 결합 상품' },
  { key: 'PET_PACKAGE', label: '펫 프리미엄 패키지', description: '반려동물 동반 객실 및 어메니티 증정 패키지' },
  { key: 'SPA_WELLNESS', label: '스파 & 웰니스', description: '아로마 힐링 스파 및 지압 트리트먼트 결합' },
];

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media-101',
    title: '골프빌리지 스위트 거실',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    category: '객실',
    uploadedAt: '2026-08-01',
    sizeKb: 340,
  },
  {
    id: 'media-102',
    title: '노블카운티 펜트하우스 마스터룸',
    url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    category: '객실',
    uploadedAt: '2026-08-02',
    sizeKb: 420,
  },
  {
    id: 'media-103',
    title: '사우스콘도 로열스위트 전경',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    category: '객실',
    uploadedAt: '2026-08-03',
    sizeKb: 510,
  },
  {
    id: 'media-104',
    title: '아쿠아 가든 워터파크 풀',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    category: '부대시설',
    uploadedAt: '2026-08-04',
    sizeKb: 610,
  },
  {
    id: 'media-105',
    title: '오크밸리리조트 36홀 골프클럽 그린',
    url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
    category: '부대시설',
    uploadedAt: '2026-08-05',
    sizeKb: 480,
  },
  {
    id: 'media-106',
    title: '더 뷰 야외 바비큐 파티 가든',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    category: '패키지',
    uploadedAt: '2026-08-05',
    sizeKb: 390,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-06 01:20:00',
    actorName: '최마스터 총괄이사',
    actorRole: 'master',
    actionType: 'PACKAGE',
    actionSummary: '[골프/객실 통합 패키지] 다중 원천 객실 바인딩 수정',
    details: '연결 객실: 골프빌리지 31평, 48평, 글램핑 카라반, 뮤지엄 펜트하우스 4개 추가 연동',
  },
  {
    id: 'log-102',
    timestamp: '2026-08-05 18:45:12',
    actorName: '김영업 대리',
    actorRole: 'sales_agent',
    actionType: 'RATE',
    actionSummary: '삼성 임직원 8월 요금 일괄 등록',
    details: '2026-08-10 ~ 2026-08-20 기간 일일 185,000원, 재고 5실 변경',
  },
  {
    id: 'log-103',
    timestamp: '2026-08-05 15:10:33',
    actorName: '최마스터 총괄이사',
    actorRole: 'master',
    actionType: 'USER_APPROVAL',
    actionSummary: '영업사원 승인 처리 완료',
    details: '이영업 과장 (SA-1002) 백오피스 접근 권한 승인 완료',
  },
  {
    id: 'log-104',
    timestamp: '2026-08-04 11:30:05',
    actorName: '최마스터 총괄이사',
    actorRole: 'master',
    actionType: 'CANCELLATION',
    actionSummary: '성수기 / 비수기 구간별 위약율 개정',
    details: '여름 썸머 하이시즌 (2026-07-15 ~ 08-25) 위약율 3단계 매트릭스 재설정',
  },
];

export const DEFAULT_SPECIAL_DAYS: import('./types').SpecialDay[] = [
  {
    id: 'sd-1',
    date: '2026-08-15',
    name: '광복절 공휴일',
    category: 'holiday',
    customPriceMultiplier: 1.25,
    notes: '광복절 연휴 특수 요금 지정일',
  },
  {
    id: 'sd-2',
    date: '2026-09-24',
    name: '추석 연휴 시작일',
    category: 'holiday',
    customPriceMultiplier: 1.3,
    notes: '추석 명절 특별 요금 지정일',
  },
  {
    id: 'sd-3',
    date: '2026-09-25',
    name: '추석 당일',
    category: 'holiday',
    customPriceMultiplier: 1.35,
    notes: '추석 명절 피크 성수기 지정일',
  },
  {
    id: 'sd-4',
    date: '2026-10-03',
    name: '개천절',
    category: 'holiday',
    customPriceMultiplier: 1.2,
    notes: '가을 단풍 성수기 공휴일',
  },
  {
    id: 'sd-5',
    date: '2026-12-25',
    name: '크리스마스',
    category: 'special_rate',
    customPriceMultiplier: 1.3,
    notes: '연말 크리스마스 특수일',
  },
];

