import Link from "next/link";
import { LogOut, Shield, Trophy } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireCurrentUser } from "@/lib/auth";
import { getEntry } from "@/lib/mock-data/store";
import type { Tournament } from "@/lib/types";

export async function AppShell({
  tournament,
  children,
}: {
  tournament: Tournament;
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const entry = getEntry(tournament.id, user.id);
  const teamNavLabel = entry?.submittedAt ? "Team" : "Pick";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
            <Trophy size={21} />
          </span>
          <span>
            <span className="block text-lg font-semibold leading-5">Major Picks</span>
            <span className="block text-xs font-medium text-muted">{tournament.year} private game</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="hidden items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary sm:flex"
            >
              <Shield size={16} /> Admin
            </Link>
          ) : null}
          <span className="hidden text-sm font-bold text-muted sm:block">{user.name}</span>
          <form action={logoutAction}>
            <button
              className="flex size-10 items-center justify-center rounded-md border border-border bg-surface text-primary"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className={`mx-auto grid max-w-md ${user.role === "admin" ? "grid-cols-6" : "grid-cols-5"} gap-1 text-center text-xs font-semibold`}>
          <Link className="rounded-md px-2 py-2 text-primary" href="/">
            Home
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/pick`}>
            {teamNavLabel}
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/leaderboard`}>
            Group
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/players`}>
            Field
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/results`}>
            Results
          </Link>
          {user.role === "admin" ? (
            <Link className="rounded-md px-2 py-2 text-primary" href="/admin">
              Admin
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
