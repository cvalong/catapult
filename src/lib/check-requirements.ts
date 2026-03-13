import { execSync } from 'node:child_process'

function isInstalled(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function checkRequirements(): void {
  if (!isInstalled('bun')) {
    console.error('✖  Bun is required but not installed.')
    console.error('   Install it at https://bun.sh, then re-run this command.')
    process.exit(1)
  }
  if (!isInstalled('git')) {
    console.error('✖  Git is required but not installed.')
    console.error('   Install it at https://git-scm.com, then re-run this command.')
    process.exit(1)
  }
}
