"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearSession,
  createSession,
  getSessionUser,
  requireAdminUser,
  requireCurrentUser,
} from "@/lib/auth";
import {
  adminUpsertDbEntryPicks,
  dropDbPlayer,
  resetDbTournamentEntries,
  submitDbEntry,
  updateDbGroupCompetitionForWeekendStep,
} from "@/lib/db-data/entries";
import {
  acceptInvite,
  approveOrganisationRequest,
  createInvite,
  createOrganisationRequest,
  rejectOrganisationRequest,
} from "@/lib/db-data/organisations";
import {
  advanceWeekendStep,
  advanceWeekendStepFromProvider,
  adminUpsertEntryPicks,
  applyOddsPricing,
  dropPlayer,
  finaliseTournament,
  importGolfersFromCsv,
  importScoresFromCsv,
  processCut,
  recalculateTournament,
  resetTournamentToNoPicks,
  submitEntry,
  syncProviderLeaderboard,
  updateGolferScore,
  updateTournamentStatus,
} from "@/lib/mock-data/store";
import type { TournamentStatus } from "@/lib/types";

const organisationRequestSchema = z.object({
  organisationName: z.string().trim().min(2),
  organisationType: z.enum(["golf_club", "society", "company", "school", "friends", "other"]),
  contactName: z.string().trim().min(2),
  email: z.string().trim().email(),
  expectedPlayers: z.coerce.number().int().min(1),
  message: z.string().trim().optional(),
});

const inviteSchema = z.object({
  organisationId: z.string().min(1),
  leagueId: z.string().min(1),
  email: z.string().trim().email(),
  role: z.enum(["admin", "player"]),
  expiresAt: z.coerce.date(),
});

export async function submitEntryAction(formData: FormData) {
  const user = await requireCurrentUser();
  const tournamentId = String(formData.get("tournamentId"));
  const pickIds = String(formData.get("pickIds"))
    .split(",")
    .filter(Boolean);
  const result =
    (await tryDb(() => submitDbEntry(tournamentId, user.id, pickIds))) ??
    submitEntry(tournamentId, user.id, pickIds);
  if (!result.ok) {
    redirect(`/tournaments/${tournamentId}/pick?error=${encodeURIComponent(result.message)}`);
  }
  revalidatePath("/app");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/team`);
  revalidatePath(`/tournaments/${tournamentId}/pick`);
  redirect(`/tournaments/${tournamentId}`);
}

export async function dropPlayerAction(formData: FormData) {
  await requireCurrentUser();
  const tournamentId = String(formData.get("tournamentId"));
  const result =
    (await tryDb(() => dropDbPlayer(String(formData.get("entryId")), String(formData.get("pickId"))))) ??
    dropPlayer(String(formData.get("entryId")), String(formData.get("pickId")));
  if (!result.ok) {
    redirect(`/tournaments/${tournamentId}/team?error=${encodeURIComponent(result.message)}#drop`);
  }
  revalidatePath("/app");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/team`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/drop`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/tournaments/${tournamentId}/team`);
}

export async function updateTournamentStatusAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  updateTournamentStatus(tournamentId, String(formData.get("status")) as TournamentStatus);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/admin");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/pick`);
  revalidatePath(`/tournaments/${tournamentId}/drop`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/admin/tournaments/${tournamentId}`);
}

export async function resetTournamentToNoPicksAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  await resetDbTournamentEntries(tournamentId);
  resetTournamentToNoPicks(tournamentId);
  revalidatePath("/app");
  revalidatePath("/admin");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/entries`);
  revalidatePath(`/admin/tournaments/${tournamentId}/scores`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/pick`);
  revalidatePath(`/tournaments/${tournamentId}/players`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/admin/tournaments/${tournamentId}?reset=no-picks`);
}

export async function processCutAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  await tryDb(() => updateDbGroupCompetitionForWeekendStep(tournamentId, "process_cut"));
  processCut(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
}

export async function recalculateAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  recalculateTournament(tournamentId, true);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
}

export async function finaliseTournamentAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  await tryDb(() => updateDbGroupCompetitionForWeekendStep(tournamentId, "final"));
  finaliseTournament(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
}

export async function updateGolferScoreAction(formData: FormData) {
  const admin = await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  updateGolferScore({
    tournamentGolferId: String(formData.get("tournamentGolferId")),
    field: String(formData.get("field")) as Parameters<typeof updateGolferScore>[0]["field"],
    value: String(formData.get("value")),
    adminUserId: admin.id,
    reason: String(formData.get("reason") || "Admin score correction"),
  });
  revalidatePath(`/admin/tournaments/${tournamentId}/scores`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
}

export async function importGolfersAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  importGolfersFromCsv(tournamentId, String(formData.get("csv")));
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

export async function importScoresAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  importScoresFromCsv(tournamentId, String(formData.get("csv")));
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/scores`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/players`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/admin/tournaments/${tournamentId}/scores?imported=1`);
}

export async function syncScoresAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  await syncProviderLeaderboard(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/players`);
  redirect(`/admin/tournaments/${tournamentId}`);
}

export async function applyOddsPricingAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  const result = await applyOddsPricing(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/entries`);
  revalidatePath(`/tournaments/${tournamentId}/pick`);
  redirect(`/admin/tournaments/${tournamentId}?odds=${result.ok ? "applied" : "error"}`);
}

export async function advanceWeekendStepAction(formData: FormData) {
  await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  const step = String(formData.get("step")) as Parameters<typeof advanceWeekendStep>[1];
  await tryDb(() => updateDbGroupCompetitionForWeekendStep(tournamentId, step));
  await advanceWeekendStepFromProvider(tournamentId, step);
  revalidatePath("/admin");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/scores`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/drop`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/admin/tournaments/${tournamentId}`);
}

export async function adminUpdateEntryPicksAction(formData: FormData) {
  const admin = await requireAdminUser();
  const tournamentId = String(formData.get("tournamentId"));
  const userId = String(formData.get("userId"));
  const reason = String(formData.get("reason") || "").trim();
  const pickIds = ["pick1", "pick2", "pick3", "pick4"]
    .map((field) => String(formData.get(field) || ""))
    .filter(Boolean);

  if (!reason) {
    redirect(`/admin/tournaments/${tournamentId}/entries?error=reason`);
  }

  const result = await adminUpsertDbEntryPicks({
    tournamentId,
    userId,
    tournamentGolferIds: pickIds,
    adminUserId: admin.id,
    reason,
  }) ?? adminUpsertEntryPicks({
    tournamentId,
    userId,
    tournamentGolferIds: pickIds,
    adminUserId: admin.id,
    reason,
  });
  if (!result.ok) {
    redirect(`/admin/tournaments/${tournamentId}/entries?error=invalid`);
  }
  revalidatePath(`/admin/tournaments/${tournamentId}/entries`);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/results`);
  redirect(`/admin/tournaments/${tournamentId}/entries`);
}

export async function requestOrganisationAccessAction(formData: FormData) {
  const parsed = organisationRequestSchema.safeParse({
    organisationName: formData.get("organisationName"),
    organisationType: formData.get("organisationType"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    expectedPlayers: formData.get("expectedPlayers"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect("/register-organisation?error=invalid");
  }

  try {
    await createOrganisationRequest({
      ...parsed.data,
      message: parsed.data.message || null,
    });
  } catch (error) {
    console.error("Unable to create organisation request.", error);
    redirect("/register-organisation?error=server");
  }

  redirect("/register-organisation/thanks");
}

export async function approveOrganisationRequestAction(formData: FormData) {
  const admin = await requireAdminUser();
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) redirect("/admin/organisation-requests?error=missing");

  const result = await approveOrganisationRequest(requestId, admin.id);
  revalidatePath("/admin");
  revalidatePath("/admin/organisation-requests");
  revalidatePath("/admin/organisations");
  if (!result.ok) redirect(`/admin/organisation-requests?error=${encodeURIComponent(result.message)}`);
  redirect(`/admin/organisations/${result.organisationId}`);
}

export async function rejectOrganisationRequestAction(formData: FormData) {
  const admin = await requireAdminUser();
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) redirect("/admin/organisation-requests?error=missing");

  const result = await rejectOrganisationRequest(requestId, admin.id);
  revalidatePath("/admin");
  revalidatePath("/admin/organisation-requests");
  if (!result.ok) redirect(`/admin/organisation-requests?error=${encodeURIComponent(result.message)}`);
  redirect("/admin/organisation-requests?reviewed=rejected");
}

export async function createInviteAction(formData: FormData) {
  const admin = await requireAdminUser();
  const parsed = inviteSchema.safeParse({
    organisationId: formData.get("organisationId"),
    leagueId: formData.get("leagueId"),
    email: formData.get("email"),
    role: formData.get("role"),
    expiresAt: formData.get("expiresAt"),
  });
  const organisationId = String(formData.get("organisationId") || "");
  if (!parsed.success) {
    redirect(`/admin/organisations/${organisationId}?inviteError=invalid`);
  }
  if (parsed.data.expiresAt <= new Date()) {
    redirect(`/admin/organisations/${organisationId}?inviteError=invalid`);
  }

  const result = await createInvite({ ...parsed.data, createdByUserId: admin.id });
  revalidatePath(`/admin/organisations/${parsed.data.organisationId}`);
  if (!result.ok || !result.invite) {
    redirect(`/admin/organisations/${parsed.data.organisationId}?inviteError=${encodeURIComponent(result.message)}`);
  }
  redirect(`/admin/organisations/${parsed.data.organisationId}?invite=${result.invite.inviteCode}`);
}

export async function acceptInviteAction(formData: FormData) {
  const inviteCode = String(formData.get("inviteCode") || "");
  if (!inviteCode) redirect("/");
  const user = await getSessionUser();
  if (!user) redirect(`/login?invite=${encodeURIComponent(inviteCode)}`);

  const result = await acceptInvite(inviteCode, user);
  if (!result.ok) {
    redirect(`/join/${encodeURIComponent(inviteCode)}?error=${encodeURIComponent(result.message)}`);
  }
  revalidatePath("/app");
  redirect("/app");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const user = await createSession(email, password);

  if (!user) redirect("/login?error=1");
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

async function tryDb<T>(operation: () => Promise<T | null>) {
  try {
    return await operation();
  } catch (error) {
    console.warn("Database operation failed. Falling back to mock store.", error);
    return null;
  }
}
