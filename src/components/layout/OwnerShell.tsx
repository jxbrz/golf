import Link from "next/link";
import type { ReactNode } from "react";
import {
  Building2,
  Gauge,
  ListChecks,
  LogOut,
  RadioTower,
  Settings,
  Trophy,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requirePlatformOwner } from "@/lib/auth";

const ownerNav = [
  { href: "/owner", label: "Overview", icon: Gauge },
  { href: "/owner/organisation-requests", label: "Requests", icon: ListChecks },
  { href: "/owner/organisations", label: "Organisations", icon: Building2 },
  { href: "/owner/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/owner/users", label: "Users", icon: UsersRound },
  { href: "/owner/sync", label: "Sync", icon: RadioTower },
  { href: "/owner/settings", label: "Settings", icon: Settings },
];

export async function OwnerShell({ children }: { children: ReactNode }) {
  const user = await requirePlatformOwner();

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-primary text-white lg:flex lg:flex-col">
        <Link href="/owner" className="border-b border-white/10 px-5 py-5">
          <span className="app-display block text-xl font-bold leading-5">Major Picks</span>
          <span className="mt-1 block text-xs font-semibold uppercase text-white/58">
            Platform owner
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {ownerNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-extrabold text-white/78 transition hover:bg-white/10 hover:text-white"
              >
                <Icon size={18} strokeWidth={2.2} />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/app"
            className="mt-2 flex h-11 items-center gap-3 rounded-md border border-white/12 px-3 text-sm font-extrabold text-white/72"
          >
            View player app
          </Link>
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

      <header className="sticky top-0 z-20 border-b border-border bg-primary px-4 py-3 text-white lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/owner" className="font-black">
            Major Picks Owner
          </Link>
          <form action={logoutAction}>
            <button className="rounded-md border border-white/16 px-3 py-2 text-sm font-bold">
              Log out
            </button>
          </form>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ownerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="min-w-0 lg:pl-64">
        <main className="mx-auto w-full max-w-[86rem] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
