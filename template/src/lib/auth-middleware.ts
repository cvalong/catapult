import { createMiddleware } from 'hono/factory'
import { auth } from './auth.js'
import type { AppUser } from '../types/hono.js'

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', session.user as AppUser)
  c.set('session', session.session)
  await next()
})
