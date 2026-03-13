import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Nav } from './Nav'

const mockNavigate = vi.fn()
const mockSignOut = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: '1', name: 'Alice', email: 'alice@example.com' },
        session: { id: 'session-1' },
      },
      isPending: false,
    }),
    signOut: mockSignOut,
  },
}))

describe('Nav', () => {
  it('renders navigation links', () => {
    render(<Nav />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('shows the signed-in user name', () => {
    render(<Nav />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('signs out and navigates to /sign-in on button click', async () => {
    render(<Nav />)
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/sign-in' })
  })
})
