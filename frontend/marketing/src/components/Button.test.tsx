import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button', { name: 'Primary' })
    expect(button.className).toContain('bg-zinc-900')
    expect(button.className).toContain('text-white')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button', { name: 'Secondary' })
    expect(button.className).toContain('border-zinc-200')
    expect(button.className).toContain('text-zinc-700')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Click me</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
