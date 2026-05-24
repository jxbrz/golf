"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, requireAdminUser, requireCurrentUser } from "@/lib/auth";
import {
  adminUpsertDbEntryPicks,
  resetDbTournamentEntries,
} from "@/lib/db-data/entries";
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

export async function submitEntryAction(formData: FormData) {
  const user = await requireCurrentUser();
  const tournamentId = String(formData.get("tournamentId"));
  const pickIds = String(formData.get("pickIds"))
    .split(",")
    .filter(Boolean);
  const mockResult = submitEntry(tournamentId, user.id, pickIds);
  if (!mockResult.ok) {
    redirect(`/tournaments/${tournamentId}/pick?error=${encodeURIComponent(mockResult.message)}`);
  }
  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
  revalidatePath(`/tournaments/${tournamentId}/team`);
  revalidatePath(`/tournaments/${tournamentId}/pick`);
  redirect(`/tournaments/${tournamentId}`);
}

export async function dropPlayerAction(formData: FormData) {
  await requireCurrentUser();
  const tournamentId = String(formData.get("tournamentId"));
  dropPlayer(String(formData.get("entryId")), String(formData.get("pickId")));
  revalidatePath("/");
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
  revalidatePath("/");
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
  await advanceWeekendStepFromProvider(
    tournamentId,
    String(formData.get("step")) as Parameters<typeof advanceWeekendStep>[1],
  );
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

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const user = await createSession(email, password);

  if (!user) redirect("/login?error=1");
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
