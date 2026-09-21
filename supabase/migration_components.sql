-- ====================================================================
-- ADDITIVE MIGRATION: COMPONENTS (DIY 패키지 단위 상품 마스터 테이블)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.components (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'ROOM', 'GOLF', 'FB', 'ACTIVITY', 'OPTION', 'BENEFIT'
  name VARCHAR(250) NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  normal_price NUMERIC,
  is_discountable BOOLEAN DEFAULT true, -- 제휴사 기본 할인율 적용 여부
  is_active BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]'::jsonb, -- AI 검색/추천용 메타 태그
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- 권한 부여 (anon, authenticated, service_role)
GRANT ALL ON TABLE public.components TO anon, authenticated, service_role;

-- RLS 정책 설정 (공개 및 관리자 접근 허용)
DROP POLICY IF EXISTS "Anon Full Access Components" ON public.components;
CREATE POLICY "Anon Full Access Components" ON public.components FOR ALL USING (true) WITH CHECK (true);

-- 카테고리 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_components_category ON public.components (category);

-- Realtime 게시 등록
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'components'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.components;
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
