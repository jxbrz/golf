import Link from "next/link";
import { ArrowLeft, LockKeyhole, MailCheck } from "lucide-react";

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-6 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to homepage
        </Link>

        <section className="mt-6 rounded-lg border border-border bg-white p-6 scorecard-shadow sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-md bg-primary text-secondary">
            <MailCheck size={26} />
          </span>
          <p className="sport-label mt-5">Private invite</p>
          <h1 className="mt-2 text-4xl font-bold">Join a Major Picks league</h1>
          <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
            You have been invited to join a Major Picks league. Sign in with the email address your
            organiser invited, then make your picks when the league opens.
          </p>
          <p className="mt-4 inline-flex rounded-md border border-border bg-[#f8fafc] px-3 py-2 text-xs font-black uppercase text-muted">
            Invite code: <span className="ml-2 text-primary">{inviteCode}</span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="app-button h-12 px-5 text-base">
              Sign in
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-white px-5 font-black text-primary"
            >
              <LockKeyhole size={17} />
              Request a new invite
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
