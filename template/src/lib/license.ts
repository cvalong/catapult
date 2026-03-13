import { randomBytes } from 'crypto'

export function generateKey(): string {
  const segment = () => randomBytes(2).toString('hex').toUpperCase()
  return `CTPLT-${segment()}-${segment()}-${segment()}-${segment()}`
}
