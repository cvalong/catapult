import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('node:child_process', () => ({ execSync: vi.fn() }))

import * as cp from 'node:child_process'
import { checkRequirements } from '../check-requirements.js'

const mockExecSync = vi.mocked(cp.execSync)

beforeEach(() => {
  mockExecSync.mockImplementation(() => Buffer.from(''))
})

afterEach(() => {
  vi.clearAllMocks()
})

function makeExitSpy() {
  return vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit')
  }) as unknown as ReturnType<typeof vi.spyOn>
}

// ---------------------------------------------------------------------------
// C-1: exits with code 1 when bun is not installed
// ---------------------------------------------------------------------------
describe('C-1: exits with code 1 when bun is not installed', () => {
  it('calls process.exit(1) when bun is missing', () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if ((cmd as string).includes('bun')) throw new Error('not found')
      return Buffer.from('')
    })
    const exitSpy = makeExitSpy()
    expect(() => checkRequirements()).toThrow('process.exit')
    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// C-2: prints bun install URL when bun is missing
// ---------------------------------------------------------------------------
describe('C-2: prints bun install URL when bun is missing', () => {
  it('prints https://bun.sh when bun is missing', () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if ((cmd as string).includes('bun')) throw new Error('not found')
      return Buffer.from('')
    })
    const exitSpy = makeExitSpy()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => checkRequirements()).toThrow('process.exit')
    const output = errSpy.mock.calls.flat().join(' ')
    expect(output).toContain('https://bun.sh')
    exitSpy.mockRestore()
    errSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// C-3: exits with code 1 when git is not installed
// ---------------------------------------------------------------------------
describe('C-3: exits with code 1 when git is not installed', () => {
  it('calls process.exit(1) when git is missing', () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if ((cmd as string).includes('git')) throw new Error('not found')
      return Buffer.from('')
    })
    const exitSpy = makeExitSpy()
    expect(() => checkRequirements()).toThrow('process.exit')
    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// C-4: prints git install URL when git is missing
// ---------------------------------------------------------------------------
describe('C-4: prints git install URL when git is missing', () => {
  it('prints https://git-scm.com when git is missing', () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if ((cmd as string).includes('git')) throw new Error('not found')
      return Buffer.from('')
    })
    const exitSpy = makeExitSpy()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => checkRequirements()).toThrow('process.exit')
    const output = errSpy.mock.calls.flat().join(' ')
    expect(output).toContain('https://git-scm.com')
    exitSpy.mockRestore()
    errSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// C-5: does not call process.exit when both bun and git are installed
// ---------------------------------------------------------------------------
describe('C-5: does not call process.exit when both tools are installed', () => {
  it('completes without calling process.exit', () => {
    const exitSpy = makeExitSpy()
    expect(() => checkRequirements()).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
    exitSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// C-6: checks bun before git
// ---------------------------------------------------------------------------
describe('C-6: checks bun before git (bun missing → exits before git is checked)', () => {
  it('does not check git when bun is missing', () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if ((cmd as string).includes('bun')) throw new Error('not found')
      return Buffer.from('')
    })
    const exitSpy = makeExitSpy()
    expect(() => checkRequirements()).toThrow('process.exit')
    const gitChecked = mockExecSync.mock.calls.some((args) => (args[0] as string).includes('git'))
    expect(gitChecked).toBe(false)
    exitSpy.mockRestore()
  })
})
