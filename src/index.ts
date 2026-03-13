import { intro, outro, text, isCancel, cancel } from '@clack/prompts'
import { join } from 'node:path'
import { scaffold } from './lib/scaffold.js'
import { checkRequirements } from './lib/check-requirements.js'

async function main() {
  checkRequirements()
  intro('Catapult')

  // 1. Project name
  const rawName = await text({
    message: 'Project name',
    placeholder: 'my-app',
    defaultValue: 'my-app',
    validate(value) {
      if (!value.trim()) return 'Project name is required.'
    },
  })

  if (isCancel(rawName)) {
    cancel('Setup cancelled.')
    process.exit(0)
  }

  const appName = rawName.trim()
  const projectDir = join(process.cwd(), appName)

  // 2. Scaffold project (copies bundled template + replaces __APP_NAME__)
  await scaffold(projectDir, appName)

  // 3. Done
  outro(`Your app is ready.\n\nNext steps:\n  cd ${appName}\n  bun dev`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
