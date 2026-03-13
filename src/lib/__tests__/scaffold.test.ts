import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir as osTmpdir } from 'node:os'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

import * as cp from 'node:child_process'
import { scaffold } from '../scaffold.js'

const mockSpawn = vi.mocked(cp.spawn)

function makeSpawnResult(code = 0) {
  const e = new EventEmitter()
  process.nextTick(() => e.emit('close', code))
  return e
}

function makeSpawnError(err: Error) {
  const e = new EventEmitter()
  process.nextTick(() => e.emit('error', err))
  return e
}

let templateDir: string
let projectDir: string

beforeEach(async () => {
  templateDir = await mkdtemp(join(osTmpdir(), 'scaffold-tpl-'))
  projectDir = await mkdtemp(join(osTmpdir(), 'scaffold-out-'))
  // Remove projectDir so cp can create it fresh
  await rm(projectDir, { recursive: true })
  mockSpawn.mockImplementation(() => makeSpawnResult() as any)
})

afterEach(async () => {
  await rm(templateDir, { recursive: true, force: true })
  await rm(projectDir, { recursive: true, force: true })
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// S-1: File content replacement
// ---------------------------------------------------------------------------
describe('S-1: file content replacement', () => {
  it('replaces __APP_NAME__ in a .ts file', async () => {
    await writeFile(join(templateDir, 'index.ts'), 'export const name = "__APP_NAME__"')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'index.ts'), 'utf8')
    expect(content).toBe('export const name = "my-app"')
  })

  it('replaces all occurrences in one file', async () => {
    await writeFile(join(templateDir, 'app.ts'), '__APP_NAME__ is __APP_NAME__')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'app.ts'), 'utf8')
    expect(content).toBe('my-app is my-app')
  })

  it('replaces __APP_NAME__ in .json files', async () => {
    await writeFile(join(templateDir, 'package.json'), '{"name":"__APP_NAME__"}')
    await scaffold(projectDir, 'my-app', templateDir)
    expect(await readFile(join(projectDir, 'package.json'), 'utf8')).toBe('{"name":"my-app"}')
  })

  it('replaces __APP_NAME__ in .md files', async () => {
    await writeFile(join(templateDir, 'README.md'), '# __APP_NAME__')
    await scaffold(projectDir, 'my-app', templateDir)
    expect(await readFile(join(projectDir, 'README.md'), 'utf8')).toBe('# my-app')
  })

  it('replaces __APP_NAME__ in extension-less files', async () => {
    await writeFile(join(templateDir, 'Makefile'), '__APP_NAME__')
    await scaffold(projectDir, 'my-app', templateDir)
    expect(await readFile(join(projectDir, 'Makefile'), 'utf8')).toBe('my-app')
  })

  it('does NOT modify .png files', async () => {
    const original = 'binary\x00data'
    await writeFile(join(templateDir, 'logo.png'), original)
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'logo.png'), 'utf8')
    expect(content).toBe(original)
  })

  it('does not rewrite a file that has no placeholder', async () => {
    const original = 'no placeholder here'
    await writeFile(join(templateDir, 'clean.ts'), original)
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'clean.ts'), 'utf8')
    expect(content).toBe(original)
  })
})

// ---------------------------------------------------------------------------
// S-2: File and directory renaming
// ---------------------------------------------------------------------------
describe('S-2: file and directory renaming', () => {
  it('renames a file whose name contains __APP_NAME__', async () => {
    await writeFile(join(templateDir, '__APP_NAME__.config.ts'), 'content')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'my-app.config.ts'), 'utf8')
    expect(content).toBe('content')
  })

  it('renames a directory whose name contains __APP_NAME__', async () => {
    await mkdir(join(templateDir, '__APP_NAME__-dir'))
    await writeFile(join(templateDir, '__APP_NAME__-dir', 'file.ts'), 'hello')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'my-app-dir', 'file.ts'), 'utf8')
    expect(content).toBe('hello')
  })

  it('renames a file inside a renamed directory', async () => {
    await mkdir(join(templateDir, '__APP_NAME__-dir'))
    await writeFile(join(templateDir, '__APP_NAME__-dir', '__APP_NAME__.ts'), 'data')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'my-app-dir', 'my-app.ts'), 'utf8')
    expect(content).toBe('data')
  })

  it('replaces content inside a renamed file', async () => {
    await writeFile(join(templateDir, '__APP_NAME__.ts'), 'export default "__APP_NAME__"')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'my-app.ts'), 'utf8')
    expect(content).toBe('export default "my-app"')
  })
})

// ---------------------------------------------------------------------------
// S-3: Skip node_modules / .git
// ---------------------------------------------------------------------------
describe('S-3: skip node_modules and .git', () => {
  it('does not recurse into node_modules', async () => {
    await mkdir(join(templateDir, 'node_modules'))
    await writeFile(join(templateDir, 'node_modules', 'pkg.ts'), '__APP_NAME__')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, 'node_modules', 'pkg.ts'), 'utf8')
    expect(content).toBe('__APP_NAME__')
  })

  it('does not recurse into .git', async () => {
    await mkdir(join(templateDir, '.git'))
    await writeFile(join(templateDir, '.git', 'config'), '__APP_NAME__')
    await scaffold(projectDir, 'my-app', templateDir)
    const content = await readFile(join(projectDir, '.git', 'config'), 'utf8')
    expect(content).toBe('__APP_NAME__')
  })
})

// ---------------------------------------------------------------------------
// S-4: Subprocess calls
// ---------------------------------------------------------------------------
describe('S-4: subprocess calls', () => {
  it('calls spawn("bun", ["install"], { cwd, stdio: "inherit" })', async () => {
    await scaffold(projectDir, 'my-app', templateDir)
    expect(mockSpawn).toHaveBeenCalledWith('bun', ['install'], { cwd: projectDir, stdio: 'inherit' })
  })

  it('calls spawn("git", ["init"], { cwd, stdio: "inherit" })', async () => {
    await scaffold(projectDir, 'my-app', templateDir)
    expect(mockSpawn).toHaveBeenCalledWith('git', ['init'], { cwd: projectDir, stdio: 'inherit' })
  })

  it('calls spawn("git", ["add", "-A"], { cwd, stdio: "inherit" })', async () => {
    await scaffold(projectDir, 'my-app', templateDir)
    expect(mockSpawn).toHaveBeenCalledWith('git', ['add', '-A'], { cwd: projectDir, stdio: 'inherit' })
  })

  it('calls spawn("git", ["commit", "-m", "Initial commit"], { cwd, stdio: "inherit" })', async () => {
    await scaffold(projectDir, 'my-app', templateDir)
    expect(mockSpawn).toHaveBeenCalledWith('git', ['commit', '-m', 'Initial commit'], {
      cwd: projectDir,
      stdio: 'inherit',
    })
  })

  it('throws when spawn emits a non-ENOENT error event', async () => {
    const err = Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
    mockSpawn.mockImplementationOnce(() => makeSpawnError(err) as any)
    await expect(scaffold(projectDir, 'my-app', templateDir)).rejects.toThrow('EPERM')
  })

  it('warns and does not throw when bun install emits ENOENT', async () => {
    const err = Object.assign(new Error('spawn bun ENOENT'), { code: 'ENOENT' })
    mockSpawn.mockImplementationOnce(() => makeSpawnError(err) as any)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(scaffold(projectDir, 'my-app', templateDir)).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bun not found'))
    warnSpy.mockRestore()
  })

  it('still throws when bun install exits with non-zero code', async () => {
    mockSpawn.mockImplementationOnce(() => makeSpawnResult(1) as any)
    await expect(scaffold(projectDir, 'my-app', templateDir)).rejects.toThrow('bun exited with code 1')
  })
})

// ---------------------------------------------------------------------------
// S-5: Full integration (regression net)
// ---------------------------------------------------------------------------
describe('S-5: full integration', () => {
  it('handles mixed files, renamed subdir, node_modules untouched, 4 spawns', async () => {
    // Mixed root files in template
    await writeFile(join(templateDir, '__APP_NAME__.ts'), '__APP_NAME__ rocks')
    await writeFile(join(templateDir, 'logo.png'), 'binary')
    await writeFile(join(templateDir, 'README.md'), '# __APP_NAME__')

    // Renamed subdirectory with renamed file
    await mkdir(join(templateDir, '__APP_NAME__-core'))
    await writeFile(join(templateDir, '__APP_NAME__-core', '__APP_NAME__.util.ts'), '__APP_NAME__')

    // node_modules should be untouched
    await mkdir(join(templateDir, 'node_modules'))
    await writeFile(join(templateDir, 'node_modules', 'lib.ts'), '__APP_NAME__')

    await scaffold(projectDir, 'my-app', templateDir)

    expect(await readFile(join(projectDir, 'my-app.ts'), 'utf8')).toBe('my-app rocks')
    expect(await readFile(join(projectDir, 'README.md'), 'utf8')).toBe('# my-app')
    expect(await readFile(join(projectDir, 'my-app-core', 'my-app.util.ts'), 'utf8')).toBe('my-app')
    expect(await readFile(join(projectDir, 'node_modules', 'lib.ts'), 'utf8')).toBe('__APP_NAME__')

    expect(mockSpawn).toHaveBeenCalledTimes(4)
    expect(mockSpawn).toHaveBeenNthCalledWith(1, 'bun', ['install'], { cwd: projectDir, stdio: 'inherit' })
    expect(mockSpawn).toHaveBeenNthCalledWith(2, 'git', ['init'], { cwd: projectDir, stdio: 'inherit' })
    expect(mockSpawn).toHaveBeenNthCalledWith(3, 'git', ['add', '-A'], { cwd: projectDir, stdio: 'inherit' })
    expect(mockSpawn).toHaveBeenNthCalledWith(4, 'git', ['commit', '-m', 'Initial commit'], {
      cwd: projectDir,
      stdio: 'inherit',
    })
  })
})
