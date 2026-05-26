import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export default function OrganisationRequestThanksPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-6 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to homepage
        </Link>

        <section className="mt-6 rounded-lg border border-border bg-white p-6 scorecard-shadow sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
            <CheckCircle2 size={27} />
          </span>
          <p className="sport-label mt-5">Request received</p>
          <h1 className="mt-2 text-4xl font-bold">We will review your organisation.</h1>
          <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
            Thanks for telling us about your group. We will review the details and prepare the
            right Major Picks league setup for your next major week.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-[#f8fafc] p-4">
            <p className="flex items-center gap-2 text-sm font-black uppercase text-primary">
              <Mail size={16} />
              What happens next
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Once approved, your organisation will have a private league, organiser controls and
              invite links ready for your players.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
