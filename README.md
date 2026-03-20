# Catapult

Scaffold a production-ready SaaS in seconds — batteries included.

```bash
npx create-catapult@latest
```

> **Note:** This is something I wired up for others to use and plan to keep iterating on as I build my own projects with it — whenever I have time.


## What's Included

**Backend**
- [Hono](https://hono.dev) — fast, lightweight web framework
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Better Auth](https://www.better-auth.com) — authentication

**Payments**
- [Stripe](https://stripe.com) — subscriptions, one-time purchases, webhooks, and license keys

**Email**
- [Resend](https://resend.com)

**Frontend App**
- React 19 + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query)
- Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com)

**Marketing Site**
- [Astro](https://astro.build) + Tailwind CSS

**Infrastructure**
- Docker + [Bun](https://bun.sh) runtime
- Vitest + Playwright + MSW for testing

## Quickstart

### 1. Scaffold your project

```bash
npx create-catapult@latest
```

Follow the prompts to name your project. The CLI scaffolds everything and installs dependencies.

### 2. Set up your environment

```bash
cd my-app
cp .env.example .env
```

Start the local database (requires Docker):

```bash
bun run docker:up
```

This starts a PostgreSQL container on port 5432. The default `DATABASE_URL` in `.env.example` already points to it — no changes needed for local dev.

Fill in the remaining values in `.env`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Pre-filled for local Docker (`postgres://postgres:postgres@localhost:5432/app`) |
| `BETTER_AUTH_SECRET` | Any random string — `openssl rand -base64 32` works |
| `BETTER_AUTH_URL` | Your backend URL (default: `http://localhost:3000`) |
| `CORS_ORIGIN` | Your frontend URL (default: `http://localhost:5173`) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | Verified sender address in Resend |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Run `stripe listen` locally, or add an endpoint in Stripe Dashboard |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Products → your subscription price ID |
| `STRIPE_KIT_PRICE_ID` | Stripe Dashboard → Products → your one-time kit price ID (optional) |
| `TEMPLATE_DOWNLOAD_URL` | URL to a zip of your template files (e.g. a GitHub release asset) |

### 3. Run the database migration

```bash
bun run db:push
```

### 4. Start the dev server

```bash
bun run dev
```

The backend starts on `http://localhost:3000`. Start the frontend separately:

```bash
# React app
cd frontend/app && bun run dev

# Marketing site
cd frontend/marketing && bun run dev
```

### 5. Run tests

```bash
bun run test
```

## Deploy

The scaffolded app includes a `Dockerfile` for production deployments. Build and run it with:

```bash
docker build -t my-app .
docker run -p 3000:3000 --env-file .env my-app
```

Deploy to any platform that accepts a Docker image (Railway, Fly.io, Render, etc.) and set your production environment variables there.

## Project Structure

```
my-app/
├── src/
│   ├── index.ts          # Hono server entry point
│   ├── routes/
│   │   ├── billing.ts    # Stripe billing routes
│   │   └── licenses.ts   # License key routes
│   ├── lib/
│   │   ├── auth.ts       # Better Auth config
│   │   ├── stripe.ts     # Stripe client
│   │   ├── email.ts      # Resend client
│   │   └── license.ts    # License key helpers
│   └── db/
│       ├── schema.ts     # Drizzle schema
│       └── index.ts      # DB client
├── frontend/
│   ├── app/              # React 19 SPA
│   └── marketing/        # Astro marketing site
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
└── .env.example
```

## Requirements

- Node.js ≥ 18
- [Bun](https://bun.sh) (used as the runtime)
- PostgreSQL database

**Environment variables** (see `.env.example`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for auth |
| `RESEND_API_KEY` | Resend API key for email |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe price ID for subscriptions |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
