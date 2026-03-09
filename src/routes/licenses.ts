import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { licenses } from '../db/schema.js'

const licensesRoute = new Hono()

licensesRoute.get('/validate', async (ctx) => {
  const key = ctx.req.query('key')
  if (!key) return ctx.json({ valid: false }, 400)

  const license = await db.query.licenses.findFirst({
    where: eq(licenses.key, key),
  })

  if (!license || license.revokedAt !== null) {
    return ctx.json({ valid: false })
  }

  await db
    .update(licenses)
    .set({ activations: license.activations + 1 })
    .where(eq(licenses.key, key))

  return ctx.json({
    valid: true,
    downloadUrl: process.env.TEMPLATE_DOWNLOAD_URL!,
  })
})

export default licensesRoute
