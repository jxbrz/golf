"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  dropPlayer,
  finaliseTournament,
  importGolfersFromCsv,
  processCut,
  recalculateTournament,
  submitEntry,
  syncMockLeaderboard,
  updateGolferScore,
  updateTournamentStatus,
} from "@/lib/mock-data/store";
import type { TournamentStatus } from "@/lib/types";

export async function submitEntryAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  const userId = String(formData.get("userId"));
  const pickIds = String(formData.get("pickIds"))
    .split(",")
    .filter(Boolean);
  submitEntry(tournamentId, userId, pickIds);
  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}`);
}

export async function dropPlayerAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  dropPlayer(String(formData.get("entryId")), String(formData.get("pickId")));
  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}/leaderboard`);
}

export async function updateTournamentStatusAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  updateTournamentStatus(tournamentId, String(formData.get("status")) as TournamentStatus);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function processCutAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  processCut(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function recalculateAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  recalculateTournament(tournamentId, true);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function finaliseTournamentAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  finaliseTournament(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function updateGolferScoreAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  updateGolferScore({
    tournamentGolferId: String(formData.get("tournamentGolferId")),
    field: String(formData.get("field")) as Parameters<typeof updateGolferScore>[0]["field"],
    value: String(formData.get("value")),
    adminUserId: String(formData.get("adminUserId")),
    reason: String(formData.get("reason") || "Admin score correction"),
  });
  revalidatePath(`/admin/tournaments/${tournamentId}/scores`);
  revalidatePath(`/tournaments/${tournamentId}/leaderboard`);
}

export async function importGolfersAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  importGolfersFromCsv(tournamentId, String(formData.get("csv")));
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

export async function syncScoresAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId"));
  syncMockLeaderboard(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function setMockUserAction(formData: FormData) {
  const userId = String(formData.get("userId"));
  const cookieStore = await cookies();
  cookieStore.set("mockUserId", userId, {
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/");
}
