import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { user } from '../db/schema.js'
import { requireAuth } from '../lib/auth-middleware.js'

const userRoute = new Hono()

userRoute.use('*', requireAuth)

userRoute.get('/', (c) => {
  const u = c.get('user')
  return c.json({
    id: u.id,
    name: u.name,
    email: u.email,
    subscriptionStatus: u.subscriptionStatus,
  })
})

const patchSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'At least one field must be provided',
  })

userRoute.patch('/', zValidator('json', patchSchema, (result, c) => {
  if (!result.success) return c.json({ errors: result.error.issues }, 422)
}), async (c) => {
  const u = c.get('user')
  const data = c.req.valid('json')
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, u.id))
  return c.json({ ok: true })
})

userRoute.delete('/', async (c) => {
  const u = c.get('user')
  await db.delete(user).where(eq(user.id, u.id))
  return c.json({ ok: true })
})

export default userRoute
