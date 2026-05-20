import Link from "next/link";
import {
  Flag,
  Home,
  ListChecks,
  LogOut,
  Medal,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
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
          { href: `/tournaments/${tournament.id}/results`, label: "Results", icon: Medal },
          { href: `/tournaments/${tournament.id}/players`, label: "Field Results", icon: Users },
        ]
      : user.role !== "admin" && prePlay
        ? [{ href: entry?.submittedAt ? `/tournaments/${tournament.id}/pick` : "/", label: entry?.submittedAt ? "Team" : "Welcome", icon: entry?.submittedAt ? ListChecks : Home }]
        : user.role !== "admin"
          ? [
              { href: `/tournaments/${tournament.id}/pick`, label: "Team", icon: ListChecks },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop", icon: Flag }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel, icon: Users },
            ]
          : [
              { href: "/", label: "Home", icon: Home },
              { href: `/tournaments/${tournament.id}/pick`, label: teamNavLabel, icon: ListChecks },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop", icon: Flag }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel, icon: Users },
              ...(showResults ? [{ href: `/tournaments/${tournament.id}/results`, label: "Results", icon: Medal }] : []),
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
    <div className="min-h-screen w-full pb-20 lg:grid lg:grid-cols-[17rem_1fr] lg:pb-0">
      <aside className="app-sidebar hidden border-r border-white/10 text-white lg:flex lg:min-h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <MajorMark majorKey={tournament.majorKey} size="sm" />
          <span>
            <span className="block text-lg font-black leading-5">Major Picks</span>
            <span className="block text-xs font-semibold text-white/58">
              {theme.shortLabel} {tournament.year}
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className="app-sidebar-link flex h-11 items-center gap-3 rounded-md px-3 text-sm font-extrabold transition"
                href={item.href}
              >
                <Icon size={18} strokeWidth={2.2} />
                {item.label}
              </Link>
            );
          })}
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="mt-2 flex h-11 items-center gap-3 rounded-md bg-white/10 px-3 text-sm font-extrabold text-white"
            >
              <Shield size={18} strokeWidth={2.2} /> Admin
            </Link>
          ) : null}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-md bg-white/8 p-3 text-white">
            <p className="text-sm font-black">{user.name}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-white/52">{user.role}</p>
          </div>
          <form action={logoutAction} className="mt-3">
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/12 text-sm font-extrabold text-white/75 transition hover:bg-white/8 hover:text-white">
              <LogOut size={16} /> Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-border bg-white/88 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <MajorMark majorKey={tournament.majorKey} size="sm" />
              <span>
                <span className="block text-base font-black leading-5">Major Picks</span>
                <span className="block text-xs font-semibold text-muted">
                  {theme.shortLabel} {tournament.year}
                </span>
              </span>
            </Link>
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

        <div className="mx-auto w-full max-w-[86rem] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className={`mx-auto grid max-w-md ${mobileNavColumns} gap-1 text-center text-xs font-semibold`}>
          {navItems.map((item) => (
            <Link key={item.href} className="flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-primary" href={item.href}>
              <item.icon size={17} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
          {user.role === "admin" ? (
            <Link className="flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-primary" href="/admin">
              <Shield size={17} />
              <span>Admin</span>
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
