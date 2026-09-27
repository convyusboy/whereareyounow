-- Backfills latitude/longitude for the interactive distribution map. Full
-- precision isn't needed (and pinpoint-precise coordinates would work
-- against the privacy goal anyway) — provincial/national capital centroids
-- are used throughout, with the map falling back city -> province -> country
-- when a member's exact city has no dedicated row here (see
-- lib/db/queries/publicStats.ts). Coordinates are approximate capital-city
-- centroids from general geographic knowledge, not a geocoding service.

-- Indonesia (country-level fallback)
update locations set latitude = -2.5, longitude = 118.0
where country_code = 'ID' and province_code is null and city_code is null;

-- Indonesia provinces (province-level fallback, capital city centroids)
update locations set latitude = v.lat, longitude = v.lng
from (values
  ('11', 5.5483, 95.3238),
  ('12', 3.5952, 98.6722),
  ('13', -0.9471, 100.4172),
  ('14', 0.5333, 101.4500),
  ('15', -1.6101, 103.6131),
  ('16', -2.9761, 104.7754),
  ('17', -3.8004, 102.2655),
  ('18', -5.4292, 105.2610),
  ('19', -2.1316, 106.1169),
  ('21', 0.9186, 104.4453),
  ('31', -6.2088, 106.8456),
  ('32', -6.9175, 107.6191),
  ('33', -6.9932, 110.4203),
  ('34', -7.7956, 110.3695),
  ('35', -7.2575, 112.7521),
  ('36', -6.1149, 106.1503),
  ('51', -8.6705, 115.2126),
  ('52', -8.5833, 116.1167),
  ('53', -10.1772, 123.6070),
  ('61', -0.0263, 109.3425),
  ('62', -2.2096, 113.9213),
  ('63', -3.3186, 114.5944),
  ('64', -0.5022, 117.1536),
  ('65', 2.8386, 117.3667),
  ('71', 1.4748, 124.8421),
  ('72', -0.8917, 119.8707),
  ('73', -5.1477, 119.4327),
  ('74', -3.9450, 122.4989),
  ('75', 0.5435, 123.0568),
  ('76', -2.6785, 118.8877),
  ('81', -3.6954, 128.1814),
  ('82', 0.7167, 127.9667),
  ('91', -2.5337, 140.7181),
  ('92', -0.8615, 134.0620),
  ('93', -8.4700, 140.4000),
  ('94', -3.3667, 135.4833),
  ('95', -4.1025, 138.9550),
  ('96', -0.8833, 131.2500)
) as v(code, lat, lng)
where locations.province_code = v.code and locations.city_code is null;

-- A handful of specific Indonesian cities/regencies with more precise
-- coordinates than their province capital fallback, for whichever ones
-- happen to have members. Harmless if a code doesn't match any row.
update locations set latitude = v.lat, longitude = v.lng
from (values
  ('31.71', -6.1805, 106.8284), -- Kota Administrasi Jakarta Pusat
  ('31.74', -6.2615, 106.8106), -- Kota Administrasi Jakarta Selatan
  ('32.73', -6.9175, 107.6191), -- Kota Bandung
  ('33.74', -6.9932, 110.4203), -- Kota Semarang
  ('34.71', -7.7956, 110.3695), -- Kota Yogyakarta
  ('35.78', -7.2575, 112.7521), -- Kota Surabaya
  ('36.03', -6.1783, 106.6319), -- Kabupaten Tangerang
  ('51.71', -8.6705, 115.2126)  -- Kota Denpasar
) as v(code, lat, lng)
where locations.city_code = v.code;

-- A modest set of likely overseas destinations (capital-city centroids).
-- Any other country simply has no map pin until a member's country is
-- added here — the list/breakdown view still shows its count regardless.
update locations set latitude = v.lat, longitude = v.lng
from (values
  ('SG', 1.3521, 103.8198),
  ('MY', 3.1390, 101.6869),
  ('AU', -35.2809, 149.1300),
  ('US', 38.9072, -77.0369),
  ('GB', 51.5072, -0.1276),
  ('NL', 52.3676, 4.9041),
  ('DE', 52.5200, 13.4050),
  ('JP', 35.6895, 139.6917),
  ('KR', 37.5665, 126.9780),
  ('AE', 24.4539, 54.3773),
  ('SA', 24.7136, 46.6753),
  ('QA', 25.2854, 51.5310),
  ('CA', 45.4215, -75.6972),
  ('NZ', -41.2865, 174.7762),
  ('CN', 39.9042, 116.4074),
  ('FR', 48.8566, 2.3522),
  ('TH', 13.7563, 100.5018),
  ('PH', 14.5995, 120.9842),
  ('IN', 28.6139, 77.2090),
  ('CH', 46.9480, 7.4474)
) as v(code, lat, lng)
where locations.country_code = v.code and locations.province_code is null and locations.city_code is null;
