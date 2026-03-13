import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { DashboardPage } from './_auth.index'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: '1', name: 'Alice', email: 'alice@example.com' },
        session: { id: 'session-1' },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}))

describe('DashboardPage', () => {
  it('renders welcome message with user name', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/welcome back, alice/i)).toBeInTheDocument()
  })

  it('renders the nav', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })
})
