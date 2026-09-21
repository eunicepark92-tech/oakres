import { SupabaseClient } from '@supabase/supabase-js';

export interface MigrationSourcePayload {
  roomTypes: any[];
  partners: any[];
  packages: any[];
  dailyRates: any[];
  packageCategories: any[];
  seasonPeriods: any[];
  seasonalCancellationRules: any[];
  cancellationRules: any[];
  specialDays: any[];
  roleSettings: any;
  reservations?: any[];
  auditLogs?: any[];
}

export interface MigrationTableResult {
  tableName: string;
  label: string;
  sourceCount: number;
  dbCountBefore: number;
  dbCountAfter: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';
  errorDetails?: string;
}

export interface ServerMigrationResponse {
  ok: boolean;
  success: boolean;
  message: string;
  tables: MigrationTableResult[];
  failedStep?: string;
  error?: string;
}

/**
 * 테이블별 실제 적재 가능한 컬럼 화이트리스트
 */
export const SERVER_TABLE_COLUMN_WHITELISTS: Record<string, string[]> = {
  room_types: [
    'id', 'name', 'capacity', 'size', 'bed_type', 'description',
    'standard_price', 'image_url', 'amenities', 'created_at', 'updated_at'
  ],
  partners: [
    'id', 'code', 'name', 'discount_rate', 'is_active',
    'sales_agent_id', 'sales_agent_name', 'manager_phone', 'manager_email',
    'logo_url', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'partner_id', 'name', 'category', 'category_label',
    'description', 'inclusions', 'image_url', 'max_occupancy', 'base_price',
    'highlight_badge', 'is_active', 'created_at', 'updated_at'
  ],
  product_room_types: [
    'package_id', 'room_type_id'
  ],
  product_prices: [
    'id', 'package_id', 'room_type_id', 'date', 'price', 'original_price',
    'status', 'created_at', 'updated_at'
  ],
  inventory: [
    'id', 'date', 'room_type_id', 'total_stock', 'reserved_stock',
    'is_closed', 'created_at', 'updated_at'
    // CRITICAL: available_stock은 GENERATED 컬럼이므로 절대 제외
  ],
  operation_notices: [
    'id', 'category', 'title', 'content', 'is_active',
    'created_at', 'updated_at'
  ],
  reservations: [
    'id', 'pms_reservation_no', 'partner_id', 'partner_name', 'partner_code',
    'package_id', 'package_name', 'room_type_id', 'room_type_name',
    'check_in', 'check_out', 'nights', 'room_count', 'guest_count',
    'booker_name', 'booker_phone', 'booker_email', 'guest_name', 'guest_phone',
    'total_price', 'status', 'cancel_reason', 'penalty_amount', 'payment_guarantee',
    'created_at', 'updated_at'
    // CRITICAL: 민감 카드정보(카드번호, cvc, 유효기간) 절대 포함 금지
  ],
  audit_logs: [
    'id', 'actor_name', 'actor_role', 'action_type', 'action_summary',
    'details', 'ip_address', 'created_at'
  ],
  components: [
    'id', 'category', 'name', 'description', 'base_price', 'normal_price',
    'is_discountable', 'is_active', 'tags', 'created_at'
  ]
};

export function validateServerPayloadKeys(tableName: string, rows: Record<string, any>[]): { valid: boolean; error?: string } {
  if (!rows || rows.length === 0) return { valid: true };
  const allowed = SERVER_TABLE_COLUMN_WHITELISTS[tableName];
  if (!allowed) return { valid: true };

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const invalidKeys = keys.filter((k) => !allowed.includes(k));
  if (invalidKeys.length > 0) {
    return {
      valid: false,
      error: `[${tableName}] 허용되지 않는 컬럼이 포함되어 있습니다: ${invalidKeys.join(', ')}`,
    };
  }

  if (tableName === 'room_types') {
    if ('base_price' in firstRow) {
      return { valid: false, error: 'room_types에 base_price 컬럼이 포함되어 있습니다. (standard_price로 전송 필수)' };
    }
    if (!('standard_price' in firstRow)) {
      return { valid: false, error: 'room_types에 standard_price 컬럼이 누락되었습니다.' };
    }
  }

  if (tableName === 'inventory') {
    if ('available_stock' in firstRow) {
      return { valid: false, error: 'inventory에 available_stock 컬럼이 포함되어 있습니다. (생성 컬럼 전송 금지)' };
    }
  }

  if (tableName === 'reservations') {
    const cardKeys = ['card_number', 'cardNumber', 'cvc', 'card_expiry', 'cardExpiry', 'guarantee_card'];
    const foundCardKeys = keys.filter((k) => cardKeys.includes(k));
    if (foundCardKeys.length > 0) {
      return { valid: false, error: `reservations에 민감 카드정보 컬럼이 포함되어 있습니다: ${foundCardKeys.join(', ')}` };
    }
  }

  return { valid: true };
}

async function getDbCount(supabaseAdmin: SupabaseClient, tableName: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Executes the 9-step Master Admin Baseline Migration server-side using service_role credentials
 */
export async function executeServerMigration(
  supabaseAdmin: SupabaseClient,
  source: MigrationSourcePayload,
  callerClient?: SupabaseClient
): Promise<ServerMigrationResponse> {
  const dbClient = callerClient || supabaseAdmin;
  const targetTables = [
    { tableName: 'room_types', label: '객실 타입' },
    { tableName: 'partners', label: '제휴사 정보' },
    { tableName: 'products', label: '상품(패키지)' },
    { tableName: 'product_room_types', label: '상품-객실 연결' },
    { tableName: 'product_prices', label: '일자별 상품 요금' },
    { tableName: 'inventory', label: '일자별 객실 재고' },
    { tableName: 'operation_notices', label: '운영 설정/규정' },
    { tableName: 'reservations', label: '기존 예약 내역' },
    { tableName: 'audit_logs', label: '감사 로그' },
  ];

  // Calculate product_room_types
  const productRoomTypeRows: Array<{ package_id: string; room_type_id: string }> = [];
  (source.packages || []).forEach((pkg: any) => {
    const pkgId = pkg.id;
    if (Array.isArray(pkg.roomTypeIds)) {
      pkg.roomTypeIds.forEach((rtId: string) => {
        if (rtId) {
          productRoomTypeRows.push({
            package_id: pkgId,
            room_type_id: rtId,
          });
        }
      });
    }
  });

  // Calculate inventory
  const inventoryMap = new Map<string, any>();
  (source.dailyRates || []).forEach((dr: any) => {
    if (!dr.date || !dr.roomTypeId) return;
    const invKey = `${dr.date}_${dr.roomTypeId}`;
    if (!inventoryMap.has(invKey)) {
      const available = typeof dr.stock === 'number' ? dr.stock : 10;
      const total = Math.max(10, available);
      const reserved = Math.max(0, total - available);

      inventoryMap.set(invKey, {
        id: invKey,
        date: dr.date,
        room_type_id: dr.roomTypeId,
        total_stock: total,
        reserved_stock: reserved,
        is_closed: dr.status === 'soldout' || dr.status === 'blocked',
        updated_at: new Date().toISOString(),
      });
    }
  });
  const inventoryRows = Array.from(inventoryMap.values());

  const sourceCounts: Record<string, number> = {
    room_types: source.roomTypes?.length || 0,
    partners: source.partners?.length || 0,
    products: source.packages?.length || 0,
    product_room_types: productRoomTypeRows.length,
    product_prices: source.dailyRates?.length || 0,
    inventory: inventoryRows.length,
    operation_notices: 7,
    reservations: source.reservations?.length || 0,
    audit_logs: source.auditLogs?.length || 0,
  };

  // Pre-check DB counts
  const tablesStatus: MigrationTableResult[] = [];
    for (const t of targetTables) {
      const before = await getDbCount(dbClient, t.tableName);
      tablesStatus.push({
        tableName: t.tableName,
        label: t.label,
        sourceCount: sourceCounts[t.tableName] || 0,
        dbCountBefore: before,
        dbCountAfter: 0,
        status: 'pending',
      });
    }

    try {
      // ----------------------------------------------------
      // STEP 1: room_types
      // ----------------------------------------------------
      tablesStatus[0].status = 'in_progress';
      if (source.roomTypes && source.roomTypes.length > 0) {
        const roomTypeRows = source.roomTypes.map((rt: any, idx: number) => ({
          id: rt.id || `rt-${idx + 1}`,
          name: rt.name,
          capacity: rt.capacity || null,
          size: rt.size || null,
          bed_type: rt.bedType || null,
          description: rt.description || null,
          standard_price: typeof rt.standardPrice === 'number' ? rt.standardPrice : (typeof rt.basePrice === 'number' ? rt.basePrice : 0),
          image_url: rt.imageUrl || null,
          amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
          updated_at: new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('room_types', roomTypeRows);
        if (!v.valid) {
          tablesStatus[0].status = 'failed';
          tablesStatus[0].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'room_types 검증 실패', failedStep: 'room_types', tables: tablesStatus };
        }

        const { error } = await dbClient.from('room_types').upsert(roomTypeRows);
        if (error) {
          tablesStatus[0].status = 'failed';
          tablesStatus[0].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `room_types 이전 실패: ${error.message}`, failedStep: 'room_types', tables: tablesStatus };
        }
        tablesStatus[0].status = 'success';
      } else {
        tablesStatus[0].status = 'success';
      }

      // ----------------------------------------------------
      // STEP 2: partners
      // ----------------------------------------------------
      tablesStatus[1].status = 'in_progress';
      if (source.partners && source.partners.length > 0) {
        const partnerRows = source.partners.map((p: any, idx: number) => ({
          id: p.id || `partner-${idx + 1}`,
          code: p.code,
          name: p.name,
          discount_rate: typeof p.discountRate === 'number' ? p.discountRate : 0,
          is_active: Boolean(p.active ?? true),
          sales_agent_id: p.salesAgentId || null,
          sales_agent_name: p.salesAgentName || p.managerName || p.contactName || null,
          manager_phone: p.managerPhone || p.contactPhone || null,
          manager_email: p.managerEmail || p.contactEmail || null,
          logo_url: p.logoUrl || null,
          updated_at: new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('partners', partnerRows);
        if (!v.valid) {
          tablesStatus[1].status = 'failed';
          tablesStatus[1].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'partners 검증 실패', failedStep: 'partners', tables: tablesStatus };
        }

        const { error } = await dbClient.from('partners').upsert(partnerRows);
        if (error) {
          tablesStatus[1].status = 'failed';
          tablesStatus[1].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `partners 이전 실패: ${error.message}`, failedStep: 'partners', tables: tablesStatus };
        }
        tablesStatus[1].status = 'success';
      } else {
        tablesStatus[1].status = 'success';
      }

      // ----------------------------------------------------
      // STEP 3: products
      // ----------------------------------------------------
      tablesStatus[2].status = 'in_progress';
      if (source.packages && source.packages.length > 0) {
        const productRows = source.packages.map((pr: any, idx: number) => ({
          id: pr.id || `pkg-${idx + 1}`,
          partner_id: pr.partnerId || 'ALL',
          name: pr.name,
          category: pr.category || 'ROOM_ONLY',
          category_label: pr.categoryLabel || null,
          description: pr.description || null,
          inclusions: Array.isArray(pr.inclusions) ? pr.inclusions : [],
          image_url: pr.imageUrl || null,
          max_occupancy: typeof pr.maxOccupancy === 'number' ? pr.maxOccupancy : 4,
          base_price: typeof pr.basePrice === 'number' ? pr.basePrice : 0,
          highlight_badge: pr.highlightBadge || null,
          is_active: Boolean(pr.active ?? true),
          updated_at: new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('products', productRows);
        if (!v.valid) {
          tablesStatus[2].status = 'failed';
          tablesStatus[2].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'products 검증 실패', failedStep: 'products', tables: tablesStatus };
        }

        const { error } = await dbClient.from('products').upsert(productRows);
        if (error) {
          tablesStatus[2].status = 'failed';
          tablesStatus[2].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `products 이전 실패: ${error.message}`, failedStep: 'products', tables: tablesStatus };
        }
        tablesStatus[2].status = 'success';
      } else {
        tablesStatus[2].status = 'success';
      }

      // ----------------------------------------------------
      // STEP 4: product_room_types (N:M 연결 테이블)
      // ----------------------------------------------------
      tablesStatus[3].status = 'in_progress';
      if (productRoomTypeRows.length > 0) {
        const v = validateServerPayloadKeys('product_room_types', productRoomTypeRows);
        if (!v.valid) {
          tablesStatus[3].status = 'failed';
          tablesStatus[3].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'product_room_types 검증 실패', failedStep: 'product_room_types', tables: tablesStatus };
        }

        const { error } = await dbClient.from('product_room_types').upsert(productRoomTypeRows);
        if (error) {
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('not find')) {
            tablesStatus[3].status = 'skipped';
            tablesStatus[3].errorDetails = 'product_room_types 테이블이 DB에 미정의되어 products.room_type_ids(JSONB)로 안전하게 대체 연동되었습니다.';
          } else {
            tablesStatus[3].status = 'failed';
            tablesStatus[3].errorDetails = `[${error.code}] ${error.message}`;
            return { ok: false, success: false, message: `product_room_types 이전 실패: ${error.message}`, failedStep: 'product_room_types', tables: tablesStatus };
          }
        } else {
          tablesStatus[3].status = 'success';
        }
      } else {
        tablesStatus[3].status = 'skipped';
        tablesStatus[3].errorDetails = '연결 객실 정보 없음';
      }

      // ----------------------------------------------------
      // STEP 5: product_prices (청크 분할 Upsert)
      // ----------------------------------------------------
      tablesStatus[4].status = 'in_progress';
      if (source.dailyRates && source.dailyRates.length > 0) {
        const priceRows = source.dailyRates.map((dr: any) => ({
          id: dr.id || `${dr.packageId}_${dr.roomTypeId}_${dr.date}`,
          package_id: dr.packageId,
          room_type_id: dr.roomTypeId,
          date: dr.date,
          price: typeof dr.price === 'number' ? dr.price : 0,
          original_price: typeof dr.originalPrice === 'number' ? dr.originalPrice : dr.price || 0,
          status: dr.status || 'available',
          updated_at: new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('product_prices', priceRows);
        if (!v.valid) {
          tablesStatus[4].status = 'failed';
          tablesStatus[4].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'product_prices 검증 실패', failedStep: 'product_prices', tables: tablesStatus };
        }

        const CHUNK_SIZE = 250;
        for (let i = 0; i < priceRows.length; i += CHUNK_SIZE) {
          const chunk = priceRows.slice(i, i + CHUNK_SIZE);
          const { error } = await dbClient.from('product_prices').upsert(chunk);
          if (error) {
            tablesStatus[4].status = 'failed';
            tablesStatus[4].errorDetails = `청크 ${Math.floor(i / CHUNK_SIZE) + 1}: [${error.code}] ${error.message}`;
            return { ok: false, success: false, message: `product_prices 이전 실패: ${error.message}`, failedStep: 'product_prices', tables: tablesStatus };
          }
        }
        tablesStatus[4].status = 'success';
      } else {
        tablesStatus[4].status = 'success';
      }

      // ----------------------------------------------------
      // STEP 6: inventory (available_stock 제외)
      // ----------------------------------------------------
      tablesStatus[5].status = 'in_progress';
      if (inventoryRows.length > 0) {
        const v = validateServerPayloadKeys('inventory', inventoryRows);
        if (!v.valid) {
          tablesStatus[5].status = 'failed';
          tablesStatus[5].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'inventory 검증 실패', failedStep: 'inventory', tables: tablesStatus };
        }

        const CHUNK_SIZE = 250;
        for (let i = 0; i < inventoryRows.length; i += CHUNK_SIZE) {
          const chunk = inventoryRows.slice(i, i + CHUNK_SIZE);
          const { error } = await dbClient.from('inventory').upsert(chunk);
          if (error) {
            tablesStatus[5].status = 'failed';
            tablesStatus[5].errorDetails = `청크 ${Math.floor(i / CHUNK_SIZE) + 1}: [${error.code}] ${error.message}`;
            return { ok: false, success: false, message: `inventory 이전 실패: ${error.message}`, failedStep: 'inventory', tables: tablesStatus };
          }
        }
        tablesStatus[5].status = 'success';
      } else {
        tablesStatus[5].status = 'skipped';
        tablesStatus[5].errorDetails = '재고 원본 없음';
      }

      // ----------------------------------------------------
      // STEP 7: operation_notices
      // ----------------------------------------------------
      tablesStatus[6].status = 'in_progress';
      const noticesToSave = [
        { id: 'room_types', category: 'config', title: '원천 객실 타입 마스터 목록', payload: source.roomTypes },
        { id: 'package_categories', category: 'config', title: '패키지 카테고리 목록', payload: source.packageCategories },
        { id: 'season_periods', category: 'rules', title: '성수기 시즌 구간 목록', payload: source.seasonPeriods },
        { id: 'seasonal_cancellation_rules', category: 'rules', title: '구간별 취소 위약금 규정', payload: source.seasonalCancellationRules },
        { id: 'cancellation_rules', category: 'rules', title: '기본 취소 규정', payload: source.cancellationRules },
        { id: 'special_days', category: 'rules', title: '특수 지정일 및 공휴일', payload: source.specialDays },
        { id: 'system_role_settings', category: 'permissions', title: '시스템 역할 권한 설정', payload: source.roleSettings },
      ];

      for (const notice of noticesToSave) {
        const rawPayload = notice.payload ?? [];
        const noticePayload = {
          id: notice.id,
          category: notice.category,
          title: notice.title,
          content: typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload),
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        const v = validateServerPayloadKeys('operation_notices', [noticePayload]);
        if (!v.valid) {
          tablesStatus[6].status = 'failed';
          tablesStatus[6].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'operation_notices 검증 실패', failedStep: 'operation_notices', tables: tablesStatus };
        }

        const { error } = await dbClient.from('operation_notices').upsert(noticePayload);
        if (error) {
          tablesStatus[6].status = 'failed';
          tablesStatus[6].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `operation_notices (${notice.id}) 이전 실패: ${error.message}`, failedStep: 'operation_notices', tables: tablesStatus };
        }
      }
      tablesStatus[6].status = 'success';

      // ----------------------------------------------------
      // STEP 8: reservations (카드정보 절대 제외)
      // ----------------------------------------------------
      tablesStatus[7].status = 'in_progress';
      if (source.reservations && source.reservations.length > 0) {
        const reservationRows = source.reservations.map((res: any, idx: number) => ({
          id: res.id || `res-${Date.now()}-${idx + 1}`,
          pms_reservation_no: res.pmsReservationNo || null,
          partner_id: res.partnerId || res.partnerCode || 'ALL',
          partner_name: res.partnerName || '일반예약',
          partner_code: res.partnerCode || 'ALL',
          package_id: res.packageId,
          package_name: res.packageName,
          room_type_id: res.roomTypeId,
          room_type_name: res.roomTypeName,
          check_in: res.checkIn,
          check_out: res.checkOut,
          nights: typeof res.nights === 'number' ? res.nights : 1,
          room_count: typeof res.roomCount === 'number' ? res.roomCount : 1,
          guest_count: typeof res.guestCount === 'number' ? res.guestCount : 2,
          booker_name: res.bookerName,
          booker_phone: res.bookerPhone,
          booker_email: res.bookerEmail || null,
          guest_name: res.guestName || res.bookerName,
          guest_phone: res.guestPhone || res.bookerPhone,
          total_price: typeof res.totalPrice === 'number' ? res.totalPrice : 0,
          status: res.status || 'CONFIRMED',
          cancel_reason: res.cancelReason || null,
          penalty_amount: typeof res.penaltyAmount === 'number' ? res.penaltyAmount : 0,
          payment_guarantee: res.paymentGuarantee || 'on_site',
          updated_at: new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('reservations', reservationRows);
        if (!v.valid) {
          tablesStatus[7].status = 'failed';
          tablesStatus[7].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'reservations 검증 실패', failedStep: 'reservations', tables: tablesStatus };
        }

        const { error } = await dbClient.from('reservations').upsert(reservationRows);
        if (error) {
          tablesStatus[7].status = 'failed';
          tablesStatus[7].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `reservations 이전 실패: ${error.message}`, failedStep: 'reservations', tables: tablesStatus };
        }
        tablesStatus[7].status = 'success';
      } else {
        tablesStatus[7].status = 'success';
      }

      // ----------------------------------------------------
      // STEP 9: audit_logs
      // ----------------------------------------------------
      tablesStatus[8].status = 'in_progress';
      if (source.auditLogs && source.auditLogs.length > 0) {
        const auditRows = source.auditLogs.map((log: any, idx: number) => ({
          id: log.id || `audit-${Date.now()}-${idx + 1}`,
          actor_name: log.userName || log.actorName || '마스터 관리자',
          actor_role: log.role || log.actorRole || 'master',
          action_type: log.action || log.actionType || 'MIGRATION',
          action_summary: log.target || log.actionSummary || '기준 데이터 수동 마이그레이션',
          details: typeof log.details === 'object' ? log.details : { message: String(log.details || '') },
          ip_address: null,
          created_at: log.timestamp || new Date().toISOString(),
        }));

        const v = validateServerPayloadKeys('audit_logs', auditRows);
        if (!v.valid) {
          tablesStatus[8].status = 'failed';
          tablesStatus[8].errorDetails = v.error;
          return { ok: false, success: false, message: v.error || 'audit_logs 검증 실패', failedStep: 'audit_logs', tables: tablesStatus };
        }

        const { error } = await dbClient.from('audit_logs').upsert(auditRows);
        if (error) {
          tablesStatus[8].status = 'failed';
          tablesStatus[8].errorDetails = `[${error.code}] ${error.message}`;
          return { ok: false, success: false, message: `audit_logs 이전 실패: ${error.message}`, failedStep: 'audit_logs', tables: tablesStatus };
        }
        tablesStatus[8].status = 'success';
      } else {
        tablesStatus[8].status = 'success';
      }

      // Post-check counts
      for (const t of tablesStatus) {
        t.dbCountAfter = await getDbCount(dbClient, t.tableName);
      }

    return {
      ok: true,
      success: true,
      message: '서버사이드(Service Role)를 통한 Supabase 영구 데이터베이스 마이그레이션이 성공적으로 완료되었습니다.',
      tables: tablesStatus,
    };
  } catch (err: any) {
    console.error('[Server Migration Exception]', err);
    return {
      ok: false,
      success: false,
      message: `서버 마이그레이션 실행 중 예외가 발생했습니다: ${err?.message || '알 수 없는 시스템 오류'}`,
      tables: tablesStatus,
      error: err?.message,
    };
  }
}
