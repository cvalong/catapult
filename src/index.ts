import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { auth } from './lib/auth.js'
import billing from './routes/billing.js'

const app = new Hono()

app.use(logger())

app.on(['GET', 'POST'], '/api/auth/**', (ctx) => auth.handler(ctx.req.raw))
app.route('/api/billing', billing)

app.get('/health', (ctx) => ctx.json({ ok: true }))

export default app

Bun.serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) })
