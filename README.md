# LiveScore Golf

Mobile-first PWA for live bachelor-trip golf scoring at **Las Vegas Paiute**.

## Stack

- **Next.js** on Vercel (UI + API routes for push/events)
- **Supabase** Postgres + **Realtime** (instant score sync across phones)
- Optional **Web Push** via VAPID keys

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. **Database → Publications**: confirm `supabase_realtime` includes `scores`, `round_events`, `players`, `teams`, `rounds` (the migration adds these)
4. **Project Settings → API**: copy URL, anon key, and service role key

### 2. Local env

```bash
cp .env.local.example .env.local
# Fill in Supabase URL, anon key, service role key
npm install
npm run dev
```

### 3. Deploy (Vercel)

Add the same env vars in Vercel. Set `NEXT_PUBLIC_APP_URL` to your production URL.

### 4. Optional push

```bash
npx web-push generate-vapid-keys
```

Add `VAPID_*` to `.env.local` and Vercel.

## Test with multiple users

- **Host:** normal browser window → Create round → Share link
- **Players:** **incognito windows** (one name each) — same browser tabs share one player identity

## Usage

1. Host creates round, shares `/r/{slug}` link
2. Players join with display names
3. Host assigns teams → **Start round**
4. Anyone posts scores — everyone sees updates via **Supabase Realtime** (no polling)
