import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockFindFirst = vi.fn()
const mockUpdateWhere = vi.fn()
const mockUpdateChain = { set: vi.fn(() => ({ where: mockUpdateWhere })) }

vi.mock('../db/index', () => ({
  db: {
    query: {
      licenses: {
        findFirst: mockFindFirst,
      },
    },
    update: vi.fn(() => mockUpdateChain),
  },
}))

const { default: licensesRoute } = await import('./licenses')

describe('licenses route', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/', licensesRoute)
    mockFindFirst.mockReset()
    mockUpdateChain.set.mockClear()
    mockUpdateWhere.mockClear()
  })

  it('returns 400 when key query param is missing', async () => {
    const res = await app.request('/validate')
    expect(res.status).toBe(400)
  })

  it('returns { valid: false } when license not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await app.request('/validate?key=CTPLT-0000-0000-0000-0000')
    const body = await res.json()
    expect(body.valid).toBe(false)
  })

  it('returns { valid: false } when license has revokedAt set and does not call db.update', async () => {
    mockFindFirst.mockResolvedValue({ key: 'CTPLT-0000-0000-0000-0000', revokedAt: new Date(), activations: 0 })
    const res = await app.request('/validate?key=CTPLT-0000-0000-0000-0000')
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(mockUpdateChain.set).not.toHaveBeenCalled()
  })

  it('returns { valid: true, downloadUrl } when active and calls db.update', async () => {
    mockFindFirst.mockResolvedValue({ key: 'CTPLT-0000-0000-0000-0000', revokedAt: null, activations: 0 })
    mockUpdateWhere.mockResolvedValue(undefined)
    const res = await app.request('/validate?key=CTPLT-0000-0000-0000-0000')
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.downloadUrl).toBeDefined()
    expect(mockUpdateChain.set).toHaveBeenCalled()
  })
})
