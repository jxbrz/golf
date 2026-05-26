import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Flag,
  LockKeyhole,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";

const previewCards = [
  {
    title: "Pick builder",
    copy: "Players build a four-golfer team from a fixed points budget before the first tee shot.",
    icon: ClipboardList,
  },
  {
    title: "Live leaderboard",
    copy: "Standings update around the tournament story: cuts, drops, counting scores and final results.",
    icon: BarChart3,
  },
  {
    title: "Admin control",
    copy: "Organisers can manage fields, scores, entries and tournament status without spreadsheet surgery.",
    icon: ShieldCheck,
  },
];

const howItWorks = [
  "Create a private organisation for your club, society or group.",
  "Choose the majors you want to run and invite players into a league.",
  "Let members pick teams, then follow the standings through Sunday evening.",
];

const audiences = [
  "Golf clubs running member sweepstakes",
  "Societies with annual major weekends",
  "Company golf groups and client events",
  "Friends who want proper rules without admin drag",
];

const features = [
  "Budget-based team picks",
  "Best 3 of 4 scoring",
  "Cut and drop workflows",
  "Private invite links",
  "Organiser score controls",
  "Mobile-first player experience",
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-primary">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Major Picks home">
          <span className="major-crest flex size-10 items-center justify-center bg-primary text-secondary">
            <Flag size={20} fill="currentColor" />
          </span>
          <span>
            <span className="app-display block text-xl font-bold leading-5">Major Picks</span>
            <span className="block text-xs font-black uppercase text-muted">Private golf competitions</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-black text-primary/72 md:flex">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <Link href="/login">Sign in</Link>
        </nav>
        <Link href="/register-organisation" className="app-button min-h-10 px-3 text-sm">
          Start
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[1fr_31rem] lg:px-8 lg:pb-16 lg:pt-10">
        <div className="flex flex-col justify-center">
          <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
            Run your golf major sweepstake without spreadsheets.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-primary/72">
            Major Picks gives clubs, societies and groups a private fantasy golf platform with
            budget-based picks, live standings, cut rules, drops and organiser controls.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register-organisation" className="app-button h-12 px-5 text-base">
              Start an organisation
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/join/demo-invite"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-primary/18 bg-white px-5 text-base font-black text-primary shadow-sm"
            >
              I have an invite
              <LockKeyhole size={17} />
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Private leagues", "Major-ready rules", "Organiser tools"].map((item) => (
              <div key={item} className="border-l-2 border-secondary pl-3">
                <p className="text-sm font-black uppercase text-primary">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-primary text-white scorecard-shadow">
          <div className="relative h-60 overflow-hidden sm:h-72 lg:h-80">
            <Image
              src="/images/aronimink-clubhouse.jpg"
              alt="Golf clubhouse and course"
              fill
              priority
              sizes="(min-width: 1024px) 31rem, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/10 to-primary/80" />
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <div className="rounded-md border border-white/12 bg-white p-4 text-primary">
              <p className="sport-label">Live competition</p>
              <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
                <div>
                  <h2 className="text-2xl font-black">PGA Championship League</h2>
                  <p className="mt-1 text-sm font-semibold text-primary/68">42 players · picks lock Thursday</p>
                </div>
                <Trophy className="text-secondary" size={34} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["90", "Point budget"],
                ["4", "Golfers"],
                ["3", "Count after cut"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/12 bg-white/8 p-3">
                  <p className="metric-number text-2xl font-black text-secondary">{value}</p>
                  <p className="mt-1 text-[11px] font-black uppercase text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {previewCards.map((card) => (
            <article key={card.title} className="rounded-lg border border-border bg-surface p-5">
              <card.icon className="text-secondary" size={28} />
              <h2 className="mt-4 text-2xl font-black">{card.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-4xl font-bold">Private competitions, set up like a club draw.</h2>
          <p className="mt-4 max-w-md font-semibold leading-7 text-muted">
            The product is moving from one private game into an organisation-led platform. This
            first slice creates the public front door and the league structure underneath it.
          </p>
        </div>
        <div className="grid gap-3">
          {howItWorks.map((step, index) => (
            <div key={step} className="grid grid-cols-[3rem_1fr] gap-4 rounded-lg border border-border bg-white p-4">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary font-black text-secondary">
                {index + 1}
              </span>
              <p className="self-center text-lg font-black text-primary">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-4xl font-bold">Built for organisers who care about the rules.</h2>
            <p className="mt-4 max-w-xl font-semibold leading-7 text-white/70">
              Clubs and groups get a clean player experience, while admins keep the controls they
              need when fields, scores or cut scenarios change.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience} className="flex gap-3 rounded-md border border-white/12 bg-white/8 p-4">
                <UsersRound className="shrink-0 text-secondary" size={22} />
                <p className="font-black">{audience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold">Everything needed for a major week.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-md border border-border bg-white p-4">
              <CheckCircle2 className="shrink-0 text-accent" size={22} />
              <p className="font-black text-primary">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg bg-white p-6 scorecard-shadow sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-4xl font-bold">Bring your next major into Major Picks.</h2>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
              Start an organisation now, then invite players when your league is ready.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link href="/register-organisation" className="app-button h-12 px-5 text-base">
              Start an organisation
            </Link>
            <Link
              href="/join/demo-invite"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-white px-5 font-black text-primary"
            >
              I have an invite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
