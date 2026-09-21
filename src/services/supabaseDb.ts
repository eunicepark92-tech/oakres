import { supabase, isSupabaseConfigured } from './supabaseClient';
import { executeManualMigration } from './supabaseMigration';
import {
  Partner,
  Package,
  RoomType,
  DailyRate,
  Reservation,
  AdminUser,
  AuditLog,
  SeasonPeriod,
  SeasonalCancellationRule,
  SpecialDay,
  SystemRoleSettings,
  CategoryItem,
  CancellationRule,
  UserProfile,
  Component,
  PartnerComponentRule,
  ReservationItem,
  DiyRoomRate,
} from '../types';

export interface SupabaseFullState {
  partners: Partner[];
  packages: Package[];
  packageCategories: CategoryItem[];
  roomTypes: RoomType[];
  dailyRates: DailyRate[];
  reservations: Reservation[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  seasonPeriods?: SeasonPeriod[];
  seasonalCancellationRules?: SeasonalCancellationRule[];
  cancellationRules?: CancellationRule[];
  specialDays?: SpecialDay[];
  roleSettings?: SystemRoleSettings;
  notificationEmail?: string;
  userProfiles?: UserProfile[];
  components?: Component[];
  partnerComponentRules?: PartnerComponentRule[];
  reservationItems?: ReservationItem[];
  diyRoomRates?: DiyRoomRate[];
}

// -------------------------------------------------------------
// Mapping Helpers (DB row to Model)
// -------------------------------------------------------------
export function mapProductRowToPackage(pr: any): Package {
  return {
    id: pr.id,
    partnerId: pr.partner_id || pr.partnerId || 'ALL',
    partnerCode: pr.partner_code || pr.partnerCode || 'ALL',
    name: pr.name,
    category: pr.category || 'ROOM_ONLY',
    categoryLabel: pr.category_label || pr.categoryLabel || '룸온리',
    description: pr.description || '',
    inclusions: Array.isArray(pr.inclusions) ? pr.inclusions : [],
    imageUrl: pr.image_url || pr.imageUrl || '',
    maxOccupancy: Number(pr.max_occupancy || pr.maxOccupancy || 4),
    basePrice: Number(pr.base_price || pr.basePrice || 0),
    highlightBadge: pr.highlight_badge || pr.highlightBadge || '',
    active: Boolean(pr.is_active ?? pr.active ?? true),
    roomTypeIds: Array.isArray(pr.room_type_ids) ? pr.room_type_ids : (pr.roomTypeIds || []),
  };
}

export function mapRateRowToDailyRate(pp: any): DailyRate {
  const stock = Number(pp.stock ?? pp.available_stock ?? pp.availableStock ?? 10);
  return {
    id: pp.id || `${pp.package_id || pp.packageId}_${pp.room_type_id || pp.roomTypeId}_${pp.date}`,
    packageId: pp.package_id || pp.packageId,
    roomTypeId: pp.room_type_id || pp.roomTypeId,
    date: pp.date,
    price: Number(pp.price || 0),
    originalPrice: Number(pp.original_price || pp.originalPrice || pp.price || 0),
    stock: Math.max(0, stock),
    status: pp.status || (stock > 0 ? 'available' : 'soldout'),
  };
}

function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function generateDeterministicUuid(str: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  if (isUuid(str)) return str;
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const hex = (p1 + p2 + p3 + p4).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function mapReservationRowToReservation(r: any): Reservation {
  return {
    id: r.booking_no || r.id,
    pmsReservationNo: r.pms_reservation_no || r.pmsReservationNo || undefined,
    partnerCode: r.partner_code || r.partnerCode || '',
    partnerName: r.partner_name || r.partnerName || '',
    packageId: r.package_id || r.packageId || '',
    packageName: r.package_name || r.packageName || '',
    roomTypeId: r.room_type_id || r.roomTypeId || '',
    roomTypeName: r.room_type_name || r.roomTypeName || '',
    checkIn: r.check_in || r.checkIn,
    checkOut: r.check_out || r.checkOut,
    nights: Number(r.nights || 1),
    roomCount: Number(r.room_count || r.roomCount || 1),
    totalPrice: Number(r.total_price || r.totalPrice || 0),
    originalTotalPrice: Number(r.original_total_price || r.originalTotalPrice || r.total_price || 0),
    discountAmount: Number(r.discount_amount || r.discountAmount || 0),
    bookerName: r.booker_name || r.bookerName,
    bookerPhone: r.booker_phone || r.bookerPhone,
    bookerPhoneLast4: (r.booker_phone || r.bookerPhone || '').replace(/[^0-9]/g, '').slice(-4) || '0000',
    bookerEmail: r.booker_email || r.bookerEmail,
    specialRequests: r.special_requests || r.specialRequests || undefined,
    status: r.status,
    refundStatus: r.refund_status || (r.status === 'cancelled' ? 'completed' : 'none'),
    cancellationPenaltyRate: r.cancellation_penalty_rate ? Number(r.cancellation_penalty_rate) : undefined,
    penaltyAmount: r.penalty_amount ? Number(r.penalty_amount) : undefined,
    refundAmount: r.refund_amount ? Number(r.refund_amount) : undefined,
    cancelReason: r.cancel_reason || undefined,
    adminCancelNote: r.admin_cancel_note || undefined,
    cancelledAt: r.cancelled_at || undefined,
    confirmedAt: r.confirmed_at || undefined,
    confirmedBy: r.confirmed_by || undefined,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// SECURE RPCS (고객/공개 및 승인 보안 RPCs)
// -------------------------------------------------------------

/**
 * 1. 제휴사 상품 조회 RPC
 * get_partner_products_secure(p_partner_code)
 */
export async function getPartnerProductsSecure(partnerCode: string): Promise<Package[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.rpc('get_partner_products_secure', {
      p_partner_code: partnerCode,
    });
    if (error) {
      console.warn('[get_partner_products_secure warning]', error.message);
      return [];
    }
    return (data || []).map(mapProductRowToPackage);
  } catch (err) {
    console.error('[getPartnerProductsSecure Exception]', err);
    return [];
  }
}

/**
 * 2. 제휴사 요금·재고 조회 RPC
 * get_partner_rates_secure(p_partner_code, p_start_date, p_end_date)
 */
export async function getPartnerRatesSecure(
  partnerCode: string,
  startDate: string,
  endDate: string
): Promise<DailyRate[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.rpc('get_partner_rates_secure', {
      p_partner_code: partnerCode,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) {
      console.warn('[get_partner_rates_secure warning]', error.message);
      return [];
    }
    return (data || []).map(mapRateRowToDailyRate);
  } catch (err) {
    console.error('[getPartnerRatesSecure Exception]', err);
    return [];
  }
}

/**
 * 3. 예약 신청 RPC (원자적 재고 차감 및 제휴사/객실 무결성 검증)
 * create_reservation_secure(p_booker_email, p_booker_name, p_booker_phone, p_check_in, p_check_out, p_package_id, p_partner_code, p_room_count, p_room_type_id, p_special_requests)
 */
export async function createReservationSecure(params: {
  partnerCode: string;
  packageId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  specialRequests?: string;
}): Promise<{ success: boolean; bookingNo?: string; message?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, message: 'Supabase 데이터베이스가 구성되지 않았습니다.' };
  }
  try {
    const { data, error } = await supabase.rpc('create_reservation_secure', {
      p_partner_code: params.partnerCode,
      p_package_id: params.packageId,
      p_room_type_id: params.roomTypeId,
      p_check_in: params.checkIn,
      p_check_out: params.checkOut,
      p_room_count: params.roomCount,
      p_booker_name: params.bookerName,
      p_booker_phone: params.bookerPhone,
      p_booker_email: params.bookerEmail,
      p_special_requests: params.specialRequests || '',
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const bookingNo = typeof data === 'string' ? data : (data?.booking_no || data?.id || String(data || ''));
    return { success: true, bookingNo };
  } catch (err: any) {
    return { success: false, message: err?.message || '예약 생성 중 시스템 오류가 발생했습니다.' };
  }
}

/**
 * 4. 고객 안전 예약 조회 RPC
 * lookup_customer_reservation_safe(p_booker_name, p_booker_phone, p_booking_no)
 */
export async function lookupCustomerReservationSafe(
  bookerName: string,
  bookerPhone: string,
  bookingNo: string
): Promise<Reservation[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.rpc('lookup_customer_reservation_safe', {
      p_booker_name: bookerName.trim(),
      p_booker_phone: bookerPhone.trim(),
      p_booking_no: bookingNo.trim(),
    });
    if (error) {
      console.warn('[lookupCustomerReservationSafe warning]', error.message);
      return [];
    }
    return (data || []).map(mapReservationRowToReservation);
  } catch (err) {
    console.error('[lookupCustomerReservationSafe Exception]', err);
    return [];
  }
}

/**
 * 5. 고객 예약 취소 요청 RPC
 * request_reservation_cancellation(p_booker_name, p_booker_phone, p_booking_no, p_cancel_reason)
 */
export async function requestReservationCancellation(params: {
  bookingNo: string;
  bookerName: string;
  bookerPhone: string;
  cancelReason: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, message: 'Supabase가 연결되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.rpc('request_reservation_cancellation', {
      p_booking_no: params.bookingNo.trim(),
      p_booker_name: params.bookerName.trim(),
      p_booker_phone: params.bookerPhone.trim(),
      p_cancel_reason: params.cancelReason.trim(),
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: '예약 취소 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.' };
  } catch (err: any) {
    return { success: false, message: err?.message || '취소 요청 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 6. 관리자 취소 승인 RPC (관리자 전용: 재고 복원 및 환불 상태 처리)
 * approve_reservation_cancellation(p_admin_note, p_booking_no, p_penalty_amount, p_refund_amount, p_refund_status)
 */
export async function approveReservationCancellation(params: {
  bookingNo: string;
  refundStatus?: string; // 'completed' | 'pending'
  adminNote?: string;
  penaltyAmount?: number;
  refundAmount?: number;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, message: 'Supabase가 연결되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.rpc('approve_reservation_cancellation', {
      p_booking_no: params.bookingNo.trim(),
      p_refund_status: params.refundStatus || 'completed',
      p_admin_note: params.adminNote || '관리자 취소 승인 완료',
      p_penalty_amount: params.penaltyAmount || 0,
      p_refund_amount: params.refundAmount || 0,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: '예약 취소 승인 및 재고 복원이 완료되었습니다.' };
  } catch (err: any) {
    return { success: false, message: err?.message || '취소 승인 중 오류가 발생했습니다.' };
  }
}

// -------------------------------------------------------------
// OPERATIONAL REPOSITORY (관리자 세션 전용 조회 & CRUD)
// -------------------------------------------------------------

/**
 * Fetch operational data from Supabase tables.
 * For authenticated admins, returns the full operational database.
 * For unauthenticated users, safely returns accessible public partners view without error.
 */
export async function fetchAllFromSupabase(): Promise<SupabaseFullState | null> {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  try {
    // Check if we have an authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = Boolean(session?.user);

    // 1. Fetch Partners
    let partnersData: any[] = [];
    if (isAuthenticated) {
      const { data, error } = await supabase.from('partners').select('*');
      if (!error && data) partnersData = data;
    }
    if (partnersData.length === 0) {
      // Try public_partners view for anon or fallback
      const { data, error } = await supabase.from('public_partners').select('*');
      if (!error && data) {
        partnersData = data.map((p) => ({
          ...p,
          discount_rate: 0,
          is_active: true,
          sales_agent_id: 'PUBLIC',
          sales_agent_name: '제휴사',
          created_at: new Date().toISOString(),
        }));
      }
    }

    if (!isAuthenticated) {
      // Anonymous user: only return public partners without crashing on 42501
      const publicPartners: Partner[] = partnersData.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        discountRate: Number(p.discount_rate || 0),
        logoUrl: p.logo_url || '',
        salesAgentId: p.sales_agent_id || 'SA-DEFAULT',
        salesAgentName: p.sales_agent_name || '마스터 관리자',
        createdAt: p.created_at || new Date().toISOString(),
        active: Boolean(p.is_active !== false),
        contactEmail: p.manager_email || '',
        contactPhone: p.manager_phone || '',
      }));

      return {
        partners: publicPartners,
        packages: [],
        packageCategories: [],
        roomTypes: [],
        dailyRates: [],
        reservations: [],
        adminUsers: [],
        auditLogs: [],
      };
    }

    // Authenticated Admin Flow:
    const [
      { data: roomTypesData },
      { data: productsData },
      { data: prtData },
      { data: pricesData },
      { data: invData },
      { data: resData },
      { data: adminData },
      { data: auditData },
      { data: noticesData },
    ] = await Promise.all([
      supabase.from('room_types').select('*'),
      supabase.from('products').select('*'),
      supabase.from('product_room_types').select('*'),
      supabase.from('product_prices').select('*'),
      supabase.from('inventory').select('*'),
      supabase.from('reservations').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_users').select('*'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('operation_notices').select('*'),
    ]);

    // Transform Partners
    const partners: Partner[] = (partnersData || []).map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      discountRate: Number(p.discount_rate || 0),
      logoUrl: p.logo_url || '',
      salesAgentId: p.sales_agent_id || 'SA-DEFAULT',
      salesAgentName: p.sales_agent_name || '마스터 관리자',
      createdAt: p.created_at || new Date().toISOString(),
      active: Boolean(p.is_active !== false),
      contactEmail: p.manager_email || '',
      contactPhone: p.manager_phone || '',
    }));

    // Build Product -> Room Types Map
    const productRoomMap = new Map<string, string[]>();
    (prtData || []).forEach((item: any) => {
      if (!productRoomMap.has(item.package_id)) {
        productRoomMap.set(item.package_id, []);
      }
      productRoomMap.get(item.package_id)!.push(item.room_type_id);
    });

    // Transform Products
    const packages: Package[] = (productsData || []).map((p: any) => {
      const mapped = mapProductRowToPackage(p);
      const linkedRooms = productRoomMap.get(p.id);
      if (linkedRooms && linkedRooms.length > 0) {
        mapped.roomTypeIds = linkedRooms;
      }
      return mapped;
    });

    // Transform Room Types
    let roomTypes: RoomType[] = (roomTypesData || []).map((rt: any) => ({
      id: rt.id,
      name: rt.name,
      capacity: rt.capacity || '',
      size: rt.size || '',
      bedType: rt.bed_type || '',
      description: rt.description || '',
      standardPrice: Number(rt.standard_price || 0),
      imageUrl: rt.image_url || '',
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
    }));

    // Transform Inventory Map for quick lookup
    const inventoryMap = new Map<string, { total: number; reserved: number; available: number; isClosed: boolean }>();
    (invData || []).forEach((inv) => {
      const key = `${inv.room_type_id}_${inv.date}`;
      inventoryMap.set(key, {
        total: Number(inv.total_stock || 10),
        reserved: Number(inv.reserved_stock || 0),
        available: Number(inv.available_stock || 0),
        isClosed: Boolean(inv.is_closed),
      });
    });

    // Transform Daily Rates from product_prices + inventory
    const dailyRates: DailyRate[] = (pricesData || []).map((pp) => {
      const invKey = `${pp.room_type_id}_${pp.date}`;
      const inv = inventoryMap.get(invKey);
      const stock = inv ? inv.available : 10;
      return {
        id: pp.id,
        packageId: pp.package_id,
        roomTypeId: pp.room_type_id,
        date: pp.date,
        price: Number(pp.price || 0),
        originalPrice: Number(pp.original_price || pp.price || 0),
        stock: Math.max(0, stock),
        status: inv?.isClosed ? 'blocked' : stock > 0 ? 'available' : 'soldout',
      };
    });

    // Transform Reservations (NO CREDIT CARD DATA!)
    const reservations: Reservation[] = (resData || []).map(mapReservationRowToReservation);

    // Transform Admin Users
    const adminUsers: AdminUser[] = (adminData || []).map((a) => ({
      id: a.user_id || a.id,
      userId: a.user_id || a.id,
      email: a.email,
      name: a.name,
      role: a.role as any,
      employeeId: a.employee_id || '',
      approved: Boolean(a.approved),
      phone: a.phone || '',
      createdAt: a.created_at,
    }));

    // Transform Audit Logs
    const auditLogs: AuditLog[] = (auditData || []).map((al) => ({
      id: al.id,
      timestamp: al.created_at,
      actorName: al.actor_name,
      actorRole: al.actor_role,
      actionType: al.action_type as any,
      actionSummary: al.action_summary,
      details: al.details || '',
    }));

    // Parse operation notices
    let packageCategories: CategoryItem[] = [];
    let seasonPeriods: SeasonPeriod[] | undefined;
    let seasonalCancellationRules: SeasonalCancellationRule[] | undefined;
    let cancellationRules: CancellationRule[] | undefined;
    let specialDays: SpecialDay[] | undefined;
    let roleSettings: SystemRoleSettings | undefined;
    let notificationEmail: string | undefined;
    let diyRoomRates: DiyRoomRate[] | undefined;
    let fallbackReservationItems: ReservationItem[] = [];
    let fallbackRoomTypes: RoomType[] = [];

    (noticesData || []).forEach((n: any) => {
      let parsedPayload = n.payload;
      if (!parsedPayload && n.content) {
        try {
          parsedPayload = JSON.parse(n.content);
        } catch {
          parsedPayload = n.content;
        }
      }
      if (n.id === 'room_types' && Array.isArray(parsedPayload)) {
        fallbackRoomTypes = parsedPayload;
      } else if (n.id === 'package_categories' && Array.isArray(parsedPayload)) {
        packageCategories = parsedPayload;
      } else if (n.id === 'season_periods' && Array.isArray(parsedPayload)) {
        seasonPeriods = parsedPayload;
      } else if (n.id === 'seasonal_cancellation_rules' && Array.isArray(parsedPayload)) {
        seasonalCancellationRules = parsedPayload;
      } else if (n.id === 'cancellation_rules' && Array.isArray(parsedPayload)) {
        cancellationRules = parsedPayload;
      } else if (n.id === 'special_days' && Array.isArray(parsedPayload)) {
        specialDays = parsedPayload;
      } else if (n.id === 'system_role_settings' && parsedPayload) {
        roleSettings = parsedPayload;
      } else if (n.id === 'system_config' && parsedPayload?.notificationEmail) {
        notificationEmail = parsedPayload.notificationEmail;
      } else if (n.id === 'diy_room_rates' && Array.isArray(parsedPayload)) {
        diyRoomRates = parsedPayload;
      } else if (n.id === 'reservation_items' && Array.isArray(parsedPayload)) {
        fallbackReservationItems = parsedPayload;
      }
    });

    // Ensure any room types previously stored in fallback/notices are synced to room_types table
    if (fallbackRoomTypes.length > 0) {
      for (const frt of fallbackRoomTypes) {
        if (!roomTypes.some((r) => r.id === frt.id)) {
          roomTypes.push(frt);
        }
        upsertRoomTypeInSupabase(frt).catch(() => {});
      }
    }

    // Fetch new extensibility tables with try-catch to avoid crashes if tables do not exist or are being synchronized
    let userProfiles: UserProfile[] = [];
    let components: Component[] = [];
    let partnerComponentRules: PartnerComponentRule[] = [];
    let reservationItems: ReservationItem[] = [];

    try {
      const { data: upData, error: upErr } = await supabase.from('user_profiles').select('*');
      if (!upErr && upData) {
        userProfiles = upData.map((up: any) => ({
          id: up.id,
          email: up.email,
          name: up.name,
          phone: up.phone || '',
          role: up.role as any,
          status: up.status as any,
          partnerId: up.partner_id || undefined,
          createdAt: up.created_at,
          updatedAt: up.updated_at,
        }));
      }
    } catch (e) {
      console.warn('[Fetch user_profiles omitted/failed]', e);
    }

    try {
      const { data: cpData, error: cpErr } = await supabase.from('components').select('*');
      if (!cpErr && cpData) {
        components = cpData.map((cp: any) => ({
          id: cp.id,
          category: cp.category as any,
          name: cp.name,
          description: cp.description || '',
          basePrice: Number(cp.base_price || 0),
          normalPrice: cp.normal_price ? Number(cp.normal_price) : undefined,
          isDiscountable: Boolean(cp.is_discountable !== false),
          isActive: Boolean(cp.is_active !== false),
          tags: Array.isArray(cp.tags) ? cp.tags : [],
          createdAt: cp.created_at,
        }));
      }
    } catch (e) {
      console.warn('[Fetch components omitted/failed]', e);
    }

    try {
      const { data: pcrData, error: pcrErr } = await supabase.from('partner_component_rules').select('*');
      if (!pcrErr && pcrData) {
        partnerComponentRules = pcrData.map((pcr: any) => ({
          id: pcr.id,
          partnerId: pcr.partner_id,
          componentId: pcr.component_id,
          customPrice: pcr.custom_price != null ? Number(pcr.custom_price) : undefined,
          customDiscountRate: pcr.custom_discount_rate != null ? Number(pcr.custom_discount_rate) : undefined,
          isVisible: Boolean(pcr.is_visible !== false),
          createdAt: pcr.created_at,
        }));
      }
    } catch (e) {
      console.warn('[Fetch partner_component_rules omitted/failed]', e);
    }

    try {
      const { data: riData, error: riErr } = await supabase.from('reservation_items').select('*');
      if (!riErr && riData) {
        const resIdToBookingNoMap = new Map<string, string>();
        (resData || []).forEach((r) => {
          if (r.booking_no) {
            resIdToBookingNoMap.set(r.id, r.booking_no);
          }
        });

        reservationItems = riData.map((ri: any) => ({
          id: ri.id,
          reservationId: resIdToBookingNoMap.get(ri.reservation_id) || ri.reservation_id,
          itemType: ri.item_type as any,
          itemId: ri.item_id,
          itemName: ri.item_name,
          usageDate: ri.usage_date,
          quantity: Number(ri.quantity || 1),
          originalPrice: Number(ri.original_price || 0),
          salePrice: Number(ri.sale_price || 0),
          discountAmount: Number(ri.discount_amount || 0),
          finalPrice: Number(ri.final_price || 0),
          createdAt: ri.created_at,
        }));
      } else {
        reservationItems = fallbackReservationItems;
      }
    } catch (e) {
      console.warn('[Fetch reservation_items omitted/failed, using fallback]', e);
      reservationItems = fallbackReservationItems;
    }

    return {
      partners,
      packages,
      packageCategories,
      roomTypes,
      dailyRates,
      reservations,
      adminUsers,
      auditLogs,
      seasonPeriods,
      seasonalCancellationRules,
      cancellationRules,
      specialDays,
      roleSettings,
      notificationEmail,
      userProfiles,
      components,
      partnerComponentRules,
      reservationItems,
      diyRoomRates,
    };
  } catch (err) {
    console.error('[Supabase Fetch Error]', err);
    return null;
  }
}

/**
 * Explicit Master Admin Baseline Migration (Disabled).
 */
export async function manualMigrateBaselineToSupabase(_initial?: any): Promise<{ success: boolean; message: string }> {
  return { success: false, message: '기존 627건 예시 데이터 마이그레이션 기능은 비활성화되었습니다.' };
}

// Deprecated no-op: Automatic seeding is disabled to respect security instructions
export async function seedSupabaseIfEmpty(_data?: any): Promise<boolean> {
  return false;
}

// -------------------------------------------------------------
// Operational Table Mutations
// -------------------------------------------------------------

export async function upsertRoomTypeInSupabase(rt: RoomType): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.from('room_types').upsert({
      id: rt.id,
      name: rt.name,
      capacity: rt.capacity || null,
      size: rt.size || null,
      bed_type: rt.bedType || null,
      description: rt.description || null,
      standard_price: typeof rt.standardPrice === 'number' ? rt.standardPrice : 0,
      image_url: rt.imageUrl || null,
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Upsert RoomType Error]', err);
    return { success: false, error: err?.message || '객실 타입 저장 실패' };
  }
}

export async function deleteRoomTypeFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    // 1. Delete dependent product_room_types links
    await supabase.from('product_room_types').delete().eq('room_type_id', id);
    // 2. Delete dependent product_prices
    await supabase.from('product_prices').delete().eq('room_type_id', id);
    // 3. Delete dependent inventory
    await supabase.from('inventory').delete().eq('room_type_id', id);
    // 4. Delete room_type
    const { error } = await supabase.from('room_types').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Delete RoomType Error]', err);
    return { success: false, error: err?.message || '객실 타입 삭제 실패' };
  }
}

export async function upsertProductInSupabase(
  pkg: Package,
  knownRoomTypes?: RoomType[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const validCategory = pkg.category === 'BREAKFAST' ? 'BREAKFAST' : 'ROOM_ONLY';
    const partnerId = pkg.partnerId && pkg.partnerId !== 'ALL' ? pkg.partnerId : null;

    const { error: prodErr } = await supabase.from('products').upsert({
      id: pkg.id,
      partner_id: partnerId,
      name: pkg.name,
      category: validCategory,
      category_label: pkg.categoryLabel || null,
      description: pkg.description || null,
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions : [],
      image_url: pkg.imageUrl || null,
      max_occupancy: typeof pkg.maxOccupancy === 'number' ? pkg.maxOccupancy : 4,
      base_price: typeof pkg.basePrice === 'number' ? pkg.basePrice : 0,
      highlight_badge: pkg.highlightBadge || null,
      is_active: pkg.active ?? true,
      updated_at: new Date().toISOString(),
    });
    if (prodErr) throw prodErr;

    // Sync product_room_types junction
    const roomIds = pkg.roomTypeIds || [];
    await supabase.from('product_room_types').delete().eq('package_id', pkg.id);
    if (roomIds.length > 0) {
      // 1. Ensure referenced room types exist in room_types table to satisfy FK
      if (knownRoomTypes && knownRoomTypes.length > 0) {
        const roomsToUpsert = knownRoomTypes.filter((r) => roomIds.includes(r.id));
        for (const r of roomsToUpsert) {
          await upsertRoomTypeInSupabase(r);
        }
      }

      // 2. Query existing room_types in Supabase to strictly prevent FK violation (23503)
      const { data: validRooms } = await supabase
        .from('room_types')
        .select('id')
        .in('id', roomIds);

      const validRoomIdSet = new Set((validRooms || []).map((r: any) => r.id));
      const links = roomIds
        .filter((rtId) => validRoomIdSet.has(rtId))
        .map((rtId) => ({
          package_id: pkg.id,
          room_type_id: rtId,
        }));

      if (links.length > 0) {
        const { error: linkErr } = await supabase.from('product_room_types').upsert(links);
        if (linkErr) {
          console.warn('[Supabase product_room_types sync warning]', linkErr.message);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Upsert Product Error]', err);
    return { success: false, error: err?.message || '상품(패키지) 저장 실패' };
  }
}

export async function deleteProductFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    // 1. Delete dependent product_room_types
    await supabase.from('product_room_types').delete().eq('package_id', id);
    // 2. Delete dependent product_prices
    await supabase.from('product_prices').delete().eq('package_id', id);
    // 3. Delete product
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Delete Product Error]', err);
    return { success: false, error: err?.message || '상품(패키지) 삭제 실패' };
  }
}

export async function upsertComponentInSupabase(c: Component): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.from('components').upsert({
      id: c.id,
      category: c.category,
      name: c.name,
      description: c.description || null,
      base_price: typeof c.basePrice === 'number' ? c.basePrice : 0,
      normal_price: typeof c.normalPrice === 'number' ? c.normalPrice : null,
      is_discountable: c.isDiscountable !== false,
      is_active: c.isActive !== false,
      tags: Array.isArray(c.tags) ? c.tags : [],
      created_at: c.createdAt || new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Upsert Component Error]', err);
    return { success: false, error: err?.message || 'DIY 컴포넌트 저장 실패' };
  }
}

export async function deleteComponentFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    try {
      await supabase.from('partner_component_rules').delete().eq('component_id', id);
    } catch {}
    const { error } = await supabase.from('components').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Delete Component Error]', err);
    return { success: false, error: err?.message || 'DIY 컴포넌트 삭제 실패' };
  }
}

export async function upsertPartnerInSupabase(p: Partner): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.from('partners').upsert({
      id: p.id,
      code: p.code,
      name: p.name,
      discount_rate: typeof p.discountRate === 'number' ? p.discountRate : 0,
      logo_url: p.logoUrl || null,
      sales_agent_id: p.salesAgentId || null,
      sales_agent_name: p.salesAgentName || null,
      manager_phone: p.contactPhone || null,
      manager_email: p.contactEmail || null,
      is_active: p.active ?? true,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Upsert Partner Error]', err);
    return { success: false, error: err?.message || '제휴사 저장 실패' };
  }
}

export async function deletePartnerFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Delete Partner Error]', err);
    return { success: false, error: err?.message || '제휴사 삭제 실패' };
  }
}

export async function upsertDailyRateInSupabase(rate: DailyRate): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { error: priceError } = await supabase.from('product_prices').upsert({
      id: rate.id,
      package_id: rate.packageId,
      room_type_id: rate.roomTypeId,
      date: rate.date,
      price: rate.price,
      original_price: rate.originalPrice,
      status: rate.status,
      updated_at: new Date().toISOString(),
    });
    if (priceError) throw priceError;

    // Do NOT include generated available_stock
    const invId = `inv-${rate.roomTypeId}-${rate.date}`;
    const { error: invError } = await supabase.from('inventory').upsert({
      id: invId,
      date: rate.date,
      room_type_id: rate.roomTypeId,
      total_stock: typeof rate.stock === 'number' ? rate.stock : 10,
      is_closed: rate.status === 'blocked',
      updated_at: new Date().toISOString(),
    });
    if (invError) throw invError;

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Upsert Daily Rate Error]', err);
    return { success: false, error: err?.message || '일자별 요금/재고 저장 실패' };
  }
}

export async function upsertDailyRatesBatchInSupabase(rates: DailyRate[]): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured || rates.length === 0) {
    return { success: false, error: 'Supabase가 설정되지 않았거나 전송할 데이터가 없습니다.' };
  }
  try {
    const priceRows: any[] = [];
    const inventoryMap = new Map<string, any>();

    rates.forEach((r) => {
      priceRows.push({
        id: r.id,
        package_id: r.packageId,
        room_type_id: r.roomTypeId,
        date: r.date,
        price: r.price,
        original_price: r.originalPrice,
        status: r.status,
        updated_at: new Date().toISOString(),
      });

      const invKey = `${r.roomTypeId}_${r.date}`;
      if (!inventoryMap.has(invKey)) {
        inventoryMap.set(invKey, {
          id: `inv-${r.roomTypeId}-${r.date}`,
          date: r.date,
          room_type_id: r.roomTypeId,
          total_stock: typeof r.stock === 'number' ? r.stock : 10,
          // Do NOT send generated available_stock
          is_closed: r.status === 'blocked',
          updated_at: new Date().toISOString(),
        });
      }
    });

    const invRows = Array.from(inventoryMap.values());

    for (let i = 0; i < priceRows.length; i += 300) {
      const { error: pErr } = await supabase.from('product_prices').upsert(priceRows.slice(i, i + 300));
      if (pErr) throw pErr;
    }
    for (let i = 0; i < invRows.length; i += 300) {
      const { error: iErr } = await supabase.from('inventory').upsert(invRows.slice(i, i + 300));
      if (iErr) throw iErr;
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Batch Rates Error]', err);
    return { success: false, error: err?.message || '일괄 요금/재고 저장 실패' };
  }
}

/**
 * Upsert Reservation - NO CARD DATA IS SAVED!
 */
export async function upsertReservationInSupabase(res: Reservation): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const dbId = generateDeterministicUuid(res.id);
    const { error } = await supabase.from('reservations').upsert({
      id: dbId,
      booking_no: res.id,
      pms_reservation_no: res.pmsReservationNo || null,
      partner_id: res.partnerCode,
      partner_name: res.partnerName,
      partner_code: res.partnerCode,
      package_id: res.packageId,
      package_name: res.packageName,
      room_type_id: res.roomTypeId,
      room_type_name: res.roomTypeName,
      check_in: res.checkIn,
      check_out: res.checkOut,
      nights: res.nights,
      room_count: res.roomCount,
      booker_name: res.bookerName,
      booker_phone: res.bookerPhone,
      booker_email: res.bookerEmail,
      total_price: res.totalPrice,
      status: res.status,
      cancel_reason: res.cancelReason || null,
      admin_cancel_note: res.adminCancelNote || null,
      penalty_amount: res.penaltyAmount || 0,
      refund_status: res.refundStatus || 'none',
      refund_amount: res.refundAmount || 0,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase Upsert Reservation Error]', err);
    return false;
  }
}

export async function saveReservationItemsInSupabase(items: ReservationItem[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const dbPayload = items.map((item) => ({
      reservation_id: generateDeterministicUuid(item.reservationId),
      item_type: item.itemType,
      item_id: item.itemId,
      item_name: item.itemName,
      usage_date: item.usageDate,
      quantity: item.quantity,
      original_price: item.originalPrice,
      sale_price: item.salePrice,
      discount_amount: item.discountAmount,
      final_price: item.finalPrice,
      created_at: item.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('reservation_items').insert(dbPayload);
    if (error) {
      throw error;
    }
    return true;
  } catch (err) {
    console.error('[Supabase Save Reservation Items Error]', err);
    throw err;
  }
}

export async function saveOperationNoticeInSupabase(
  id: string,
  category: string,
  payload: any,
  title?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const contentStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const { error } = await supabase.from('operation_notices').upsert({
      id,
      category,
      title: title || id,
      content: contentStr,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Save Notice Error]', err);
    return { success: false, error: err?.message || '운영 설정 저장 실패' };
  }
}

export async function upsertAdminUserInSupabase(user: AdminUser): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('admin_users').upsert({
      user_id: user.userId || user.id,
      email: user.email,
      name: user.name,
      employee_id: user.employeeId,
      role: user.role,
      phone: user.phone,
      approved: user.approved,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase Admin User Error]', err);
    return false;
  }
}

export async function deleteAdminUserFromSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('admin_users').delete().eq('user_id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase Delete Admin Error]', err);
    return false;
  }
}

export async function insertAuditLogInSupabase(log: AuditLog): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('audit_logs').insert({
      id: log.id,
      actor_name: log.actorName,
      actor_role: log.actorRole,
      action_type: log.actionType,
      action_summary: log.actionSummary,
      details: log.details || '',
      created_at: log.timestamp || new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase Audit Log Error]', err);
    return false;
  }
}

/**
 * Subscribe to Supabase Realtime changes across all core tables.
 */
export function subscribeToSupabaseRealtime(onRemoteChange: () => void) {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('oakvalley-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_prices' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'operation_notices' }, () => onRemoteChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_users' }, () => onRemoteChange())
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
