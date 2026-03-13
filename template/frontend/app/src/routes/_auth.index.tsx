import { createRoute } from '@tanstack/react-router'
import { Route as authRoute } from './_auth'
import { authClient } from '@/lib/auth-client'
import { Nav } from '@/components/Nav'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  component: DashboardPage,
})

export function DashboardPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="mt-2 text-zinc-500">
            This is your dashboard. Build your product here.
          </p>
        </div>
      </main>
    </div>
  )
}
