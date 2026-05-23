import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Flag,
  Home,
  Info,
  ListChecks,
  LogOut,
  Medal,
  MoreHorizontal,
  Shield,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { MajorMark } from "@/components/theme/MajorMark";
import { requireCurrentUser } from "@/lib/auth";
import { getEntry } from "@/lib/mock-data/store";
import { majorThemes } from "@/lib/theme/major-themes";
import type { Tournament } from "@/lib/types";

type MobileNavKey = "home" | "standings" | "field" | "more" | "admin" | "team";

export async function AppShell({
  tournament,
  children,
  screenTitle,
  screenSubtitle,
  backHref,
  activeNav = "home",
  rightSlot,
}: {
  tournament: Tournament;
  children: ReactNode;
  screenTitle?: string;
  screenSubtitle?: string;
  backHref?: string;
  activeNav?: MobileNavKey;
  rightSlot?: ReactNode;
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
  const stageLabel = tournament.status.replaceAll("_", " ");
  const desktopNavItems =
    user.role !== "admin" && finalReadOnly
      ? [
          { href: `/tournaments/${tournament.id}/results`, label: "Results", icon: Medal, key: "standings" as const },
          { href: `/tournaments/${tournament.id}/players`, label: "Field Results", icon: Users, key: "field" as const },
        ]
      : user.role !== "admin" && prePlay
        ? [
            { href: "/", label: "Home", icon: Home, key: "home" as const },
            { href: `/tournaments/${tournament.id}/pick`, label: entry?.submittedAt ? "Team" : "Pick Team", icon: ListChecks, key: "team" as const },
            { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel, icon: Users, key: "field" as const },
          ]
        : user.role !== "admin"
          ? [
              { href: "/", label: "Home", icon: Home, key: "home" as const },
              { href: `/tournaments/${tournament.id}/pick`, label: "Team", icon: ListChecks, key: "team" as const },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy, key: "standings" as const },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop", icon: Flag, key: "more" as const }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel, icon: Users, key: "field" as const },
            ]
          : [
              { href: "/", label: "Home", icon: Home, key: "home" as const },
              { href: `/tournaments/${tournament.id}/pick`, label: teamNavLabel, icon: ListChecks, key: "team" as const },
              { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy, key: "standings" as const },
              ...(showDropNav ? [{ href: `/tournaments/${tournament.id}/drop`, label: "Drop", icon: Flag, key: "more" as const }] : []),
              { href: `/tournaments/${tournament.id}/players`, label: fieldNavLabel, icon: Users, key: "field" as const },
              ...(showResults ? [{ href: `/tournaments/${tournament.id}/results`, label: "Results", icon: Medal, key: "standings" as const }] : []),
            ];
  const mobileNavItems =
    user.role === "admin"
      ? [
          { href: "/", label: "Home", icon: Home, key: "home" as const },
          { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy, key: "standings" as const },
          { href: `/tournaments/${tournament.id}/players`, label: "Field", icon: Users, key: "field" as const },
          { href: `/admin/tournaments/${tournament.id}`, label: "Admin", icon: Shield, key: "admin" as const },
        ]
      : [
          { href: "/", label: "Home", icon: Home, key: "home" as const },
          { href: `/tournaments/${tournament.id}/leaderboard`, label: "Standings", icon: Trophy, key: "standings" as const },
          { href: `/tournaments/${tournament.id}/players`, label: "Field", icon: Users, key: "field" as const },
          { href: `/tournaments/${tournament.id}/pick`, label: "More", icon: MoreHorizontal, key: "more" as const },
        ];

  return (
    <div className="min-h-screen w-full pb-24 lg:grid lg:grid-cols-[16rem_1fr] lg:pb-0">
      <aside className="app-sidebar hidden border-r border-white/10 text-white lg:flex lg:min-h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <MajorMark majorKey={tournament.majorKey} size="sm" />
          <span>
            <span className="app-display block text-xl font-bold leading-5">Major Picks</span>
            <span className="block text-xs font-semibold text-white/58">
              {theme.shortLabel} {tournament.year}
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`app-sidebar-link flex h-11 items-center gap-3 rounded-md px-3 text-sm font-extrabold transition ${
                  item.key === activeNav ? "bg-white/12 text-white" : ""
                }`}
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
        <header className="game-topbar sticky top-0 z-10 border-b border-white/10 px-4 pb-3 pt-4 text-white shadow-sm backdrop-blur lg:hidden">
          <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2">
            <div className="flex justify-start">
              {backHref ? (
                <Link
                  href={backHref}
                  className="flex size-10 items-center justify-center text-white"
                  aria-label="Go back"
                >
                  <ArrowLeft size={24} strokeWidth={2.2} />
                </Link>
              ) : (
                <Link href="/" aria-label="Home">
                  <MajorMark majorKey={tournament.majorKey} size="sm" />
                </Link>
              )}
            </div>
            <div className="min-w-0 text-center">
              {screenTitle ? (
                <>
                  <h1 className="app-display truncate text-xl font-bold leading-5">{screenTitle}</h1>
                  {screenSubtitle ? (
                    <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-white">
                      {screenSubtitle}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h1 className="app-display truncate text-3xl font-bold leading-8">{theme.shortLabel}</h1>
                  <p className="truncate text-xs font-black uppercase text-white">
                    {theme.label.replace(theme.shortLabel, "").trim() || stageLabel}
                  </p>
                </>
              )}
            </div>
            <div className="flex justify-end">
              {rightSlot ?? (
                <span
                  className="flex size-10 items-center justify-center rounded-full border border-white/16 bg-white/6 text-white"
                  aria-hidden="true"
                >
                  <Bell size={18} />
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[86rem] px-3 py-3 sm:px-6 lg:px-8 lg:py-7">{children}</div>
      </div>
      <nav className="game-bottom-nav fixed inset-x-0 bottom-0 z-20 border-t border-white/10 px-3 pb-3 pt-2 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-center text-[11px] font-semibold">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 ${
                activeNav === item.key ? "nav-active" : ""
              }`}
              href={item.href}
            >
              <item.icon size={18} strokeWidth={2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function HeaderInfoButton() {
  return (
    <span className="flex size-10 items-center justify-center text-white" aria-hidden="true">
      <Info size={22} strokeWidth={2.1} />
    </span>
  );
}

export function HeaderSettingsButton() {
  return (
    <span className="flex size-10 items-center justify-center text-white" aria-hidden="true">
      <Settings size={22} strokeWidth={2.1} />
    </span>
  );
}
