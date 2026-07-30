-- ============================================================
-- SchoolShop: Datos iniciales para desarrollo y pruebas
-- ============================================================

-- Colegios demo
INSERT INTO schools (id, name, slug, city) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Colegio San Martín', 'san-martin', 'Buenos Aires'),
  ('00000000-0000-0000-0000-000000000002', 'Colegio Belgrano',   'belgrano',   'Buenos Aires');

-- Códigos de invitación (Colegio San Martín)
INSERT INTO invitations (school_id, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-A1'),
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-B2'),
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-C3'),
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-D4'),
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-E5'),
  ('00000000-0000-0000-0000-000000000001', 'SANMARTIN-TEST');

-- Códigos de invitación (Colegio Belgrano) — para test de aislamiento
INSERT INTO invitations (school_id, code) VALUES
  ('00000000-0000-0000-0000-000000000002', 'BELGRANO-A1'),
  ('00000000-0000-0000-0000-000000000002', 'BELGRANO-B2'),
  ('00000000-0000-0000-0000-000000000002', 'BELGRANO-TEST');
