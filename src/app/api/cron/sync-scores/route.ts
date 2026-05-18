import { NextResponse } from "next/server";
import { getActiveTournament, syncProviderLeaderboard } from "@/lib/mock-data/store";

export async function GET() {
  const tournament = getActiveTournament();
  const result = await syncProviderLeaderboard(
    tournament.id,
    process.env.GOLF_DATA_PROVIDER ?? "mock",
  );

  return NextResponse.json({
    ok: result.ok,
    tournamentId: tournament.id,
    message: result.message,
  });
}
