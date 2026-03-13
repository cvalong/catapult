import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:3000/api/auth/get-session', () => {
    return HttpResponse.json(null)
  }),

  http.post('http://localhost:3000/api/auth/sign-in/email', () => {
    return HttpResponse.json({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { id: 'session-1' },
    })
  }),

  http.post('http://localhost:3000/api/auth/sign-up/email', () => {
    return HttpResponse.json({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session: { id: 'session-1' },
    })
  }),

  http.post('http://localhost:3000/api/billing/portal', () => {
    return HttpResponse.json({ url: 'https://billing.stripe.com/test' })
  }),
]
