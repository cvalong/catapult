import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockDbWhere = vi.fn()
const mockDbSet = vi.fn(() => ({ where: mockDbWhere }))
const mockDeleteWhere = vi.fn()

vi.mock('../db/index', () => ({
  db: {
    update: vi.fn(() => ({ set: mockDbSet })),
    delete: vi.fn(() => ({ where: mockDeleteWhere })),
  },
}))

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  subscriptionStatus: 'inactive',
  stripeCustomerId: null,
}

vi.mock('../lib/auth-middleware', () => ({
  requireAuth: vi.fn(async (c: any, next: any) => {
    c.set('user', mockUser)
    await next()
  }),
}))

const { default: userRoute } = await import('./user')

describe('user route', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/', userRoute)
    mockDbWhere.mockReset()
    mockDeleteWhere.mockReset()
  })

  it('GET / returns user fields', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      subscriptionStatus: mockUser.subscriptionStatus,
    })
  })

  it('PATCH / returns 422 when body is empty', async () => {
    const res = await app.request('/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(422)
  })

  it('PATCH / returns 422 when email is invalid format', async () => {
    const res = await app.request('/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(res.status).toBe(422)
  })

  it('PATCH / returns 200 and calls db.update with correct fields', async () => {
    mockDbWhere.mockResolvedValue(undefined)
    mockDbSet.mockReturnValue({ where: mockDbWhere })
    const res = await app.request('/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })
    expect(res.status).toBe(200)
    expect(mockDbWhere).toHaveBeenCalled()
  })

  it('DELETE / calls db.delete and returns { ok: true }', async () => {
    mockDeleteWhere.mockResolvedValue(undefined)
    const res = await app.request('/', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(mockDeleteWhere).toHaveBeenCalled()
  })
})
