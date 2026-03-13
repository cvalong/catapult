import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SignUpPage } from './sign-up'

const mockNavigate = vi.fn()
const mockSignUp = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
    useNavigate: () => mockNavigate,
    redirect: vi.fn(),
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: { email: mockSignUp },
    getSession: vi.fn().mockResolvedValue({ data: null }),
  },
}))

describe('SignUpPage', () => {
  it('renders the sign up form', () => {
    render(<SignUpPage />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows a link to sign in', () => {
    render(<SignUpPage />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/sign-in')
  })

  it('submits form data and navigates to /', async () => {
    render(<SignUpPage />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })
  })

  it('shows validation errors for empty fields', async () => {
    render(<SignUpPage />)
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
  })

  it('shows an error message on sign up failure', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already in use' } })
    render(<SignUpPage />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })
})
