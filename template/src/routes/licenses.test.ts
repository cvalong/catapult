import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'

const mockFindFirst = mock()
const mockUpdateWhere = mock()
const mockUpdateChain = { set: mock(() => ({ where: mockUpdateWhere })) }

mock.module('../db/index', () => ({
  db: {
    query: {
      licenses: {
        findFirst: mockFindFirst,
      },
    },
    update: mock(() => mockUpdateChain),
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
    // NOTE: env mutation — clean up after to avoid bleeding into other tests
    const originalUrl = process.env.TEMPLATE_DOWNLOAD_URL
    process.env.TEMPLATE_DOWNLOAD_URL = 'https://example.com/download'
    mockFindFirst.mockResolvedValue({ key: 'CTPLT-0000-0000-0000-0000', revokedAt: null, activations: 0 })
    mockUpdateWhere.mockResolvedValue(undefined)
    const res = await app.request('/validate?key=CTPLT-0000-0000-0000-0000')
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.downloadUrl).toBeDefined()
    expect(mockUpdateChain.set).toHaveBeenCalled()
    process.env.TEMPLATE_DOWNLOAD_URL = originalUrl
  })
})
