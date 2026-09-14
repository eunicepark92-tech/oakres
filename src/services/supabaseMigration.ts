import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Partner,
  Package,
  RoomType,
  CategoryItem,
  DailyRate,
  SeasonPeriod,
  SeasonalCancellationRule,
  CancellationRule,
  SpecialDay,
  SystemRoleSettings,
  Reservation,
  AuditLog,
} from '../types';

export interface MigrationSourceData {
  roomTypes: RoomType[];
  partners: Partner[];
  packages: Package[];
  dailyRates: DailyRate[];
  packageCategories: CategoryItem[];
  seasonPeriods: SeasonPeriod[];
  seasonalCancellationRules: SeasonalCancellationRule[];
  cancellationRules: CancellationRule[];
  specialDays: SpecialDay[];
  roleSettings: SystemRoleSettings;
  reservations?: Reservation[];
  auditLogs?: AuditLog[];
}

export interface TableCountInfo {
  tableName: string;
  label: string;
  sourceCount: number;
  dbCountBefore: number;
  dbCountAfter: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';
  errorDetails?: string;
}

export interface MigrationCheckResult {
  hasExistingData: boolean;
  totalExistingCount: number;
  tableCounts: Record<string, number>;
}

export interface MigrationExecutionResult {
  success: boolean;
  message: string;
  tables: TableCountInfo[];
  failedStep?: string;
  error?: string;
}

/**
 * 테이블별 실제 적재 건수를 Supabase에서 안전하게 조회 (count: exact, head: true)
 */
export async function getSupabaseTableCount(tableName: string): Promise<number | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) {
      // 테이블이 존재하지 않거나 권한이 없는 경우
      return null;
    }
    return count ?? 0;
  } catch (err) {
    return null;
  }
}

/**
 * 마이그레이션 실행 전 Supabase의 기존 데이터 존재 여부와 테이블별 건수를 사전 점검
 */
export async function checkExistingSupabaseData(): Promise<MigrationCheckResult> {
  const targetTables = [
    'room_types',
    'partners',
    'products',
    'product_room_types',
    'product_prices',
    'inventory',
    'operation_notices',
    'reservations',
    'audit_logs',
  ];

  const tableCounts: Record<string, number> = {};
  let totalExistingCount = 0;

  for (const table of targetTables) {
    const count = await getSupabaseTableCount(table);
    if (count !== null) {
      tableCounts[table] = count;
      totalExistingCount += count;
    } else {
      tableCounts[table] = 0;
    }
  }

  return {
    hasExistingData: totalExistingCount > 0,
    totalExistingCount,
    tableCounts,
  };
}

/**
 * 테이블별 전송 가능한 실제 Supabase 컬럼 화이트리스트
 */
export const TABLE_COLUMN_WHITELISTS: Record<string, string[]> = {
  room_types: [
    'id', 'name', 'capacity', 'size', 'bed_type', 'description',
    'standard_price', 'image_url', 'amenities', 'created_at', 'updated_at'
  ],
  partners: [
    'id', 'code', 'name', 'discount_rate', 'contract_start', 'contract_end',
    'is_active', 'manager_name', 'manager_phone', 'manager_email',
    'business_number', 'address', 'logo_url', 'memo', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'partner_id', 'partner_code', 'name', 'category', 'category_label',
    'description', 'inclusions', 'image_url', 'max_occupancy', 'base_price',
    'highlight_badge', 'is_active', 'room_type_ids', 'created_at', 'updated_at'
  ],
  product_room_types: [
    'id', 'product_id', 'package_id', 'room_type_id'
  ],
  product_prices: [
    'id', 'package_id', 'room_type_id', 'date', 'price', 'original_price',
    'status', 'created_at', 'updated_at'
  ],
  inventory: [
    'id', 'date', 'room_type_id', 'total_stock', 'reserved_stock',
    'is_closed', 'created_at', 'updated_at'
    // CRITICAL: available_stock은 GENERATED 컬럼이므로 절대 포함 금지
  ],
  operation_notices: [
    'id', 'category', 'title', 'content', 'payload', 'is_active',
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
  ]
};

/**
 * 전송 객체의 키가 실제 Supabase 스키마와 완벽히 일치하는지 사전 검증
 */
export function validatePayloadKeys(tableName: string, rows: Record<string, any>[]): { valid: boolean; error?: string } {
  if (!rows || rows.length === 0) return { valid: true };
  const allowed = TABLE_COLUMN_WHITELISTS[tableName];
  if (!allowed) return { valid: true };

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  // 1. 존재하지 않는 미허용 컬럼 검출
  const invalidKeys = keys.filter((k) => !allowed.includes(k));
  if (invalidKeys.length > 0) {
    return {
      valid: false,
      error: `[${tableName}] 테이블에 존재하지 않는 컬럼이 전송 객체에 포함되었습니다: ${invalidKeys.join(', ')}`,
    };
  }

  // 2. 테이블별 핵심 제약조건 검증
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

export interface CalculatedSourceCounts {
  room_types: number;
  partners: number;
  products: number;
  product_room_types: number;
  product_prices: number;
  inventory: number;
  operation_notices: number;
  reservations: number;
  audit_logs: number;
  productRoomTypeRows: Array<{
    id: string;
    product_id: string;
    package_id: string;
    room_type_id: string;
  }>;
  inventoryRows: Array<{
    id: string;
    date: string;
    room_type_id: string;
    total_stock: number;
    reserved_stock: number;
    is_closed: boolean;
    updated_at: string;
  }>;
}

/**
 * 앱 원본 데이터로부터 9개 대상 테이블별 정확한 마이그레이션 대상 행 및 건수 산출
 */
export function calculateMigrationSourceCounts(source: MigrationSourceData): CalculatedSourceCounts {
  // 1. product_room_types: 패키지(상품)에 바인딩된 roomTypeIds 연결 관계 추출
  const productRoomTypeRows: Array<{
    id: string;
    product_id: string;
    package_id: string;
    room_type_id: string;
  }> = [];

  source.packages.forEach((pr) => {
    const pkgId = pr.id;
    if (Array.isArray(pr.roomTypeIds) && pr.roomTypeIds.length > 0) {
      pr.roomTypeIds.forEach((rtId) => {
        if (rtId) {
          productRoomTypeRows.push({
            id: `${pkgId}_${rtId}`,
            product_id: pkgId,
            package_id: pkgId,
            room_type_id: rtId,
          });
        }
      });
    }
  });

  // 2. inventory: 일자별 요금(dailyRates)에서 (date, roomTypeId) 고유 조합 기준 재고 행 추출
  const inventoryMap = new Map<string, {
    id: string;
    date: string;
    room_type_id: string;
    total_stock: number;
    reserved_stock: number;
    is_closed: boolean;
    updated_at: string;
  }>();

  source.dailyRates.forEach((dr) => {
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

  return {
    room_types: source.roomTypes.length,
    partners: source.partners.length,
    products: source.packages.length,
    product_room_types: productRoomTypeRows.length,
    product_prices: source.dailyRates.length,
    inventory: inventoryRows.length,
    operation_notices: 7,
    reservations: source.reservations?.length || 0,
    audit_logs: source.auditLogs?.length || 0,
    productRoomTypeRows,
    inventoryRows,
  };
}

/**
 * 승인된 마스터 관리자 전용 수동 1회 마이그레이션 실행기
 * - 외래키 의존성 순서 엄수: room_types -> partners -> products -> product_room_types -> product_prices -> inventory -> operation_notices -> reservations -> audit_logs
 * - room_types: base_price 완전 제외, standard_price 매핑
 * - inventory.available_stock은 GENERATED 컬럼이므로 INSERT/UPDATE 대상에서 완전 제외 (0건)
 * - reservations에 삭제된 카드정보 컬럼 미포함 (오픈카드/CVC/카드번호 완전 배제 0건)
 * - admin_users는 현재 Auth 기반 관리자 데이터를 보존하기 위해 덮어쓰지 않음
 * - 각 테이블 PK 및 UNIQUE 기준 UPSERT로 중복 복제 방지
 */
export async function executeManualMigration(
  _source: MigrationSourceData,
  _onProgress?: (currentTable: string, stepIndex: number, totalSteps: number) => void
): Promise<MigrationExecutionResult> {
  return {
    success: false,
    message: '기존 627건 예시 데이터 마이그레이션 기능은 비활성화되었습니다. 운영 데이터는 관리자 화면에서 직접 등록하십시오.',
    tables: [],
    error: 'MIGRATION_DISABLED',
  };
}
