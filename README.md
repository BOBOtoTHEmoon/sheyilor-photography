# Sheyilor Photography

Booking and client gallery system for Sheyilor Photography, Lagos.
Next.js 16 · Supabase · Paystack · Resend · Cloudflare R2 (galleries).

## Run it on your computer

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The site works straight away with the built-in content (portrait rate card,
his photos, booking form). Online payment switches on once Supabase and Paystack keys are added.

## Connect Supabase

1. Create a project at supabase.com (one project per app).
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
3. New query > paste `supabase/seed.sql` > Run. This loads the 2026 portrait rate card, the
   booking questions, collections, homepage photos and testimonials.
4. Project Settings > API: copy the URL, anon key and service role key into `.env.local`.

## Connect Paystack

1. Add `PAYSTACK_SECRET_KEY` (start with the test key `sk_test_...`).
2. Paystack dashboard > Settings > API Keys & Webhooks > Webhook URL:
   `https://YOUR-DOMAIN/api/paystack/webhook`
3. Test card: 4084 0840 8408 4081, any future expiry, CVV 408, PIN 0000, OTP 123456.

## How a booking works

1. The client picks a session, package, outfits, location, date and time, and answers that
   session's questions (`/book`).
2. The server re-calculates the price from the database, saves the booking as
   `pending_payment` and opens Paystack for the 70% deposit.
3. Paystack confirms the payment (webhook, and again when the client returns to
   `/book/confirmed`). The booking becomes `confirmed`, the slot is taken off the calendar and
   both the client and the studio get an email. This only ever happens once per payment.

## Hero video

Save a short clip as `public/video/hero.mp4` (10 to 20 seconds, under 8 MB) and it replaces the photo
panels at the top of the homepage. Later this is set from the dashboard.

## Folders

- `app/` pages and API routes
- `components/` site pieces (header, footer, booking form, photo grid)
- `lib/` data, pricing, Paystack, email
- `lib/defaults.ts` built-in content used until Supabase is connected
- `supabase/` database schema and starting content
- `public/images/` photos from the 2026 portrait rate card
- `public/brand/` his logo, black and white versions

## Build phases

1. Public site, rates, booking with Paystack deposits, confirmation emails (done)
2. Private client galleries on R2: password, closes after 3 months, clients pick their photos,
   extra images charged at ₦15,000 each
3. Admin dashboard: bookings, calendar, galleries, booking questions, packages and rates,
   portfolio uploads, homepage editor, payments, settings
4. Gift a shoot, automatic reminders, Google-ready service pages
