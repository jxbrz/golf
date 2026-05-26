import Link from "next/link";
import { ArrowLeft, AlertTriangle, LockKeyhole, MailCheck } from "lucide-react";
import { acceptInviteAction } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";
import { getInviteByCode } from "@/lib/db-data/organisations";
import { normalizeEmail } from "@/lib/email";

export default async function JoinInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ inviteCode: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { inviteCode } = await params;
  const { error } = await searchParams;
  const [inviteDetails, user] = await Promise.all([getInviteByCode(inviteCode), getSessionUser()]);
  const invite = inviteDetails?.invite ?? null;
  const expired = invite ? invite.status === "expired" || invite.expiresAt < new Date() : false;
  const accepted = invite?.status === "accepted";
  const invalid = !invite;
  const emailMismatch = Boolean(
    invite && user && normalizeEmail(user.email) !== normalizeEmail(invite.email),
  );
  const canAccept = Boolean(invite && user && !expired && !accepted && !emailMismatch);
  const title = invalid
    ? "This invite is not available."
    : accepted
      ? "This invite has already been accepted."
      : expired
        ? "This invite has expired."
        : "You have been invited to join a Major Picks league.";

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-6 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary/72">
          <ArrowLeft size={17} />
          Back to homepage
        </Link>

        <section className="mt-6 rounded-lg border border-border bg-white p-6 scorecard-shadow sm:p-8">
          <span className={`flex size-12 items-center justify-center rounded-md ${invalid || expired || accepted ? "bg-red-50 text-red-800" : "bg-primary text-secondary"}`}>
            {invalid || expired || accepted ? <AlertTriangle size={26} /> : <MailCheck size={26} />}
          </span>
          <p className="sport-label mt-5">Private invite</p>
          <h1 className="mt-2 text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
            {invalid
              ? "Ask your organiser for a fresh invite link."
              : expired
                ? "Ask your organiser to send a new invite for this league."
                : accepted
                  ? "You can sign in and go to your dashboard to view your leagues."
                  : `Join ${inviteDetails?.organisation?.name ?? "your organisation"}${inviteDetails?.league ? ` in ${inviteDetails.league.name}` : ""}. Sign in with ${invite.email} to accept this invite.`}
          </p>
          <p className="mt-4 inline-flex rounded-md border border-border bg-[#f8fafc] px-3 py-2 text-xs font-black uppercase text-muted">
            Invite code: <span className="ml-2 text-primary">{inviteCode}</span>
          </p>
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
              {error}
            </p>
          ) : null}
          {emailMismatch ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
              This invite was sent to {invite?.email}. Sign in with that email address to accept it.
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {canAccept ? (
              <form action={acceptInviteAction}>
                <input type="hidden" name="inviteCode" value={inviteCode} />
                <button className="app-button h-12 px-5 text-base" type="submit">
                  Accept invite
                </button>
              </form>
            ) : (
              <Link href={accepted ? "/app" : "/login"} className="app-button h-12 px-5 text-base">
                {accepted ? "Go to dashboard" : "Sign in"}
              </Link>
            )}
            <Link
              href="/register-organisation"
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
