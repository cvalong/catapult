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

```bash
npx create-catapult@latest
```

Follow the prompts to name your project. The CLI scaffolds everything and installs dependencies.

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
