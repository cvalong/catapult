import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'

const defaultUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  subscriptionStatus: null as string | null,
  stripeCustomerId: null as string | null,
}

const mockRequireAuth = mock(async (c: any, next: any) => {
  c.set('user', { ...defaultUser })
  await next()
})

const mockCheckoutCreate = mock()
const mockCustomersCreate = mock()
const mockPortalCreate = mock()
const mockConstructEvent = mock()

const mockDbWhere = mock()
const mockDbSet = mock(() => ({ where: mockDbWhere }))
const mockDbUpdate = mock(() => ({ set: mockDbSet }))
const mockInsertValues = mock()
const mockDbInsert = mock(() => ({ values: mockInsertValues }))

const mockSendEmail = mock()

mock.module('../lib/auth-middleware', () => ({ requireAuth: mockRequireAuth }))
mock.module('../lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: mockCheckoutCreate } },
    customers: { create: mockCustomersCreate },
    billingPortal: { sessions: { create: mockPortalCreate } },
    webhooks: { constructEvent: mockConstructEvent },
  },
}))
mock.module('../db/index', () => ({ db: { update: mockDbUpdate, insert: mockDbInsert } }))
mock.module('../lib/email', () => ({ sendEmail: mockSendEmail }))

const { default: billing } = await import('./billing')

describe('billing routes', () => {
  let app: Hono

  beforeEach(() => {
    mockRequireAuth.mockReset()
    mockRequireAuth.mockImplementation(async (c: any, next: any) => {
      c.set('user', { ...defaultUser })
      await next()
    })
    mockCheckoutCreate.mockReset()
    mockCustomersCreate.mockReset()
    mockPortalCreate.mockReset()
    mockConstructEvent.mockReset()
    mockDbUpdate.mockReset()
    mockDbSet.mockReset()
    mockDbWhere.mockReset()
    mockDbWhere.mockResolvedValue(undefined)
    mockDbSet.mockReturnValue({ where: mockDbWhere })
    mockDbUpdate.mockReturnValue({ set: mockDbSet })
    mockInsertValues.mockReset()
    mockInsertValues.mockResolvedValue(undefined)
    mockDbInsert.mockReset()
    mockDbInsert.mockReturnValue({ values: mockInsertValues })
    mockSendEmail.mockReset()

    app = new Hono()
    app.route('/', billing)
  })

  describe('POST /kit-checkout', () => {
    it('no auth required; returns { url } from Stripe', async () => {
      mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe.com/kit' })
      const res = await app.request('/kit-checkout', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ url: 'https://stripe.com/kit' })
    })
  })

  describe('POST /checkout', () => {
    it('creates new Stripe customer when stripeCustomerId is null; calls db.update to save it', async () => {
      mockCustomersCreate.mockResolvedValue({ id: 'cus_new' })
      mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe.com/sub' })

      const res = await app.request('/checkout', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(mockCustomersCreate).toHaveBeenCalled()
      expect(mockDbUpdate).toHaveBeenCalled()
      expect(mockDbSet).toHaveBeenCalledWith({ stripeCustomerId: 'cus_new' })
    })

    it('reuses existing stripeCustomerId; does NOT create a new customer', async () => {
      mockRequireAuth.mockImplementationOnce(async (c: any, next: any) => {
        c.set('user', { ...defaultUser, stripeCustomerId: 'cus_existing' })
        await next()
      })
      mockCheckoutCreate.mockResolvedValue({ url: 'https://stripe.com/sub' })

      const res = await app.request('/checkout', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(mockCustomersCreate).not.toHaveBeenCalled()
    })
  })

  describe('POST /portal', () => {
    it('returns 400 when user has no stripeCustomerId', async () => {
      const res = await app.request('/portal', { method: 'POST' })
      expect(res.status).toBe(400)
    })

    it('returns { url } from Stripe billing portal', async () => {
      mockRequireAuth.mockImplementationOnce(async (c: any, next: any) => {
        c.set('user', { ...defaultUser, stripeCustomerId: 'cus_123' })
        await next()
      })
      mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal' })

      const res = await app.request('/portal', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ url: 'https://billing.stripe.com/portal' })
    })
  })

  describe('POST /webhook', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const res = await app.request('/webhook', { method: 'POST', body: 'payload' })
      expect(res.status).toBe(400)
    })

    it('returns 400 when constructEvent throws (invalid sig)', async () => {
      mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature') })
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'bad' },
        body: 'payload',
      })
      expect(res.status).toBe(400)
    })

    it('checkout.session.completed (payment) → inserts license row + sends email', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { mode: 'payment', customer_details: { email: 'buyer@example.com' } } },
      })
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
      expect(res.status).toBe(200)
      expect(mockDbInsert).toHaveBeenCalled()
      expect(mockSendEmail).toHaveBeenCalled()
    })

    it('checkout.session.completed (subscription) → db.update sets subscriptionStatus to active', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { mode: 'subscription', customer: 'cus_123' } },
      })
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
      expect(res.status).toBe(200)
      expect(mockDbSet).toHaveBeenCalledWith({ subscriptionStatus: 'active' })
    })

    it('customer.subscription.updated → db.update sets subscriptionStatus to sub status', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_123', status: 'past_due' } },
      })
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
      expect(res.status).toBe(200)
      expect(mockDbSet).toHaveBeenCalledWith({ subscriptionStatus: 'past_due' })
    })

    it('customer.subscription.deleted → db.update sets subscriptionStatus to cancelled', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_123', status: 'cancelled' } },
      })
      const res = await app.request('/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
      expect(res.status).toBe(200)
      expect(mockDbSet).toHaveBeenCalledWith({ subscriptionStatus: 'cancelled' })
    })
  })
})
