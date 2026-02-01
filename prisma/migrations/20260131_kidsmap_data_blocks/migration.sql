-- KidsMap 데이터 블록 스키마
-- 대규모 어린이 놀이 공간 데이터 저장을 위한 테이블 구조

-- ============================================
-- ENUM 타입 정의
-- ============================================

CREATE TYPE block_status AS ENUM ('draft', 'active', 'archived', 'deleted');
CREATE TYPE quality_grade AS ENUM ('A', 'B', 'C', 'D', 'F');
CREATE TYPE freshness_level AS ENUM ('fresh', 'recent', 'stale', 'outdated');
CREATE TYPE place_category AS ENUM ('amusement_park', 'zoo_aquarium', 'kids_cafe', 'museum', 'nature_park', 'other');
CREATE TYPE place_source AS ENUM ('TOUR_API', 'PLAYGROUND_API', 'KAKAO_LOCAL', 'MANUAL');
CREATE TYPE content_source AS ENUM ('YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP');
CREATE TYPE content_type AS ENUM ('video', 'blog_post', 'short_video');
CREATE TYPE crawl_job_type AS ENUM ('FULL_CRAWL', 'INCREMENTAL', 'REGION_CRAWL', 'CATEGORY_CRAWL', 'CONTENT_REFRESH', 'QUALITY_CHECK', 'DEDUP_SCAN');
CREATE TYPE crawl_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused');

-- ============================================
-- 장소 데이터 블록 테이블
-- ============================================

CREATE TABLE kidsmap_place_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정규화된 장소 데이터 (JSONB)
    data JSONB NOT NULL,

    -- 블록 상태
    status block_status NOT NULL DEFAULT 'active',
    quality_grade quality_grade NOT NULL DEFAULT 'C',
    freshness freshness_level NOT NULL DEFAULT 'fresh',
    completeness INTEGER NOT NULL DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),

    -- 중복 체크용 해시
    dedupe_hash VARCHAR(64) NOT NULL UNIQUE,

    -- 관련 콘텐츠 ID 배열
    related_content_ids UUID[] DEFAULT '{}',

    -- 검색 최적화
    search_keywords TEXT[] DEFAULT '{}',
    region_code VARCHAR(10),

    -- 핵심 필드 추출 (검색/필터용)
    name VARCHAR(255) NOT NULL,
    category place_category NOT NULL,
    source place_source NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,

    -- 메타데이터
    metadata JSONB DEFAULT '{}',

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    crawl_count INTEGER NOT NULL DEFAULT 1
);

-- 인덱스
CREATE INDEX idx_place_blocks_status ON kidsmap_place_blocks(status);
CREATE INDEX idx_place_blocks_category ON kidsmap_place_blocks(category);
CREATE INDEX idx_place_blocks_region ON kidsmap_place_blocks(region_code);
CREATE INDEX idx_place_blocks_source ON kidsmap_place_blocks(source, source_id);
CREATE INDEX idx_place_blocks_quality ON kidsmap_place_blocks(quality_grade);
CREATE INDEX idx_place_blocks_freshness ON kidsmap_place_blocks(freshness);
CREATE INDEX idx_place_blocks_location ON kidsmap_place_blocks(latitude, longitude);
CREATE INDEX idx_place_blocks_name ON kidsmap_place_blocks USING gin(to_tsvector('korean', name));
CREATE INDEX idx_place_blocks_keywords ON kidsmap_place_blocks USING gin(search_keywords);
CREATE INDEX idx_place_blocks_data ON kidsmap_place_blocks USING gin(data);
CREATE INDEX idx_place_blocks_updated ON kidsmap_place_blocks(updated_at DESC);

-- PostGIS 확장 사용 시 공간 인덱스 (선택적)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE kidsmap_place_blocks ADD COLUMN geom geometry(Point, 4326);
-- CREATE INDEX idx_place_blocks_geom ON kidsmap_place_blocks USING gist(geom);

-- ============================================
-- 콘텐츠 데이터 블록 테이블
-- ============================================

CREATE TABLE kidsmap_content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정규화된 콘텐츠 데이터 (JSONB)
    data JSONB NOT NULL,

    -- 블록 상태
    status block_status NOT NULL DEFAULT 'active',
    quality_grade quality_grade NOT NULL DEFAULT 'C',
    freshness freshness_level NOT NULL DEFAULT 'fresh',

    -- 관련 장소 블록 참조
    related_place_id UUID REFERENCES kidsmap_place_blocks(id) ON DELETE SET NULL,

    -- 중복 체크용 해시
    dedupe_hash VARCHAR(64) NOT NULL UNIQUE,

    -- 핵심 필드 추출
    title VARCHAR(500) NOT NULL,
    source content_source NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    content_type content_type NOT NULL,
    author VARCHAR(255),
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- 콘텐츠 분석 결과
    analysis JSONB DEFAULT '{}',

    -- 메타데이터
    metadata JSONB DEFAULT '{}',

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_content_blocks_status ON kidsmap_content_blocks(status);
CREATE INDEX idx_content_blocks_source ON kidsmap_content_blocks(source, source_id);
CREATE INDEX idx_content_blocks_place ON kidsmap_content_blocks(related_place_id);
CREATE INDEX idx_content_blocks_quality ON kidsmap_content_blocks(quality_grade);
CREATE INDEX idx_content_blocks_published ON kidsmap_content_blocks(published_at DESC);
CREATE INDEX idx_content_blocks_views ON kidsmap_content_blocks(view_count DESC);
CREATE INDEX idx_content_blocks_title ON kidsmap_content_blocks USING gin(to_tsvector('korean', title));
CREATE INDEX idx_content_blocks_data ON kidsmap_content_blocks USING gin(data);
CREATE INDEX idx_content_blocks_analysis ON kidsmap_content_blocks USING gin(analysis);

-- ============================================
-- 크롤링 작업 테이블
-- ============================================

CREATE TABLE kidsmap_crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 작업 정보
    type crawl_job_type NOT NULL,
    status crawl_job_status NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

    -- 작업 설정
    config JSONB NOT NULL,

    -- 진행 상황
    progress JSONB NOT NULL DEFAULT '{
        "totalEstimated": 0,
        "processed": 0,
        "succeeded": 0,
        "failed": 0,
        "skipped": 0,
        "percentage": 0
    }',

    -- 결과
    result JSONB,

    -- 에러 정보
    error JSONB,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,

    -- 재시도 정보
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3
);

-- 인덱스
CREATE INDEX idx_crawl_jobs_status ON kidsmap_crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_type ON kidsmap_crawl_jobs(type);
CREATE INDEX idx_crawl_jobs_priority ON kidsmap_crawl_jobs(priority DESC);
CREATE INDEX idx_crawl_jobs_scheduled ON kidsmap_crawl_jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_crawl_jobs_created ON kidsmap_crawl_jobs(created_at DESC);

-- ============================================
-- 크롤링 스케줄 테이블
-- ============================================

CREATE TABLE kidsmap_crawl_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 스케줄 정보
    name VARCHAR(100) NOT NULL,
    cron VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,

    -- 작업 설정
    job_config JSONB NOT NULL,

    -- 실행 이력
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_crawl_schedules_enabled ON kidsmap_crawl_schedules(enabled);
CREATE INDEX idx_crawl_schedules_next_run ON kidsmap_crawl_schedules(next_run_at) WHERE enabled = true;

-- ============================================
-- 블록 통계 테이블 (캐시용)
-- ============================================

CREATE TABLE kidsmap_block_stats (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',

    -- 전체 카운트
    total_places INTEGER NOT NULL DEFAULT 0,
    total_contents INTEGER NOT NULL DEFAULT 0,

    -- 상태별 분포
    places_by_status JSONB NOT NULL DEFAULT '{}',
    contents_by_status JSONB NOT NULL DEFAULT '{}',

    -- 카테고리/소스별 분포
    places_by_category JSONB NOT NULL DEFAULT '{}',
    places_by_region JSONB NOT NULL DEFAULT '{}',
    contents_by_source JSONB NOT NULL DEFAULT '{}',

    -- 품질 분포
    quality_distribution JSONB NOT NULL DEFAULT '{}',
    freshness_distribution JSONB NOT NULL DEFAULT '{}',

    -- 평균값
    average_completeness DECIMAL(5, 2) NOT NULL DEFAULT 0,

    -- 마지막 업데이트
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 초기 통계 레코드 삽입
INSERT INTO kidsmap_block_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- ============================================
-- 트리거 함수: updated_at 자동 갱신
-- ============================================

CREATE OR REPLACE FUNCTION update_kidsmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER trigger_place_blocks_updated_at
    BEFORE UPDATE ON kidsmap_place_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_kidsmap_updated_at();

CREATE TRIGGER trigger_content_blocks_updated_at
    BEFORE UPDATE ON kidsmap_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_kidsmap_updated_at();

CREATE TRIGGER trigger_crawl_schedules_updated_at
    BEFORE UPDATE ON kidsmap_crawl_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_kidsmap_updated_at();

-- ============================================
-- 트리거 함수: 신선도 자동 갱신
-- ============================================

CREATE OR REPLACE FUNCTION update_kidsmap_freshness()
RETURNS TRIGGER AS $$
BEGIN
    -- 크롤링 후 경과 시간에 따라 신선도 설정
    IF NEW.last_crawled_at > NOW() - INTERVAL '7 days' THEN
        NEW.freshness = 'fresh';
    ELSIF NEW.last_crawled_at > NOW() - INTERVAL '30 days' THEN
        NEW.freshness = 'recent';
    ELSIF NEW.last_crawled_at > NOW() - INTERVAL '90 days' THEN
        NEW.freshness = 'stale';
    ELSE
        NEW.freshness = 'outdated';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER trigger_place_freshness
    BEFORE INSERT OR UPDATE OF last_crawled_at ON kidsmap_place_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_kidsmap_freshness();

CREATE TRIGGER trigger_content_freshness
    BEFORE INSERT OR UPDATE OF last_crawled_at ON kidsmap_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_kidsmap_freshness();

-- ============================================
-- 통계 자동 업데이트 함수
-- ============================================

CREATE OR REPLACE FUNCTION refresh_kidsmap_stats()
RETURNS void AS $$
BEGIN
    UPDATE kidsmap_block_stats
    SET
        total_places = (SELECT COUNT(*) FROM kidsmap_place_blocks WHERE status = 'active'),
        total_contents = (SELECT COUNT(*) FROM kidsmap_content_blocks WHERE status = 'active'),
        places_by_status = (
            SELECT jsonb_object_agg(status, cnt)
            FROM (SELECT status, COUNT(*) as cnt FROM kidsmap_place_blocks GROUP BY status) s
        ),
        places_by_category = (
            SELECT jsonb_object_agg(category, cnt)
            FROM (SELECT category, COUNT(*) as cnt FROM kidsmap_place_blocks WHERE status = 'active' GROUP BY category) s
        ),
        places_by_region = (
            SELECT COALESCE(jsonb_object_agg(region_code, cnt), '{}')
            FROM (SELECT region_code, COUNT(*) as cnt FROM kidsmap_place_blocks WHERE status = 'active' AND region_code IS NOT NULL GROUP BY region_code) s
        ),
        contents_by_source = (
            SELECT jsonb_object_agg(source, cnt)
            FROM (SELECT source, COUNT(*) as cnt FROM kidsmap_content_blocks WHERE status = 'active' GROUP BY source) s
        ),
        quality_distribution = (
            SELECT jsonb_object_agg(quality_grade, cnt)
            FROM (SELECT quality_grade, COUNT(*) as cnt FROM kidsmap_place_blocks WHERE status = 'active' GROUP BY quality_grade) s
        ),
        freshness_distribution = (
            SELECT jsonb_object_agg(freshness, cnt)
            FROM (SELECT freshness, COUNT(*) as cnt FROM kidsmap_place_blocks WHERE status = 'active' GROUP BY freshness) s
        ),
        average_completeness = (
            SELECT COALESCE(AVG(completeness), 0) FROM kidsmap_place_blocks WHERE status = 'active'
        ),
        last_updated = NOW()
    WHERE id = 'global';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE kidsmap_place_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_crawl_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_block_stats ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모든 인증된 사용자)
CREATE POLICY "place_blocks_read_policy" ON kidsmap_place_blocks
    FOR SELECT
    USING (status IN ('active', 'archived'));

CREATE POLICY "content_blocks_read_policy" ON kidsmap_content_blocks
    FOR SELECT
    USING (status IN ('active', 'archived'));

CREATE POLICY "block_stats_read_policy" ON kidsmap_block_stats
    FOR SELECT
    USING (true);

-- 쓰기 정책 (서비스 역할만)
CREATE POLICY "place_blocks_write_policy" ON kidsmap_place_blocks
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "content_blocks_write_policy" ON kidsmap_content_blocks
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "crawl_jobs_policy" ON kidsmap_crawl_jobs
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "crawl_schedules_policy" ON kidsmap_crawl_schedules
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE kidsmap_place_blocks IS 'KidsMap 장소 데이터 블록 - 어린이 놀이 공간 정보 저장';
COMMENT ON TABLE kidsmap_content_blocks IS 'KidsMap 콘텐츠 데이터 블록 - YouTube, 블로그 리뷰 저장';
COMMENT ON TABLE kidsmap_crawl_jobs IS 'KidsMap 크롤링 작업 큐 - Bull MQ 연동';
COMMENT ON TABLE kidsmap_crawl_schedules IS 'KidsMap 크롤링 스케줄 - 정기 실행 설정';
COMMENT ON TABLE kidsmap_block_stats IS 'KidsMap 블록 통계 캐시';
