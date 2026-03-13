import type { RequestHandler } from 'msw'

// Add API mock handlers here as React islands start making fetch calls.
// Example:
//   import { http, HttpResponse } from 'msw'
//   http.get('/api/user', () => HttpResponse.json({ name: 'Alice' }))

const handlers: RequestHandler[] = []

export { handlers }
