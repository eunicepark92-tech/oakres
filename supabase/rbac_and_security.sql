-- ====================================================================
-- OAK VALLEY SUPABASE RBAC & LEAST PRIVILEGE SECURITY CONFIGURATION
-- 역할 기반 최소 권한 구성 및 보안 정책 (Non-Destructive & Idempotent)
-- ====================================================================
-- [원칙]
-- 1. anon 사용자에게는 전체 테이블 INSERT / UPDATE / DELETE 권한을 부여하지 않습니다.
--    (GRANT ALL ON ALL TABLES TO anon 금지)
-- 2. anon(비로그인 예약 고객)은 공개 상품/객실/요금 조회 및 보안 RPC를 통한 예약/조회만 허용합니다.
-- 3. authenticated(로그인 관리자)는 admin_users에 등록/승인된 역할(master, admin)에 한해 안전하게 RLS 통과.
-- 4. 마이그레이션 및 고권한 일괄 처리는 서버사이드 service_role(SUPABASE_SERVICE_ROLE_KEY)을 통해서만 수행됩니다.
-- ====================================================================

-- 1. 기본 SCHEMA 접근 권한
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 2. 테이블 기본 권한 (Least Privilege)
-- anon: 공개 조회(SELECT)만 허용 (고객 예약 생성/조회/취소는 SECURITY DEFINER 함수를 통해 수행)
GRANT SELECT ON TABLE public.partners TO anon;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.product_prices TO anon;
GRANT SELECT ON TABLE public.inventory TO anon;
GRANT SELECT ON TABLE public.operation_notices TO anon;

-- authenticated: 업무용 SELECT/INSERT/UPDATE 허용 (RLS 정책에 의해 본인/관리자 권한 필터링됨)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- service_role: 전체 관리 권한 (서버사이드 전용)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. RLS 정책 재정비 (안전한 조건부 구성)

-- Helper 함수: 현재 사용자가 승인된 관리자인지 확인
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper 함수: 현재 사용자가 승인된 마스터 관리자인지 확인
CREATE OR REPLACE FUNCTION public.is_approved_master()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND approved = true
      AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. PARTNERS 테이블 정책
DROP POLICY IF EXISTS "Anon Select Partners" ON public.partners;
CREATE POLICY "Anon Select Partners" ON public.partners
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Admin Manage Partners" ON public.partners;
CREATE POLICY "Admin Manage Partners" ON public.partners
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 5. PRODUCTS 테이블 정책
DROP POLICY IF EXISTS "Anon Select Products" ON public.products;
CREATE POLICY "Anon Select Products" ON public.products
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Admin Manage Products" ON public.products;
CREATE POLICY "Admin Manage Products" ON public.products
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 6. PRODUCT_PRICES 테이블 정책
DROP POLICY IF EXISTS "Anon Select Product Prices" ON public.product_prices;
CREATE POLICY "Anon Select Product Prices" ON public.product_prices
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Admin Manage Product Prices" ON public.product_prices;
CREATE POLICY "Admin Manage Product Prices" ON public.product_prices
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 7. INVENTORY 테이블 정책
DROP POLICY IF EXISTS "Anon Select Inventory" ON public.inventory;
CREATE POLICY "Anon Select Inventory" ON public.inventory
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Admin Manage Inventory" ON public.inventory;
CREATE POLICY "Admin Manage Inventory" ON public.inventory
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 8. OPERATION_NOTICES 테이블 정책
DROP POLICY IF EXISTS "Anon Select Operation Notices" ON public.operation_notices;
CREATE POLICY "Anon Select Operation Notices" ON public.operation_notices
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Admin Manage Operation Notices" ON public.operation_notices;
CREATE POLICY "Admin Manage Operation Notices" ON public.operation_notices
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 9. RESERVATIONS 테이블 정책
-- anon 사용자는 직접 SELECT/INSERT 금지 (SECURITY DEFINER RPC 함수 create_reservation_secure, lookup_customer_reservation_safe를 통해서만 처리)
-- authenticated 사용자는 승인된 관리자만 전체 조회/관리 허용
DROP POLICY IF EXISTS "Admin Manage Reservations" ON public.reservations;
CREATE POLICY "Admin Manage Reservations" ON public.reservations
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 10. ADMIN_USERS 테이블 정책
-- 본인 정보 조회 또는 마스터 관리자만 관리 가능
DROP POLICY IF EXISTS "Self Or Master Admin Users" ON public.admin_users;
CREATE POLICY "Self Or Master Admin Users" ON public.admin_users
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_approved_master()
  );

DROP POLICY IF EXISTS "Master Manage Admin Users" ON public.admin_users;
CREATE POLICY "Master Manage Admin Users" ON public.admin_users
  FOR ALL TO authenticated USING (public.is_approved_master())
  WITH CHECK (public.is_approved_master());

-- 11. AUDIT_LOGS 테이블 정책
-- 승인된 관리자만 감사 로그 읽기 가능, 등록은 authenticated 사용자 허용
DROP POLICY IF EXISTS "Admin View Audit Logs" ON public.audit_logs;
CREATE POLICY "Admin View Audit Logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_approved_admin());

DROP POLICY IF EXISTS "Auth Insert Audit Logs" ON public.audit_logs;
CREATE POLICY "Auth Insert Audit Logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 12. Helper 함수: 현재 사용자가 승인된 제휴사 사용자인지 확인
CREATE OR REPLACE FUNCTION public.is_approved_partner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND status = 'APPROVED'
      AND role = 'PARTNER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 13. USER_PROFILES 테이블 정책
-- 본인 정보 조회/수정 또는 승인된 관리자가 관리 가능
DROP POLICY IF EXISTS "Self Or Admin Select Profiles" ON public.user_profiles;
CREATE POLICY "Self Or Admin Select Profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid() OR public.is_approved_admin()
  );

DROP POLICY IF EXISTS "Self Register Profile" ON public.user_profiles;
CREATE POLICY "Self Register Profile" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (
    id = auth.uid()
  );

DROP POLICY IF EXISTS "Self Or Master Update Profiles" ON public.user_profiles;
CREATE POLICY "Self Or Master Update Profiles" ON public.user_profiles
  FOR UPDATE TO authenticated USING (
    id = auth.uid() OR public.is_approved_master()
  ) WITH CHECK (
    id = auth.uid() OR public.is_approved_master()
  );

DROP POLICY IF EXISTS "Master Delete Profiles" ON public.user_profiles;
CREATE POLICY "Master Delete Profiles" ON public.user_profiles
  FOR DELETE TO authenticated USING (
    public.is_approved_master()
  );

-- 14. COMPONENTS 테이블 정책
-- 비로그인 포함 모든 고객 조회 가능, 관리자는 전체 권한
DROP POLICY IF EXISTS "Public View Components" ON public.components;
CREATE POLICY "Public View Components" ON public.components
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admin Manage Components" ON public.components;
CREATE POLICY "Admin Manage Components" ON public.components
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 15. PARTNER_COMPONENT_RULES 테이블 정책
-- 로그인 사용자 조회 가능, 관리자는 전체 권한
DROP POLICY IF EXISTS "Auth View Partner Rules" ON public.partner_component_rules;
CREATE POLICY "Auth View Partner Rules" ON public.partner_component_rules
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin Manage Partner Rules" ON public.partner_component_rules;
CREATE POLICY "Admin Manage Partner Rules" ON public.partner_component_rules
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 16. RESERVATION_ITEMS 테이블 정책
-- 비로그인 조회 가능 (보조 snapshot용), 관리자는 전체 권한
DROP POLICY IF EXISTS "Public View Reservation Items" ON public.reservation_items;
CREATE POLICY "Public View Reservation Items" ON public.reservation_items
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin Manage Reservation Items" ON public.reservation_items;
CREATE POLICY "Admin Manage Reservation Items" ON public.reservation_items
  FOR ALL TO authenticated USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

