-- =============================================================================
-- KidsMap Tables for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/onetwihfvaoprqvdrfck/sql
-- =============================================================================

-- Enums
CREATE TYPE block_status AS ENUM ('draft', 'active', 'archived', 'deleted');
CREATE TYPE quality_grade AS ENUM ('A', 'B', 'C', 'D', 'F');
CREATE TYPE freshness_level AS ENUM ('fresh', 'recent', 'stale', 'outdated');
CREATE TYPE place_category AS ENUM ('amusement_park', 'zoo_aquarium', 'nature_park', 'kids_cafe', 'museum', 'restaurant', 'public_facility', 'other');
CREATE TYPE place_source AS ENUM ('TOUR_API', 'PLAYGROUND_API', 'KAKAO_LOCAL', 'MANUAL');
CREATE TYPE content_source AS ENUM ('YOUTUBE', 'NAVER_BLOG', 'NAVER_CLIP');
CREATE TYPE content_type AS ENUM ('video', 'blog_post', 'short_video');

-- =============================================================================
-- KidsMap Place Blocks
-- =============================================================================
CREATE TABLE kidsmap_place_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정규화된 장소 데이터 (NormalizedPlace JSON)
    data JSONB NOT NULL,

    -- 블록 상태
    status block_status NOT NULL DEFAULT 'active',
    quality_grade quality_grade NOT NULL DEFAULT 'C',
    freshness freshness_level NOT NULL DEFAULT 'fresh',
    completeness INT NOT NULL DEFAULT 0,

    -- 중복 체크용 해시
    dedupe_hash VARCHAR(64) UNIQUE NOT NULL,

    -- 관련 콘텐츠 ID 배열
    related_content_ids TEXT[] DEFAULT '{}',

    -- 검색 최적화
    search_keywords TEXT[] DEFAULT '{}',
    region_code VARCHAR(10),

    -- 핵심 필드 추출
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
    crawl_count INT NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_place_blocks_status ON kidsmap_place_blocks(status);
CREATE INDEX idx_place_blocks_category ON kidsmap_place_blocks(category);
CREATE INDEX idx_place_blocks_region ON kidsmap_place_blocks(region_code);
CREATE INDEX idx_place_blocks_source ON kidsmap_place_blocks(source, source_id);
CREATE INDEX idx_place_blocks_quality ON kidsmap_place_blocks(quality_grade);
CREATE INDEX idx_place_blocks_freshness ON kidsmap_place_blocks(freshness);
CREATE INDEX idx_place_blocks_location ON kidsmap_place_blocks(latitude, longitude);
CREATE INDEX idx_place_blocks_updated ON kidsmap_place_blocks(updated_at DESC);

-- =============================================================================
-- KidsMap Content Blocks
-- =============================================================================
CREATE TABLE kidsmap_content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 정규화된 콘텐츠 데이터
    data JSONB NOT NULL,

    -- 블록 상태
    status block_status NOT NULL DEFAULT 'active',
    quality_grade quality_grade NOT NULL DEFAULT 'C',
    freshness freshness_level NOT NULL DEFAULT 'fresh',

    -- 관련 장소 블록 참조
    related_place_id UUID REFERENCES kidsmap_place_blocks(id) ON DELETE SET NULL,

    -- 중복 체크용 해시
    dedupe_hash VARCHAR(64) UNIQUE NOT NULL,

    -- 핵심 필드 추출
    title VARCHAR(500) NOT NULL,
    source content_source NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    content_type content_type NOT NULL,
    author VARCHAR(255),
    published_at TIMESTAMPTZ,
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,

    -- 분석 결과
    analysis JSONB DEFAULT '{}',

    -- 메타데이터
    metadata JSONB DEFAULT '{}',

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_blocks_status ON kidsmap_content_blocks(status);
CREATE INDEX idx_content_blocks_source ON kidsmap_content_blocks(source, source_id);
CREATE INDEX idx_content_blocks_place ON kidsmap_content_blocks(related_place_id);
CREATE INDEX idx_content_blocks_quality ON kidsmap_content_blocks(quality_grade);
CREATE INDEX idx_content_blocks_published ON kidsmap_content_blocks(published_at DESC);
CREATE INDEX idx_content_blocks_views ON kidsmap_content_blocks(view_count DESC);

-- =============================================================================
-- KidsMap Block Stats (캐시)
-- =============================================================================
CREATE TABLE kidsmap_block_stats (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',

    total_places INT NOT NULL DEFAULT 0,
    total_contents INT NOT NULL DEFAULT 0,

    places_by_status JSONB DEFAULT '{}',
    contents_by_status JSONB DEFAULT '{}',
    places_by_category JSONB DEFAULT '{}',
    places_by_region JSONB DEFAULT '{}',
    contents_by_source JSONB DEFAULT '{}',

    quality_distribution JSONB DEFAULT '{}',
    freshness_distribution JSONB DEFAULT '{}',

    average_completeness DECIMAL(5, 2) DEFAULT 0,

    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default stats row
INSERT INTO kidsmap_block_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE kidsmap_place_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_block_stats ENABLE ROW LEVEL SECURITY;

-- Allow read for all (public data)
CREATE POLICY "Allow public read" ON kidsmap_place_blocks FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kidsmap_content_blocks FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON kidsmap_block_stats FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all" ON kidsmap_place_blocks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all" ON kidsmap_content_blocks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all" ON kidsmap_block_stats FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_place_blocks_updated_at
    BEFORE UPDATE ON kidsmap_place_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_blocks_updated_at
    BEFORE UPDATE ON kidsmap_content_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
