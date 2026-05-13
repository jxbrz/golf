import type { LeaderboardPlayer } from "@/lib/types";
import { getProviderLeaderboard } from "@/lib/mock-data/store";

export interface GolfDataProvider {
  getTournamentLeaderboard(providerTournamentId: string): Promise<LeaderboardPlayer[]>;
}

export class ManualProvider implements GolfDataProvider {
  async getTournamentLeaderboard(providerTournamentId: string) {
    return getProviderLeaderboard(providerTournamentId);
  }
}

export class MockProvider implements GolfDataProvider {
  async getTournamentLeaderboard(providerTournamentId: string) {
    return getProviderLeaderboard(providerTournamentId);
  }
}

export class SlashGolfProvider implements GolfDataProvider {
  async getTournamentLeaderboard(): Promise<LeaderboardPlayer[]> {
    throw new Error("SlashGolfProvider is a placeholder for future live integration.");
  }
}

export class EspnProvider implements GolfDataProvider {
  async getTournamentLeaderboard(): Promise<LeaderboardPlayer[]> {
    throw new Error("EspnProvider is a placeholder for future live integration.");
  }
}

export function getGolfDataProvider(provider: string): GolfDataProvider {
  if (provider === "manual") return new ManualProvider();
  if (provider === "slashgolf") return new SlashGolfProvider();
  if (provider === "espn") return new EspnProvider();
  return new MockProvider();
}
