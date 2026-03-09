import { Hono } from 'hono'
import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { stripe } from '../lib/stripe.js'
import { requireAuth } from '../lib/auth-middleware.js'
import { db } from '../db/index.js'
import { user } from '../db/schema.js'

const billing = new Hono()

billing.post('/checkout', requireAuth, async (ctx) => {
  const currentUser = ctx.get('user')

  let customerId = (currentUser as any).stripeCustomerId as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: currentUser.email,
      metadata: { userId: currentUser.id },
    })
    customerId = customer.id
    await db.update(user).set({ stripeCustomerId: customerId }).where(eq(user.id, currentUser.id))
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.BETTER_AUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.BETTER_AUTH_URL}/dashboard?checkout=cancelled`,
  })

  return ctx.json({ url: session.url })
})

billing.post('/portal', requireAuth, async (ctx) => {
  const currentUser = ctx.get('user')
  const customerId = (currentUser as any).stripeCustomerId as string | null

  if (!customerId) return ctx.json({ error: 'No billing account found' }, 400)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BETTER_AUTH_URL}/dashboard`,
  })

  return ctx.json({ url: session.url })
})

billing.post('/webhook', async (ctx) => {
  const body = await ctx.req.text()
  const sig = ctx.req.header('stripe-signature')

  if (!sig) return ctx.json({ error: 'Missing signature' }, 400)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return ctx.json({ error: 'Invalid signature' }, 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      await db
        .update(user)
        .set({ subscriptionStatus: 'active' })
        .where(eq(user.stripeCustomerId, customerId))
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await db
        .update(user)
        .set({ subscriptionStatus: sub.status })
        .where(eq(user.stripeCustomerId, sub.customer as string))
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await db
        .update(user)
        .set({ subscriptionStatus: 'cancelled' })
        .where(eq(user.stripeCustomerId, sub.customer as string))
      break
    }
  }

  return ctx.json({ received: true })
})

export default billing
