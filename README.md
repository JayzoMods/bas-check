# BAS Check

Plain-English GST coding checks on an Australian transaction CSV. Public portfolio web app for [Jayden O'Grady](https://ogdigitaldesigns.com.au) / OG Digital Designs.

This is **not** a BAS agent, not tax advice, and it does not lodge with the ATO.

## What it does

1. Upload a CSV (or load the seeded demo).
2. A rule engine flags:
   - missing tax codes
   - GST that does not match 1/11 of an inclusive total (or 10% exclusive)
   - GST recorded on GST-free or BAS-excluded lines
   - descriptions that often sit outside GST (bank fees, wages, super) but are coded GST
   - ABN checksum failures (ABR modulus 89)
3. Check one tax invoice: ABN checksum + 1/11 GST.

Analyse runs **without a database** so `npm run dev` is enough for a recruiter. PostgreSQL + Drizzle schema is in the repo for persistence later.

## CSV columns

Required: `description`, `amount`

Optional: `date`, `tax_code` (`GST` | `GST_FREE` | `BAS_EXCLUDED` | `INPUT_TAXED`), `gst_amount`, `amount_kind` (`inclusive` default | `exclusive`), `abn`

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Load demo CSV**.

Optional Postgres:

```bash
docker compose up -d
# then apply drizzle/0000_init.sql when you wire persistence
```

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Vitest on `src/lib/gst`
- Drizzle ORM schema targeting PostgreSQL 18
- GitHub Actions: test, lint, build

## ABN method

[ABR Format of the ABN](https://abr.business.gov.au/Help/AbnFormat): subtract 1 from the first digit, weight `10,1,3,5,7,9,11,13,15,17,19`, sum modulus 89 must be 0. Worked example `51 824 753 556`.

## Not in v1

Xero OAuth, Hubdoc capture, BAS lodgement, live ABR JSON (needs a registered GUID), invoice photo OCR, Confirmation of Payee.
