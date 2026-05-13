import { NextResponse } from "next/server";
import { getActiveTournament, syncMockLeaderboard } from "@/lib/mock-data/store";

export async function GET() {
  const tournament = getActiveTournament();
  syncMockLeaderboard(tournament.id, "mock-cron");

  return NextResponse.json({
    ok: true,
    tournamentId: tournament.id,
    message: "Scores synced.",
  });
}
