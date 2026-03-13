import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { rateLimiter } from 'hono-rate-limiter'
import { auth } from './lib/auth.js'
import billing from './routes/billing.js'
import licenses from './routes/licenses.js'
import userRoutes from './routes/user.js'

const app = new Hono()

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }))
app.use(logger())

app.use(
  '/api/auth/**',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    keyGenerator: (c) => c.req.header('x-forwarded-for') ?? 'unknown',
  }),
)

app.use(
  '/api/billing/**',
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 30,
    keyGenerator: (c) => c.req.header('x-forwarded-for') ?? 'unknown',
  }),
)

app.on(['GET', 'POST'], '/api/auth/**', (ctx) => auth.handler(ctx.req.raw))
app.route('/api/billing', billing)
app.route('/api/licenses', licenses)
app.route('/api/user', userRoutes)

app.get('/health', (ctx) => ctx.json({ ok: true }))

app.onError((err, c) => {
  const status = 'status' in err ? (err as any).status : 500
  return c.json({ error: err.message }, status)
})

export default app

Bun.serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) })
