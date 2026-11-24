-- Sheyilor Photography: database schema
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Then run seed.sql to load the 2026 portrait rate card and starting content.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Studio settings (one row)
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Sheyilor Photography',
  phone text not null default '+234 816 797 6266',
  whatsapp text not null default '2348167976266',
  whatsapp_message text not null default 'Hello Sheyilor, I found you on your website and I''d like to ask about a shoot.',
  email text not null default 'sheyilorphotography@gmail.com',
  instagram text not null default 'sheyilor_',
  tiktok text not null default 'sheyilor_',
  x_handle text not null default 'its_sheyilor',
  location text not null default 'Lagos, Nigeria',
  headline text not null default 'Weddings, portraits and fashion, photographed in Lagos.',
  about_title text not null default 'I''m Sheyilor. I photograph people at their best, on the days that matter most to them.',
  about_body text not null default 'From birthdays and celebrations to fashion lookbooks and weddings, every shoot is planned around you. Portrait photos are retouched and delivered in 2 working days, straight to your own private gallery.',
  deposit_percent int not null default 70 check (deposit_percent between 1 and 100),
  express_fee int not null default 35000,
  extra_image_fee int not null default 15000,
  lateness_fee int not null default 10000,
  gallery_days int not null default 90,
  training_contact text not null default 'Fisayo · 0813 310 7318',
  hero_video_url text,                          -- short looping clip for the top of the homepage
  hero_poster_url text,                         -- still shown while the video loads
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- What clients can book
-- ---------------------------------------------------------------------------
create table if not exists session_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  rate_card_url text,
  notes text[] not null default '{}',
  terms jsonb not null default '[]',            -- [{ "title": "", "body": "" }]
  has_logistics boolean not null default false, -- outdoor / home fees apply
  has_express boolean not null default false,
  full_day boolean not null default false,      -- e.g. weddings block the whole day
  ready boolean not null default false,         -- false = rate card not loaded yet
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid not null references session_types(id) on delete cascade,
  name text not null,
  subtitle text not null default '',
  price int,                                    -- naira, null = not set yet
  per_outfit boolean not null default false,
  images_included int,
  included jsonb not null default '[]',         -- [{ "title": "", "detail": "" }]
  highlight boolean not null default false,
  active boolean not null default true,
  sort int not null default 0
);

create table if not exists logistics_fees (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid references session_types(id) on delete cascade, -- null = all types
  kind text not null check (kind in ('outdoor', 'home')),
  area text not null,
  fee int not null,
  sort int not null default 0
);

create table if not exists extras (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid references session_types(id) on delete cascade,
  name text not null,
  price int,
  unit text not null default '',
  sort int not null default 0
);

-- Questions on the booking form, editable per session type
create table if not exists form_fields (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid not null references session_types(id) on delete cascade,
  label text not null,
  field_type text not null default 'text'
    check (field_type in ('text', 'long', 'email', 'tel', 'number', 'date', 'time', 'choice')),
  role text check (role in ('name', 'email', 'phone')), -- which answer is the client's name/email/phone
  options text[] not null default '{}',
  placeholder text,
  required boolean not null default true,
  sort int not null default 0
);

-- ---------------------------------------------------------------------------
-- Portfolio and homepage
-- ---------------------------------------------------------------------------
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  cta_label text not null default 'Book a session',
  session_type_slug text,
  cover_url text,
  visible boolean not null default true,
  sort int not null default 0
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  url text not null,
  storage_key text,
  alt text not null default '',
  width int,
  height int,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists home_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero', 'featured', 'about')),
  position int not null default 0,
  image_url text not null,
  alt text not null default '',
  caption text not null default '',
  collection_slug text
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  context text not null default '',
  quote text not null,
  visible boolean not null default true,
  sort int not null default 0
);

-- ---------------------------------------------------------------------------
-- Bookings and payments
-- ---------------------------------------------------------------------------
create table if not exists blocked_dates (
  day date primary key,
  reason text not null default ''
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  session_type_id uuid not null references session_types(id),
  package_id uuid references packages(id),
  package_name text not null default '',
  outfits int not null default 1,
  location_kind text not null default 'studio' check (location_kind in ('studio', 'outdoor', 'home')),
  logistics_area text,
  express boolean not null default false,
  shoot_date date,
  shoot_time text,
  answers jsonb not null default '[]',          -- [{ "label": "", "value": "" }]
  notes text not null default '',
  client_name text not null,
  client_email text not null,
  client_phone text not null default '',
  subtotal int not null default 0,
  logistics int not null default 0,
  express_fee int not null default 0,
  total int not null default 0,
  deposit int not null default 0,
  amount_paid int not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'shot', 'delivered', 'cancelled')),
  gift_card_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists bookings_date_idx on bookings (shoot_date);
create index if not exists bookings_status_idx on bookings (status);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  kind text not null check (kind in ('deposit', 'balance', 'extra_images', 'gift_card', 'other')),
  booking_id uuid references bookings(id) on delete set null,
  gallery_id uuid,
  gift_card_id uuid,
  amount int not null,                          -- naira
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Private client galleries (Phase 2)
-- ---------------------------------------------------------------------------
create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  booking_id uuid references bookings(id) on delete set null,
  title text not null,
  subtitle text not null default '',
  client_email text not null default '',
  password_hash text not null,
  cover_url text,
  images_included int not null default 0,
  extra_image_fee int not null default 15000,
  allow_downloads boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  storage_key text not null,
  preview_key text,
  set_name text not null default '',
  width int,
  height int,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gallery_selections (
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_id uuid not null references gallery_photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, photo_id)
);

create table if not exists gallery_submissions (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_ids uuid[] not null,
  extra_count int not null default 0,
  extra_amount int not null default 0,
  status text not null default 'submitted' check (status in ('submitted', 'awaiting_payment', 'paid', 'edited')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Gift a shoot (Phase 4)
-- ---------------------------------------------------------------------------
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  amount int not null,
  balance int not null,
  buyer_name text not null,
  buyer_email text not null,
  recipient_name text not null,
  recipient_email text,
  message text not null default '',
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'used', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Reminders sent, so nothing goes out twice (Phase 4)
create table if not exists reminders_sent (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  booking_id uuid references bookings(id) on delete cascade,
  gallery_id uuid references galleries(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (kind, booking_id, gallery_id)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- Public content is readable by anyone. Bookings, payments, galleries and
-- gift cards are only reachable from the server with the service role key.
-- ---------------------------------------------------------------------------
alter table settings enable row level security;
alter table session_types enable row level security;
alter table packages enable row level security;
alter table logistics_fees enable row level security;
alter table extras enable row level security;
alter table form_fields enable row level security;
alter table collections enable row level security;
alter table photos enable row level security;
alter table home_items enable row level security;
alter table testimonials enable row level security;
alter table blocked_dates enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table galleries enable row level security;
alter table gallery_photos enable row level security;
alter table gallery_selections enable row level security;
alter table gallery_submissions enable row level security;
alter table gift_cards enable row level security;
alter table reminders_sent enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings','session_types','packages','logistics_fees','extras','form_fields','collections','photos','home_items','testimonials']
  loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;

-- Safe to re-run on an existing database
alter table settings add column if not exists hero_video_url text;
alter table settings add column if not exists hero_poster_url text;
