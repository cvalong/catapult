import { readdir, readFile, writeFile, rename, cp } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt',
  '.env', '.toml', '.yaml', '.yml', '.html', '.css', '.sql', '.sh', '',
])
const SKIP_DIRS = new Set(['node_modules', '.git'])

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'inherit' })
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)))
    proc.on('error', reject)
  })
}

async function walkAndReplace(dir: string, from: string, to: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const oldPath = join(dir, entry.name)
    const newName = entry.name.replaceAll(from, to)
    const newPath = join(dir, newName)
    if (oldPath !== newPath) await rename(oldPath, newPath)
    if (entry.isDirectory()) {
      await walkAndReplace(newPath, from, to)
    } else if (TEXT_EXTENSIONS.has(extname(newName))) {
      const content = await readFile(newPath, 'utf8')
      if (content.includes(from)) await writeFile(newPath, content.replaceAll(from, to), 'utf8')
    }
  }
}

const defaultTemplateDir = fileURLToPath(new URL('../template', import.meta.url))

export async function scaffold(
  projectDir: string,
  appName: string,
  templateDir = defaultTemplateDir,
): Promise<void> {
  await cp(templateDir, projectDir, { recursive: true })
  await walkAndReplace(projectDir, '__APP_NAME__', appName)
  try {
    await run('bun', ['install'], projectDir)
  } catch (err: unknown) {
    const isNotFound =
      (err as NodeJS.ErrnoException).code === 'ENOENT' ||
      String((err as Error).message).includes('ENOENT')
    if (isNotFound) {
      console.warn(
        '\n  bun not found — skipping install.\n' +
        '  Install bun at https://bun.sh, then run: bun install\n'
      )
    } else {
      throw err
    }
  }
  await run('git', ['init'], projectDir)
  await run('git', ['add', '-A'], projectDir)
  await run('git', ['commit', '-m', 'Initial commit'], projectDir)
}
