import { createRouter, RouterProvider } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as authLayoutRoute } from './routes/_auth'
import { Route as indexRoute } from './routes/_auth.index'
import { Route as accountRoute } from './routes/_auth.account'
import { Route as signInRoute } from './routes/sign-in'
import { Route as signUpRoute } from './routes/sign-up'

const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([indexRoute, accountRoute]),
  signInRoute,
  signUpRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { routeTree }

export default function App() {
  return <RouterProvider router={router} />
}
