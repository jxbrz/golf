import Link from "next/link";
import { cookies } from "next/headers";
import { Shield, Trophy } from "lucide-react";
import { UserSelector } from "@/components/layout/UserSelector";
import { getCurrentUser, getStore } from "@/lib/mock-data/store";
import type { Tournament } from "@/lib/types";

export async function AppShell({
  tournament,
  children,
}: {
  tournament: Tournament;
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const user = getCurrentUser(cookieStore.get("mockUserId")?.value);
  const users = getStore().users;

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
          <UserSelector users={users} currentUserId={user.id} />
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-center text-xs font-semibold">
          <Link className="rounded-md px-2 py-2 text-primary" href="/">
            Home
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/pick`}>
            Pick
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href={`/tournaments/${tournament.id}/leaderboard`}>
            Scores
          </Link>
          <Link className="rounded-md px-2 py-2 text-primary" href="/admin">
            Admin
          </Link>
        </div>
      </nav>
    </div>
  );
}
