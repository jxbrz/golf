import Link from "next/link";
import { ArrowLeft, Building2, Mail, MessageSquareText, UserRound, UsersRound } from "lucide-react";

const organisationTypes = [
  "Golf club",
  "Society",
  "Company",
  "School",
  "Friends",
  "Other",
];

export default function RegisterOrganisationPage() {
  async function requestOrganisationAccess() {
    "use server";
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-6 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to homepage
        </Link>

        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-white scorecard-shadow">
          <div className="app-panel-header p-5 sm:p-7">
            <p className="sport-label">Request access</p>
            <h1 className="mt-2 text-4xl font-bold">Start an organisation</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
              Tell us about your club, society or group and we will help you set up a private Major
              Picks league for your next major week.
            </p>
          </div>

          <form action={requestOrganisationAccess} className="grid gap-5 p-5 sm:p-7">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-black uppercase text-muted">
                <Building2 size={16} />
                Organisation name
              </span>
              <input
                name="organisationName"
                type="text"
                placeholder="Aronimink Members League"
                required
                className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase text-muted">Organisation type</span>
              <select
                name="organisationType"
                className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a type
                </option>
                {organisationTypes.map((type) => (
                  <option key={type} value={type.toLowerCase().replaceAll(" ", "_")}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black uppercase text-muted">
                  <UserRound size={16} />
                  Your name
                </span>
                <input
                  name="name"
                  type="text"
                  placeholder="Sam Taylor"
                  required
                  className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-black uppercase text-muted">
                  <Mail size={16} />
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="sam@example.com"
                  required
                  className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
                />
              </label>
            </div>

            <label className="block">
              <span className="flex items-center gap-2 text-sm font-black uppercase text-muted">
                <UsersRound size={16} />
                Expected number of players
              </span>
              <input
                name="expectedPlayers"
                type="number"
                min="4"
                placeholder="40"
                className="mt-2 h-12 w-full rounded-md border border-border bg-white px-3 text-base font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-2 text-sm font-black uppercase text-muted">
                <MessageSquareText size={16} />
                Message or details
              </span>
              <textarea
                name="message"
                rows={5}
                placeholder="Tell us which majors you run, how your group is organised, and anything you need from the league setup."
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base font-semibold outline-none focus:border-primary"
              />
            </label>

            <button
              type="submit"
              className="h-12 rounded-md bg-primary px-4 text-base font-black text-white"
            >
              Request access
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
