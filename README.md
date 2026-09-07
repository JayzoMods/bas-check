# BAS Check

Plain-English GST coding checks on an Australian transaction CSV. Public portfolio web app for [Jayden O'Grady](https://ogdigitaldesigns.com.au) / OG Digital Designs.

**Live demo (no login):** [https://bas-check.vercel.app](https://bas-check.vercel.app) — click **Load demo CSV**.

This is **not** a BAS agent, not tax advice, and it does not lodge with the ATO.

## What it does

1. Upload a CSV (or load the seeded demo).
2. A rule engine flags:
   - missing tax codes
   - GST that does not match 1/11 of an inclusive total (or 10% exclusive)
   - GST recorded on GST-free or BAS-excluded lines
   - descriptions that often sit outside GST (bank fees, wages, super) but are coded GST
   - ABN checksum failures (ABR modulus 89)
3. Check one tax invoice: ABN checksum + 1/11 GST. When `ABR_GUID` is set, that
   panel also calls ABR `AbnDetails` (server-side) for the entity name, ABN status,
   and GST registration date.

Analyse runs **without a database** so `npm run dev` is enough for a recruiter. When `DATABASE_URL` is set, a successful check is saved and you get a bookmarkable `/checks/[id]` URL. No accounts. Live ABR lookup is off until `ABR_GUID` is set — checksum still runs.

## CSV columns

Required: `description`, `amount`

Optional: `date`, `tax_code` (`GST` | `GST_FREE` | `BAS_EXCLUDED` | `INPUT_TAXED`), `gst_amount`, `amount_kind` (`inclusive` default | `exclusive`), `abn`

## Run locally

```bash
npm install
npm test
npm run dev
```

`npm run dev` uses Webpack on this Windows volume because Turbopack cannot junction `pg` here. Vercel/CI Linux still uses the default `next build`.

Open [http://localhost:3000](http://localhost:3000). Click **Load demo CSV**.

Optional Postgres (bookmarkable `/checks/[id]`):

```bash
docker compose up -d
npm run db:apply
# DATABASE_URL is in .env.example — copy to .env.local
```

Optional ABR live lookup (invoice panel): register for a GUID at
[ABN Lookup web services](https://abr.business.gov.au/Documentation/WebServiceRegistration),
then set `ABR_GUID` in `.env.local` and on Vercel. Never prefix it with `NEXT_PUBLIC_`.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Vitest on `src/lib/gst`
- Drizzle ORM + PostgreSQL 18 (optional; analyse works without it)
- GitHub Actions: apply schema, test (including a persist write), lint, build

## ABN method

[ABR Format of the ABN](https://abr.business.gov.au/Help/AbnFormat): subtract 1 from the first digit, weight `10,1,3,5,7,9,11,13,15,17,19`, sum modulus 89 must be 0. Worked example `51 824 753 556`.

Live lookup (optional): server GET
`https://abr.business.gov.au/json/AbnDetails.aspx` with `abn`, `callback`, and `guid`.
The body is JSONP; it is parsed, not evaluated. The GUID never goes to the browser.

## Not in v1

Xero OAuth, Hubdoc capture, BAS lodgement, invoice photo OCR, Confirmation of Payee. CSV rows stay checksum-only (no bulk ABR calls).
