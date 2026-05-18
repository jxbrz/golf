import type {
  LeaderboardPlayer,
  ProviderLeaderboard,
  ProviderRoundScorecard,
  Tournament,
} from "@/lib/types";

export interface GolfDataProvider {
  getTournamentLeaderboard(
    tournament: Pick<Tournament, "id" | "providerTournamentId" | "year">,
    options?: { roundId?: string },
  ): Promise<ProviderLeaderboard>;
  getPlayerRoundScorecard?(
    tournament: Pick<Tournament, "providerTournamentId" | "year">,
    playerId: string,
    roundId: string,
  ): Promise<ProviderRoundScorecard | null>;
}

export class ManualProvider implements GolfDataProvider {
  async getTournamentLeaderboard() {
    return emptyProviderLeaderboard();
  }
}

export class MockProvider implements GolfDataProvider {
  async getTournamentLeaderboard() {
    return emptyProviderLeaderboard();
  }
}

export class SlashGolfProvider implements GolfDataProvider {
  async getTournamentLeaderboard(
    tournament: Pick<Tournament, "providerTournamentId" | "year">,
    options?: { roundId?: string },
  ): Promise<ProviderLeaderboard> {
    const apiKey = process.env.SLASH_GOLF_API_KEY;
    if (!apiKey) {
      throw new Error("SLASH_GOLF_API_KEY is required to sync from Slash Golf.");
    }

    const url = new URL(slashGolfLeaderboardPath(), slashGolfBaseUrl());
    if (process.env.SLASH_GOLF_ORG_ID) {
      url.searchParams.set("orgId", process.env.SLASH_GOLF_ORG_ID);
    }
    url.searchParams.set("tournId", tournament.providerTournamentId);
    url.searchParams.set("year", String(tournament.year));
    if (options?.roundId) url.searchParams.set("roundId", options.roundId);

    const response = await fetch(url, {
      headers: slashGolfHeaders(apiKey),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Slash Golf sync failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    return normalizeSlashGolfLeaderboard(payload);
  }

  async getPlayerRoundScorecard(
    tournament: Pick<Tournament, "providerTournamentId" | "year">,
    playerId: string,
    roundId: string,
  ): Promise<ProviderRoundScorecard | null> {
    const apiKey = process.env.SLASH_GOLF_API_KEY;
    if (!apiKey) {
      throw new Error("SLASH_GOLF_API_KEY is required to sync from Slash Golf.");
    }

    const url = new URL("/scorecard", slashGolfBaseUrl());
    if (process.env.SLASH_GOLF_ORG_ID) {
      url.searchParams.set("orgId", process.env.SLASH_GOLF_ORG_ID);
    }
    url.searchParams.set("tournId", tournament.providerTournamentId);
    url.searchParams.set("year", String(tournament.year));
    url.searchParams.set("playerId", playerId);
    url.searchParams.set("roundId", roundId);

    const response = await fetch(url, {
      headers: slashGolfHeaders(apiKey),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return normalizeSlashGolfScorecard(await response.json());
  }
}

export class EspnProvider implements GolfDataProvider {
  async getTournamentLeaderboard(): Promise<ProviderLeaderboard> {
    throw new Error("EspnProvider is a placeholder for future live integration.");
  }
}

function slashGolfBaseUrl() {
  return process.env.SLASH_GOLF_API_BASE_URL ?? "https://live-golf-data.p.rapidapi.com";
}

function slashGolfLeaderboardPath() {
  return process.env.SLASH_GOLF_LEADERBOARD_PATH ?? "/leaderboard";
}

function slashGolfHeaders(apiKey: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

  if (process.env.SLASH_GOLF_RAPIDAPI_HOST) {
    headers["X-RapidAPI-Key"] = apiKey;
    headers["X-RapidAPI-Host"] = process.env.SLASH_GOLF_RAPIDAPI_HOST;
  }

  return headers;
}

function emptyProviderLeaderboard(): ProviderLeaderboard {
  return {
    players: [],
    roundId: null,
    status: null,
    roundStatus: null,
    cutScore: null,
    lastUpdated: null,
  };
}

function normalizeSlashGolfLeaderboard(payload: unknown): ProviderLeaderboard {
  const rows = findLeaderboardRows(payload);
  const payloadRecord = isRecord(payload) ? payload : {};
  return {
    players: rows.map(normalizeSlashGolfRow).filter(Boolean) as LeaderboardPlayer[],
    roundId: numberValue(payloadRecord.roundId),
    status: stringValue(payloadRecord.status) || null,
    roundStatus: stringValue(payloadRecord.roundStatus) || null,
    cutScore: normalizeCutScore(payloadRecord.cutLines),
    lastUpdated: stringValue(payloadRecord.lastUpdated ?? payloadRecord.timestamp) || null,
  };
}

function normalizeSlashGolfScorecard(payload: unknown): ProviderRoundScorecard | null {
  if (!isRecord(payload)) return null;
  const roundNumber = numberValue(payload.roundId ?? payload.roundNumber ?? payload.round);
  if (![1, 2, 3, 4].includes(roundNumber ?? 0)) return null;

  return {
    roundNumber: roundNumber as 1 | 2 | 3 | 4,
    scoreToPar: scoreValue(payload.currentRoundScore ?? payload.scoreToPar ?? payload.score),
    strokes: totalStrokesFromHoles(payload.holes),
    thru: normalizeThru(payload.thru ?? payload.currentHole, payload.roundComplete),
    holeScores: normalizeHoleScores(payload.holes),
  };
}

function findLeaderboardRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }
  if (!isRecord(payload)) return [];

  const direct = [
    payload.leaderboard,
    payload.leaderboards,
    payload.leaderboardRows,
    payload.players,
    payload.results,
    payload.data,
  ];

  for (const value of direct) {
    if (Array.isArray(value)) {
      const nestedLeaderboard = value
        .filter(isRecord)
        .flatMap((item) =>
          Array.isArray(item.leaderboard) ? item.leaderboard.filter(isRecord) : [],
        );
      return nestedLeaderboard.length ? nestedLeaderboard : value.filter(isRecord);
    }
  }

  return [];
}

function normalizeSlashGolfRow(row: Record<string, unknown>): LeaderboardPlayer | null {
  const providerPlayerId = stringValue(
    row.playerId ?? row.player_id ?? row.id ?? row.pgaTourPlayerId ?? row.dgId,
  );
  const name = stringValue(
    row.playerName ??
      row.name ??
      row.displayName ??
      row.fullName ??
      row.player ??
      joinName(row.firstName, row.lastName),
  );
  if (!providerPlayerId && !name) return null;

  const statusText = stringValue(row.status ?? row.playerStatus ?? row.statusDisplay);
  const position = stringValue(row.position ?? row.pos ?? row.currentPosition ?? row.rank);
  const totalScore = scoreValue(row.totalScore ?? row.total ?? row.score ?? row.toPar);
  const todayScore = scoreValue(row.todayScore ?? row.today ?? row.currentRoundScore ?? row.roundScore);
  const round = numberValue(row.round ?? row.currentRound ?? row.roundId);
  const status = statusValue(statusText, position);

  return {
    providerPlayerId: providerPlayerId || name,
    name: name || providerPlayerId,
    position: position || null,
    totalScore,
    todayScore,
    round,
    thru: normalizeThru(row.thru ?? row.holesThru ?? row.holesThrough, row.roundComplete),
    madeCut: madeCutValue(row.madeCut ?? row.cut ?? statusText),
    status,
    lastUpdated: stringValue(row.lastUpdated ?? row.updatedAt) || new Date().toISOString(),
    rounds: normalizeRounds(row.rounds, status),
  };
}

function normalizeRounds(value: unknown, status: LeaderboardPlayer["status"]) {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter(isRecord)
    .map((round) => {
      const roundNumber = numberValue(round.roundNumber ?? round.roundId ?? round.round);
      if (![1, 2, 3, 4].includes(roundNumber ?? 0)) return null;
      return {
        roundNumber: roundNumber as 1 | 2 | 3 | 4,
        scoreToPar: scoreValue(round.scoreToPar ?? round.score ?? round.toPar),
        strokes: numberValue(round.strokes),
        thru: normalizeThru(
          round.thru ?? round.holesThru ?? round.holesThrough,
          round.roundComplete ?? round.strokes ?? round.scoreToPar,
        ),
        status,
      };
    })
    .filter(Boolean) as LeaderboardPlayer["rounds"];
}

function joinName(firstName: unknown, lastName: unknown) {
  return [stringValue(firstName), stringValue(lastName)].filter(Boolean).join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function scoreValue(value: unknown) {
  const score = stringValue(value).toUpperCase();
  if (!score || score === "-" || score === "NULL") return null;
  if (score === "E" || score === "EVEN") return 0;
  return numberValue(score.replace("+", ""));
}

function normalizeThru(value: unknown, completeSignal?: unknown) {
  const thru = stringValue(value).toUpperCase();
  if (thru.startsWith("F")) return "18";
  if (thru && thru !== "-") return thru;
  if (completeSignal === true || numberValue(completeSignal) !== null) return "18";
  return null;
}

function normalizeHoleScores(value: unknown) {
  if (!isRecord(value)) return null;
  const scores = Array.from({ length: 18 }, (_, index) => {
    const hole = value[String(index + 1)];
    if (!isRecord(hole)) return null;
    const strokes = numberValue(hole.holeScore ?? hole.score ?? hole.strokes);
    const par = numberValue(hole.par);
    return strokes === null || par === null ? null : strokes - par;
  });
  return scores.every((score) => score !== null) ? (scores as number[]) : null;
}

function totalStrokesFromHoles(value: unknown) {
  if (!isRecord(value)) return null;
  const strokes = Array.from({ length: 18 }, (_, index) => {
    const hole = value[String(index + 1)];
    return isRecord(hole) ? numberValue(hole.holeScore ?? hole.score ?? hole.strokes) : null;
  });
  return strokes.every((score) => score !== null)
    ? (strokes as number[]).reduce((total, score) => total + score, 0)
    : null;
}

function madeCutValue(value: unknown) {
  const normalized = stringValue(value).toLowerCase();
  if (!normalized) return null;
  if (["true", "1", "made_cut", "made cut", "active", "finished"].includes(normalized)) return true;
  if (["false", "0", "cut", "missed_cut", "missed cut", "wd", "dq"].includes(normalized)) return false;
  return null;
}

function normalizeCutScore(value: unknown) {
  if (!Array.isArray(value)) return null;
  const firstCut = value.filter(isRecord)[0];
  if (!firstCut) return null;
  return scoreValue(firstCut.cutScore);
}

function statusValue(status: string, position: string): LeaderboardPlayer["status"] {
  const normalized = `${status} ${position}`.toLowerCase();
  if (normalized.includes("wd") || normalized.includes("withdraw")) return "wd";
  if (normalized.includes("dq") || normalized.includes("disqual")) return "dq";
  if (normalized.includes("cut")) return "cut";
  if (normalized.includes("finish") || normalized.includes("complete")) return "finished";
  return "active";
}

export function getGolfDataProvider(provider: string): GolfDataProvider {
  if (provider === "manual") return new ManualProvider();
  if (provider === "slashgolf") return new SlashGolfProvider();
  if (provider === "espn") return new EspnProvider();
  return new MockProvider();
}
