-- ====================================================================
-- OAK VALLEY PARTNER RESERVATION SYSTEM - SUPABASE SCHEMA
-- 오크밸리 리조트 제휴사 임직원 전용 예약 시스템 영구 데이터베이스 스키마
-- ====================================================================

-- 1. UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PARTNERS (제휴사 정보)
CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  discount_rate NUMERIC DEFAULT 0,
  contract_start DATE,
  contract_end DATE,
  is_active BOOLEAN DEFAULT true,
  manager_name VARCHAR(100),
  manager_phone VARCHAR(50),
  manager_email VARCHAR(150),
  business_number VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS (패키지 / 상품 정보)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  partner_id VARCHAR(100) DEFAULT 'ALL',
  partner_code VARCHAR(50) DEFAULT 'ALL',
  name VARCHAR(250) NOT NULL,
  category VARCHAR(50) DEFAULT 'ROOM_ONLY',
  category_label VARCHAR(100),
  description TEXT,
  inclusions JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  max_occupancy INTEGER DEFAULT 4,
  base_price NUMERIC DEFAULT 0,
  highlight_badge VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  room_type_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INVENTORY (일자별/객실타입별 재고)
-- available_stock >= 0 제약 조건으로 동시 예약 시 음수 재고 방지
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(100) PRIMARY KEY,
  date DATE NOT NULL,
  room_type_id VARCHAR(100) NOT NULL,
  total_stock INTEGER NOT NULL DEFAULT 10,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER NOT NULL DEFAULT 10,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_inventory_date_room UNIQUE (date, room_type_id),
  CONSTRAINT chk_inventory_stock_non_negative CHECK (available_stock >= 0)
);

-- 5. PRODUCT_PRICES (일자별 / 객실별 / 상품별 요금 매트릭스)
CREATE TABLE IF NOT EXISTS product_prices (
  id VARCHAR(100) PRIMARY KEY,
  package_id VARCHAR(100) NOT NULL,
  room_type_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_product_prices_pkg_room_date UNIQUE (package_id, room_type_id, date)
);

-- 6. RESERVATIONS (예약 내역)
CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(100) PRIMARY KEY,
  pms_reservation_no VARCHAR(100),
  partner_id VARCHAR(100),
  partner_name VARCHAR(200),
  partner_code VARCHAR(50),
  package_id VARCHAR(100),
  package_name VARCHAR(250),
  room_type_id VARCHAR(100),
  room_type_name VARCHAR(200),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  room_count INTEGER NOT NULL DEFAULT 1,
  guest_count INTEGER DEFAULT 2,
  booker_name VARCHAR(100) NOT NULL,
  booker_phone VARCHAR(50) NOT NULL,
  booker_email VARCHAR(150) NOT NULL,
  guest_name VARCHAR(100),
  guest_phone VARCHAR(50),
  total_price NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT,
  penalty_amount NUMERIC DEFAULT 0,
  payment_guarantee JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. OPERATION_NOTICES (운영 정보: 공지, 객실 타입, 시즌 기간, 취소 규정, 특수일 등)
CREATE TABLE IF NOT EXISTS operation_notices (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(250),
  content TEXT,
  payload JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ADMIN_USERS (관리자 계정 정보)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'sales_agent',
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. AUDIT_LOGS (전체 감사 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  actor_name VARCHAR(100) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_summary VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- INDEXES (인덱스 최적화)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners (code);
CREATE INDEX IF NOT EXISTS idx_products_partner ON products (partner_id, partner_code);
CREATE INDEX IF NOT EXISTS idx_product_prices_date ON product_prices (date, room_type_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory (date, room_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_checkin ON reservations (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);

-- ====================================================================
-- STORAGE BUCKET CREATION (오크밸리 미디어/이미지 버킷)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('oakvalley-assets', 'oakvalley-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 버킷 RLS 정책: 누구나 공개 읽기 가능, 업로드 및 삭제 허용
CREATE POLICY "Public Access Oakvalley Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'oakvalley-assets');

CREATE POLICY "Allow Upload Oakvalley Assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'oakvalley-assets');

CREATE POLICY "Allow Update Oakvalley Assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'oakvalley-assets');

CREATE POLICY "Allow Delete Oakvalley Assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'oakvalley-assets');

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 정책 적용: Anon 키 허용 (프론트엔드 안전 액세스)
CREATE POLICY "Anon Full Access Partners" ON partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Product Prices" ON product_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Operation Notices" ON operation_notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Admin Users" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Audit Logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- REALTIME SUBSCRIPTION (실시간 동기화)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE partners, products, product_prices, inventory, reservations, operation_notices;
  END IF;
END $$;
