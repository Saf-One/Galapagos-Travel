# Galápagos Voyages - Travel Booking Platform

A full-featured tourism website for selling Galápagos Islands travel packages.
Responsive and fast on desktop and mobile, with a classic, elegant visual mood.

Built with Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, Prisma,
next-intl, NextAuth, and Stripe / PayPal (offline-safe stubs for demo).

## What Was Built

- Package catalog and detail pages with gallery, promotions, and real-time availability
- Online booking with secure Stripe and PayPal checkout (webhook-driven confirmation)
- Customer accounts: itineraries, invoices, and loyalty points
- AI sales chatbot plus direct WhatsApp and WeChat contact
- Multilingual interface in English, Spanish, and Simplified Chinese with per-language SEO
- Google Analytics wired through `@next/third-parties`
- Admin panel: booking management, refunds, CSV export, package and promotion CRUD, lead view
- HubSpot lead capture and sync, plus an abandoned-booking detection hook

## Technical Architecture

- Framework: Next.js 15 App Router, React 19, TypeScript strict
- Styling: Tailwind CSS v4, elegant classic theme (serif display headings, muted
  earthy palette, generous whitespace)
- Data: Prisma ORM. SQLite for local dev and offline builds; documented Supabase
  Postgres swap for production
- Auth: NextAuth (Auth.js v5) credentials plus Prisma adapter, JWT sessions with role
- Payments: Stripe and PayPal server SDKs, webhook handlers, env-configured with fallbacks
- Internationalization and SEO: next-intl with `[locale]` routing (en, es, zh);
  per-locale metadata, hreflang, JSON-LD, sitemap, and robots
- Analytics: Google Analytics 4 via `@next/third-parties`, rendered only when configured
- Validation: zod schemas on forms and server actions
- Performance: marketing pages use Incremental Static Regeneration; images use
  `next/image`; fonts are self-hosted with `next/font` to protect Core Web Vitals

## Getting Started

```bash
# install dependencies
npm install

# set up the database (SQLite) and seed demo data
npx prisma db push
npx prisma db seed

# run the dev server
npm run dev
```

Open http://localhost:3000. The site redirects to a locale (for example /en).

Every environment variable has a fallback, so the app builds and runs offline with no
external keys. Copy `.env.example` to `.env` and fill values to enable live Stripe,
PayPal, HubSpot, and Google Analytics.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build (runs `prisma generate` then `next build`)
- `npm run start` - serve the production build
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm run prisma:push` / `prisma:seed` - database setup and demo data

## Project Layout

- `src/app/[locale]/` - localized pages (home, packages, booking, account, admin)
- `src/app/api/` - chat, lead, WhatsApp, Stripe and PayPal webhooks, admin export
- `src/lib/` - Prisma client, auth, payments, HubSpot, SEO, chatbot, config
- `prisma/` - schema and seed
- `messages/` - English, Spanish, and Simplified Chinese catalogs

## Production Readiness

This build is a complete, working demo. Before a real deployment, address these:

- Set a strong `AUTH_SECRET` via environment (the demo fallback is not for production)
- Enable verified Stripe and PayPal webhooks; payment confirmation is webhook-driven
- Replace the local SQLite file with Supabase Postgres using restricted credentials
- Add rate limiting on login and public API routes
- Serve over HTTPS and confirm secure cookie flags

See `DELIVERY.md` for deploy steps and the full caveat list.
