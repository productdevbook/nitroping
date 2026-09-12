import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function Brand() {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="grid size-5 place-items-center rounded-md bg-foreground">
        <span className="size-2 rounded-full bg-background" />
      </span>
      NitroPing
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="flex w-[320px] flex-col items-center gap-3 text-center">
        <Brand />
        <Spinner />
        <p className="text-sm text-muted-foreground">Connecting to NitroPing securely…</p>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const returnTo = location.pathname === "/admin" ? "/admin" : "/dashboard";
  return (
    <div className="grid min-h-svh place-items-center px-6">
      <div className="flex w-[340px] flex-col gap-4">
        <Brand />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to your dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use GitHub to create or access your organization. Your projects and team
            permissions stay scoped to your account.
          </p>
        </div>
        <Button
          size="lg"
          render={
            <a href={`/auth/github/start?returnTo=${encodeURIComponent(returnTo)}`} />
          }
        >
          Continue with GitHub
        </Button>
        <p className="text-xs text-muted-foreground">
          New here? Your first sign-in starts the workspace setup.
        </p>
      </div>
    </div>
  );
}
