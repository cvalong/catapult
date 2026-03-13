import { createRoute, Outlet, redirect } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { authClient } from '@/lib/auth-client'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    return { session }
  },
  component: () => <Outlet />,
})
