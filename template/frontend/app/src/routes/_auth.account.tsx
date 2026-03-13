import { createRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Route as authRoute } from './_auth'
import { authClient } from '@/lib/auth-client'
import { api } from '@/lib/api'
import { Nav } from '@/components/Nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/account',
  component: AccountPage,
})

function statusColor(status: string | null | undefined) {
  if (status === 'active') return 'bg-green-100 text-green-800'
  if (status === 'cancelled') return 'bg-red-100 text-red-800'
  return 'bg-zinc-100 text-zinc-600'
}

export function AccountPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { id: string; name?: string | null; email: string; subscriptionStatus?: string | null }
    | undefined

  const portalMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/billing/portal'),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Account</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Name</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-900">{user?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Email</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-900">{user?.email ?? '—'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Status</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(user?.subscriptionStatus)}`}
                >
                  {user?.subscriptionStatus ?? 'none'}
                </span>
              </div>
              <Button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                variant="outline"
              >
                {portalMutation.isPending ? 'Redirecting…' : 'Manage Billing'}
              </Button>
              {portalMutation.isError && (
                <p className="text-sm text-red-600">{(portalMutation.error as Error).message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
