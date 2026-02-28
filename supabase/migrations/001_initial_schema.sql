-- ============================================================
-- EasySafe: Complete database schema with RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Drop existing tables if rebuilding
-- ============================================================
DROP TABLE IF EXISTS round_counts CASCADE;
DROP TABLE IF EXISTS parts_attachments CASCADE;
DROP TABLE IF EXISTS magazines CASCADE;
DROP TABLE IF EXISTS trust_documents CASCADE;
DROP TABLE IF EXISTS suppressors CASCADE;
DROP TABLE IF EXISTS ammunition CASCADE;
DROP TABLE IF EXISTS firearms CASCADE;

-- ============================================================
-- FIREARMS
-- ============================================================
CREATE TABLE firearms (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make                TEXT NOT NULL,
  model               TEXT NOT NULL,
  serial              TEXT,
  caliber             TEXT,
  category            TEXT NOT NULL CHECK (category IN ('handgun', 'rifle', 'shotgun', 'nfa_firearm')),
  condition           TEXT CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'poor')),
  barrel_length       TEXT,
  feed_type           TEXT CHECK (feed_type IN ('internal', 'external')),
  internal_mag_capacity INTEGER,
  purchase_date       DATE,
  price               NUMERIC(10,2),
  storage_location    TEXT,
  notes               TEXT,
  photos              JSONB DEFAULT '[]'::jsonb,
  -- NFA-specific fields (NULL for non-NFA)
  form4_date          DATE,
  tax_stamp_status    TEXT CHECK (tax_stamp_status IN ('pending', 'approved', 'denied') OR tax_stamp_status IS NULL),
  trust_name          TEXT,
  nfa_designation     TEXT CHECK (nfa_designation IN ('sbr', 'sbs', 'mg', 'aow', 'dd') OR nfa_designation IS NULL),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firearms_user_id ON firearms(user_id);
CREATE INDEX idx_firearms_category ON firearms(user_id, category);
CREATE INDEX idx_firearms_caliber ON firearms(user_id, caliber);

-- ============================================================
-- AMMUNITION
-- ============================================================
CREATE TABLE ammunition (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caliber           TEXT NOT NULL,
  manufacturer      TEXT,
  bullet_type       TEXT,
  grain             INTEGER,
  casing_material   TEXT CHECK (casing_material IN ('brass', 'steel', 'aluminum', 'nickel', 'other') OR casing_material IS NULL),
  quantity          INTEGER NOT NULL DEFAULT 0,
  price             NUMERIC(10,2),
  notes             TEXT,
  photos            JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ammunition_user_id ON ammunition(user_id);
CREATE INDEX idx_ammunition_caliber ON ammunition(user_id, caliber);

-- ============================================================
-- SUPPRESSORS
-- ============================================================
CREATE TABLE suppressors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manufacturer      TEXT NOT NULL,
  model             TEXT NOT NULL,
  serial            TEXT,
  calibers_rated    TEXT[],
  length            TEXT,
  diameter          TEXT,
  weight            TEXT,
  mount_type        TEXT,
  form4_date        DATE,
  tax_stamp_status  TEXT CHECK (tax_stamp_status IN ('pending', 'approved', 'denied') OR tax_stamp_status IS NULL),
  trust_name        TEXT,
  purchase_date     DATE,
  price             NUMERIC(10,2),
  notes             TEXT,
  photos            JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppressors_user_id ON suppressors(user_id);

-- ============================================================
-- MAGAZINES
-- ============================================================
CREATE TABLE magazines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firearm_id      UUID REFERENCES firearms(id) ON DELETE SET NULL,
  manufacturer    TEXT,
  capacity        INTEGER,
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magazines_user_id ON magazines(user_id);
CREATE INDEX idx_magazines_firearm_id ON magazines(firearm_id);

-- ============================================================
-- PARTS & ATTACHMENTS
-- ============================================================
CREATE TABLE parts_attachments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_type     TEXT NOT NULL CHECK (parent_type IN ('firearm', 'suppressor')),
  parent_id       UUID NOT NULL,
  name            TEXT NOT NULL,
  type_category   TEXT,
  manufacturer    TEXT,
  model           TEXT,
  price           NUMERIC(10,2),
  notes           TEXT,
  photos          JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parts_user_id ON parts_attachments(user_id);
CREATE INDEX idx_parts_parent ON parts_attachments(parent_type, parent_id);

-- ============================================================
-- ROUND COUNTS
-- ============================================================
CREATE TABLE round_counts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_type     TEXT NOT NULL CHECK (parent_type IN ('firearm', 'suppressor')),
  parent_id       UUID NOT NULL,
  count           INTEGER NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_round_counts_user_id ON round_counts(user_id);
CREATE INDEX idx_round_counts_parent ON round_counts(parent_type, parent_id);

-- ============================================================
-- TRUST DOCUMENTS
-- ============================================================
CREATE TABLE trust_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  upload_date     DATE DEFAULT CURRENT_DATE,
  notes           TEXT,
  file_path       TEXT NOT NULL,
  file_size       INTEGER,
  file_type       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_documents_user_id ON trust_documents(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER firearms_updated_at
  BEFORE UPDATE ON firearms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ammunition_updated_at
  BEFORE UPDATE ON ammunition
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER suppressors_updated_at
  BEFORE UPDATE ON suppressors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER magazines_updated_at
  BEFORE UPDATE ON magazines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER parts_attachments_updated_at
  BEFORE UPDATE ON parts_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE firearms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ammunition ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppressors ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_documents ENABLE ROW LEVEL SECURITY;

-- FIREARMS
CREATE POLICY "Users can view own firearms"
  ON firearms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own firearms"
  ON firearms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own firearms"
  ON firearms FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own firearms"
  ON firearms FOR DELETE USING (auth.uid() = user_id);

-- AMMUNITION
CREATE POLICY "Users can view own ammunition"
  ON ammunition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ammunition"
  ON ammunition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ammunition"
  ON ammunition FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ammunition"
  ON ammunition FOR DELETE USING (auth.uid() = user_id);

-- SUPPRESSORS
CREATE POLICY "Users can view own suppressors"
  ON suppressors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppressors"
  ON suppressors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppressors"
  ON suppressors FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppressors"
  ON suppressors FOR DELETE USING (auth.uid() = user_id);

-- MAGAZINES
CREATE POLICY "Users can view own magazines"
  ON magazines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own magazines"
  ON magazines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own magazines"
  ON magazines FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own magazines"
  ON magazines FOR DELETE USING (auth.uid() = user_id);

-- PARTS_ATTACHMENTS
CREATE POLICY "Users can view own parts"
  ON parts_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own parts"
  ON parts_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parts"
  ON parts_attachments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own parts"
  ON parts_attachments FOR DELETE USING (auth.uid() = user_id);

-- ROUND_COUNTS
CREATE POLICY "Users can view own round counts"
  ON round_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own round counts"
  ON round_counts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own round counts"
  ON round_counts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own round counts"
  ON round_counts FOR DELETE USING (auth.uid() = user_id);

-- TRUST_DOCUMENTS
CREATE POLICY "Users can view own trust documents"
  ON trust_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trust documents"
  ON trust_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trust documents"
  ON trust_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trust documents"
  ON trust_documents FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run these separately in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trust-documents', 'trust-documents', false);

-- Storage policies for item-photos:
-- CREATE POLICY "Users can upload own photos"
--   ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'item-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "Users can view own photos"
--   ON storage.objects FOR SELECT USING (
--     bucket_id = 'item-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "Users can delete own photos"
--   ON storage.objects FOR DELETE USING (
--     bucket_id = 'item-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Storage policies for trust-documents:
-- CREATE POLICY "Users can upload own documents"
--   ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'trust-documents' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "Users can view own documents"
--   ON storage.objects FOR SELECT USING (
--     bucket_id = 'trust-documents' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "Users can delete own documents"
--   ON storage.objects FOR DELETE USING (
--     bucket_id = 'trust-documents' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
