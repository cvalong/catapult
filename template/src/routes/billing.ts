import { Hono } from 'hono'
import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { stripe } from '../lib/stripe.js'
import { requireAuth } from '../lib/auth-middleware.js'
import { db } from '../db/index.js'
import { user, licenses } from '../db/schema.js'
import { generateKey } from '../lib/license.js'
import { sendEmail } from '../lib/email.js'

const billing = new Hono()

// Kit purchase — no auth required, Stripe collects the buyer's email
billing.post('/kit-checkout', async (ctx) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: process.env.STRIPE_KIT_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.BETTER_AUTH_URL}/success`,
    cancel_url: `${process.env.BETTER_AUTH_URL}/`,
  })

  return ctx.json({ url: session.url })
})

// Subscription checkout — requires auth
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

      if (session.mode === 'payment') {
        // Kit purchase — mint and deliver a license key
        const email = session.customer_details?.email
        if (email) {
          const key = generateKey()
          await db.insert(licenses).values({
            id: crypto.randomUUID(),
            key,
            email,
            createdAt: new Date(),
          })
          await sendEmail({
            to: email,
            subject: 'Your Catapult license key',
            html: `
              <p>Thanks for purchasing Catapult!</p>
              <p>Your license key is:</p>
              <p><strong>${key}</strong></p>
              <p>Run <code>npm create catapult@latest</code> and enter this key when prompted.</p>
            `,
          })
        }
        break
      }

      // Subscription purchase — update the user's subscription status
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
