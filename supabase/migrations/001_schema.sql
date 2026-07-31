-- ============================================================
-- SchoolShop: Schema principal
-- ============================================================

-- Enums
CREATE TYPE listing_type AS ENUM ('book', 'uniform');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'removed');
CREATE TYPE condition_type AS ENUM ('como_nuevo', 'buen_estado', 'regular');
CREATE TYPE garment_type AS ENUM (
  'camisa', 'pantalon', 'pollera', 'buzo', 'zapatos',
  'medias', 'guardapolvo', 'corbata', 'bermuda', 'campera'
);
CREATE TYPE gender_type AS ENUM ('masculino', 'femenino', 'unisex');
CREATE TYPE rating_role AS ENUM ('buyer', 'seller');

-- Colegios
CREATE TABLE schools (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  slug      text UNIQUE NOT NULL,
  city      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Invitaciones por colegio
CREATE TABLE invitations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid NOT NULL REFERENCES schools(id),
  code       text UNIQUE NOT NULL,
  used_by    uuid UNIQUE,          -- FK a families agregada abajo
  used_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Familias (1 cuenta por núcleo familiar, id = auth.uid)
CREATE TABLE families (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id    uuid NOT NULL REFERENCES schools(id),
  display_name text NOT NULL,
  phone        text NOT NULL,
  email        text NOT NULL,
  rating_avg   numeric(3,2),
  rating_count int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- FK diferida: invitations.used_by → families
ALTER TABLE invitations
  ADD CONSTRAINT invitations_used_by_fkey
  FOREIGN KEY (used_by) REFERENCES families(id);

-- Publicaciones (libros y uniformes unificados)
CREATE TABLE listings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid NOT NULL REFERENCES schools(id),
  family_id  uuid NOT NULL REFERENCES families(id),
  type       listing_type NOT NULL,
  status     listing_status NOT NULL DEFAULT 'active',
  price      numeric(10,2),
  condition  condition_type NOT NULL,
  notes      text CHECK (char_length(notes) <= 280),
  created_at timestamptz DEFAULT now(),
  sold_at    timestamptz
);

-- Detalle de libros
CREATE TABLE book_details (
  listing_id uuid PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  isbn       text NOT NULL,
  title      text NOT NULL,
  author     text NOT NULL,
  subject    text NOT NULL,
  grade      text NOT NULL
);

-- Detalle de uniformes
CREATE TABLE uniform_details (
  listing_id   uuid PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  garment_type garment_type NOT NULL,
  size         text NOT NULL,
  gender       gender_type NOT NULL,
  color        text
);

-- Contactos: cuando un comprador solicita datos del vendedor
CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES listings(id),
  buyer_family_id uuid NOT NULL REFERENCES families(id),
  created_at      timestamptz DEFAULT now(),
  UNIQUE(listing_id, buyer_family_id)
);

-- Calificaciones bidireccionales
CREATE TABLE ratings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES listings(id),
  rater_family_id  uuid NOT NULL REFERENCES families(id),
  rated_family_id  uuid NOT NULL REFERENCES families(id),
  role             rating_role NOT NULL,
  score            int NOT NULL CHECK (score >= 1 AND score <= 5),
  comment          text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(listing_id, rater_family_id, role)
);

-- Índices de rendimiento
CREATE INDEX listings_school_status_idx ON listings(school_id, status);
CREATE INDEX listings_family_idx ON listings(family_id);
CREATE INDEX listings_created_idx ON listings(created_at DESC);
CREATE INDEX book_details_isbn_idx ON book_details(isbn);
CREATE INDEX book_details_title_idx ON book_details USING gin(to_tsvector('spanish', title || ' ' || author));
