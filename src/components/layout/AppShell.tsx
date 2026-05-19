import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { MajorMark } from "@/components/theme/MajorMark";
import { requireCurrentUser } from "@/lib/auth";
import { getEntry } from "@/lib/mock-data/store";
import { majorThemes } from "@/lib/theme/major-themes";
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
  const theme = majorThemes[tournament.majorKey];
  const showResults = tournament.status === "final";
  const finalReadOnly = showResults && user.role !== "admin";
  const prePlay = ["draft", "picks_open", "picks_locked"].includes(tournament.status);
  const fieldNavLabel = showResults ? "Field Results" : "Field";
  const showDropNav = entry?.status === "drop_required" && !finalReadOnly;
  const navItems =
    user.role !== "admin" && finalReadOnly
      ? [
          { href: `/tournaments/${tournament.id}/results`, label: "Results" },
          { href: `/tournaments/${tournament.id}/players`, label: "Field Results" },
        ]
      : user.role !== "admin" && prePlay
        ? [{ href: entry?.submittedAt ? `/tournaments/${tournament.id}/pick` : "/", label: entry?.submittedAt ? "Team" : "Welcome" }]
        : user.role !== "admin"
          ? [
              { href: `/tournaments/${tournament.id}/pick`, label: "Team" },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings" },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop" }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel },
            ]
          : [
              { href: "/", label: "Home" },
              { href: `/tournaments/${tournament.id}/pick`, label: teamNavLabel },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings" },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop" }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel },
              ...(showResults ? [{ href: `/tournaments/${tournament.id}/results`, label: "Results" }] : []),
            ];
  const mobileNavColumns =
    navItems.length + (user.role === "admin" ? 1 : 0) >= 6
      ? "grid-cols-6"
      : navItems.length + (user.role === "admin" ? 1 : 0) === 5
        ? "grid-cols-5"
        : navItems.length + (user.role === "admin" ? 1 : 0) === 4
          ? "grid-cols-4"
        : navItems.length + (user.role === "admin" ? 1 : 0) === 3
            ? "grid-cols-3"
            : navItems.length + (user.role === "admin" ? 1 : 0) === 2
              ? "grid-cols-2"
              : "grid-cols-1";

  return (
    <div className="flex min-h-screen w-full flex-col pb-8 pt-4">
      <header className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <MajorMark majorKey={tournament.majorKey} size="sm" />
          <span>
            <span className="block text-lg font-semibold leading-5">Major Picks</span>
            <span className="block text-xs font-medium text-muted">
              {theme.shortLabel} {tournament.year}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-md border border-border bg-surface p-1 sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} className="rounded px-2 py-1.5 text-sm font-bold text-primary" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
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
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className={`mx-auto grid max-w-md ${mobileNavColumns} gap-1 text-center text-xs font-semibold`}>
          {navItems.map((item) => (
            <Link key={item.href} className="rounded-md px-2 py-2 text-primary" href={item.href}>
              {item.label}
            </Link>
          ))}
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
