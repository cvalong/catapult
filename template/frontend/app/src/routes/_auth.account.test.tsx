import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { AccountPage } from './_auth.account'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
          subscriptionStatus: 'active',
        },
        session: { id: 'session-1' },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AccountPage', () => {
  it('renders user name and email', () => {
    renderWithQuery(<AccountPage />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders subscription status', () => {
    renderWithQuery(<AccountPage />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders manage billing button', () => {
    renderWithQuery(<AccountPage />)
    expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument()
  })

  it('shows error when billing portal fails', async () => {
    server.use(
      http.post('http://localhost:3000/api/billing/portal', () =>
        HttpResponse.json({ error: 'No billing account found' }, { status: 400 }),
      ),
    )

    renderWithQuery(<AccountPage />)
    await userEvent.click(screen.getByRole('button', { name: /manage billing/i }))

    await waitFor(() => {
      expect(screen.getByText(/no billing account/i)).toBeInTheDocument()
    })
  })
})
