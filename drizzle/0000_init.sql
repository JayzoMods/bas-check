-- BAS Check v1 schema. Apply with: psql $DATABASE_URL -f drizzle/0000_init.sql
-- Or: npx drizzle-kit migrate (after generate, if you prefer kit-owned files)

CREATE TABLE IF NOT EXISTS csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  filename text NOT NULL,
  row_count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS csv_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES csv_imports (id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  date text,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  tax_code text,
  gst_amount numeric(12, 2),
  amount_kind text NOT NULL,
  abn text
);

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES csv_imports (id) ON DELETE CASCADE,
  row_id uuid REFERENCES csv_rows (id) ON DELETE SET NULL,
  code text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL
);
