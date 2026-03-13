export type AppUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
  stripeCustomerId: string | null
  subscriptionStatus: string | null
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AppUser
    session: {
      id: string
      token: string
      userId: string
      expiresAt: Date
      createdAt: Date
      updatedAt: Date
      ipAddress?: string | null
      userAgent?: string | null
    }
  }
}
