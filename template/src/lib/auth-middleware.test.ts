import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockGetSession = vi.fn()
vi.mock('./auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))

// Import after mock is set up
const { requireAuth } = await import('./auth-middleware')

describe('requireAuth middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.use('/*', requireAuth)
    app.get('/', (c) => c.json({ ok: true }))
    mockGetSession.mockReset()
  })

  it('returns 401 when getSession returns null', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await app.request('/')
    expect(res.status).toBe(401)
  })

  it('calls next and sets user + session on context when session is valid', async () => {
    const mockUser = { id: '1', name: 'Test', email: 'test@test.com' }
    const mockSession = { id: 's1', userId: '1' }
    mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession })

    app.get('/', (c) => {
      return c.json({ user: c.get('user'), session: c.get('session') })
    })

    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toMatchObject(mockUser)
    expect(body.session).toMatchObject(mockSession)
  })
})
