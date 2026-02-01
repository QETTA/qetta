-- KidsMap Seed Data
-- Run against Supabase directly: psql $DATABASE_URL -f prisma/seed-kidsmap.sql
-- Or via Supabase Dashboard SQL Editor

-- Places table (create if not exists via Supabase migrations)
-- See: supabase/migrations/ in QETTA/kidsmap repo for full schema

INSERT INTO places (
  name, category, address, latitude, longitude, distance,
  age_2_4, age_5_7, age_8_10,
  stroller_friendly, nursing_room, parking_easy,
  indoor_outdoor, admission_fee,
  rating, reviews,
  description, hours, phone,
  popularity_score
) VALUES
(
  '에버랜드', 'theme_park',
  '경기도 용인시 처인구 포곡읍 에버랜드로 199',
  37.2941, 127.2025, '32km',
  false, true, true,
  true, true, true,
  'outdoor', '성인 62,000원',
  4.8, 1234,
  '국내 최대 규모의 테마파크로 다양한 놀이기구와 동물원, 사파리까지 즐길 수 있습니다.',
  '10:00 - 22:00', '031-320-5000',
  1000
),
(
  '롯데월드', 'theme_park',
  '서울특별시 송파구 올림픽로 240',
  37.5111, 127.0981, '15km',
  true, true, true,
  true, true, true,
  'both', '성인 59,000원',
  4.7, 2341,
  '날씨에 상관없이 즐길 수 있는 실내 테마파크와 매직아일랜드 야외 놀이공원이 함께 있습니다.',
  '09:30 - 22:00', '1661-2000',
  900
),
(
  '서울대공원', 'zoo',
  '경기도 과천시 대공원광장로 102',
  37.4285, 127.0157, '18km',
  true, true, true,
  true, true, true,
  'outdoor', '성인 5,000원',
  4.6, 892,
  '다양한 동물들을 가까이서 관찰할 수 있는 동물원과 식물원, 리프트까지!',
  '09:00 - 19:00', '02-500-7338',
  800
),
(
  '키즈카페 플레이랜드', 'cafe',
  '서울특별시 강남구 테헤란로 123',
  37.5048, 127.0495, '5km',
  true, true, false,
  false, true, true,
  'indoor', '아이 15,000원',
  4.5, 456,
  '아이들이 안전하게 뛰어놀 수 있는 대형 키즈카페! 다양한 놀이시설과 부모님을 위한 카페 공간도 마련되어 있습니다.',
  '10:00 - 20:00', '02-1234-5678',
  700
)
ON CONFLICT DO NOTHING;
