import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function Nav() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-zinc-900">__APP_NAME__</span>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 [&.active]:font-medium [&.active]:text-zinc-900"
            >
              Dashboard
            </Link>
            <Link
              to="/account"
              className="text-sm text-zinc-600 hover:text-zinc-900 [&.active]:font-medium [&.active]:text-zinc-900"
            >
              Account
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="hidden text-sm text-zinc-500 sm:block">{session.user.name}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}
