# SQA.uz — Standart and Quality Assessment Group

Corporate website + custom admin CMS. Next.js 16 (App Router), Tailwind v4, Prisma + PostgreSQL, NextAuth v5, next-intl (uz / ru / en).

## Quick start

```bash
npm install

# 1. PostgreSQL — easiest via Docker:
docker run -d --name sqa-pg -e POSTGRES_USER=sqa -e POSTGRES_PASSWORD=sqa -e POSTGRES_DB=sqa -p 5432:5432 postgres:16

# 2. Environment
cp .env.example .env   # adjust DATABASE_URL / ADMIN_* / AUTH_SECRET

# 3. Database
npx prisma migrate dev   # creates schema + runs seed automatically
# (or: npx prisma db seed)

# 4. Run
npm run dev              # http://localhost:3000  → redirects to /uz
```

Admin: `http://localhost:3000/admin` — credentials from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, seeded on first run). **Change them before deploying.**

## What's inside

- **Public site** (uz default, ru, en): home, about, certification body, laboratories, team (+detail), news (+detail), financing, schemes, accreditation scopes ×2, appeals (with copyable template), contacts. All content per the client's page plan.
- **Admin CMS**: staff / news / partners CRUD with UZ-RU-EN translation tabs, image upload, ordering, search, preview links, media library, dashboard.
- **Publishing rule** (enforced server-side): an item cannot be published until uz, ru and en translations are complete. The admin shows per-locale completeness badges.
- **Partner carousel**: two rows, opposite directions, pause on hover, seamless loop, static grid under `prefers-reduced-motion`.
- **Signature design element**: guilloche accreditation ribbon with real O'ZAK registry data (MS.0052 / SL.0162).
- **Media storage**: Vercel Blob in production for durable images; local `/public/uploads` is used only for development and isolated browser tests.
- SEO: per-locale metadata, hreflang alternates, sitemap.xml, robots.txt (admin excluded).

## Tests

```bash
npm run test:unit

# Browser tests use a dedicated local database and refuse to run against any
# other database. Create it once, then apply the schema and seed it:
createdb sqa_audit
DATABASE_URL="postgresql://sqa:sqa@127.0.0.1:5432/sqa_audit" npx prisma migrate deploy
DATABASE_URL="postgresql://sqa:sqa@127.0.0.1:5432/sqa_audit" npx prisma db seed
cp .env.e2e.example .env.e2e.local
npm run build && npm run test:e2e
```

E2E covers: homepage desktop+mobile, carousel directions, staff/news card → detail, language switcher preserving pages, admin auth redirect + login.

## Deploying

- **Vercel**: set `DATABASE_URL`, `AUTH_SECRET` (generate: `openssl rand -base64 32`), `AUTH_TRUST_HOST=true`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, and `NEXT_PUBLIC_SITE_URL=https://www.sqa.uz`. Vercel Blob is required for durable admin image uploads. Run `npx prisma migrate deploy` against production before deploying migrations; seed only when bootstrapping an empty database.
- Old certificates/team photos/partner logos are already migrated into `/public/images`.

## Website email notifications

Applications, complaints, and appeals are sent through the company's Resend
account over TLS to `info@sqa.uz`. The inbox remains hosted by Mail.ru.
Verify `sqa.uz` in Resend by adding its DKIM and sending DNS records; preserve the
existing Mail.ru MX record. Keep Resend receiving disabled for the root domain.

Set `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`,
`SMTP_FROM=SQA Group <info@sqa.uz>`, and `COMPANY_RECEIVER_EMAIL=info@sqa.uz`
in the company's Vercel project. Create a Resend API key with **Sending access**
restricted to `sqa.uz`, and store it as the **production Secret `SMTP_PASSWORD`**.
Neither the normal mailbox password nor a Mail.ru app password is needed.
See [Resend SMTP configuration](https://resend.com/docs/send-with-smtp).

Redeploy after configuring the variables. Submit a clearly labeled test through
each public form and check delivery in the company inbox. Complaints and appeals
include the completed DOCX attachment. Applications are saved in the admin inbox
before email delivery is attempted; a sending failure never discards that record.
Complaints and appeals currently rely on email delivery and report an error if
the mail server does not accept them.

## Known follow-ups

- Second laboratory: the client plan mentions two labs; only one accreditation certificate exists publicly (SL.0162). Lab #2 currently has neutral copy — update `messages/*.json` → `laboratories.lab2*` when real details arrive.
- Social links in the footer point to platform homepages — replace with SQA's real profiles.
- `director@sqa.uz` is a placeholder address from the client plan — confirm it exists.
