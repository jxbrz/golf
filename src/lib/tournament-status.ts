import type { Tournament, TournamentStatus } from "@/lib/types";

const PRE_PLAY_STATUSES: TournamentStatus[] = ["draft", "picks_open", "picks_locked"];
const CUT_FINALIZED_STATUSES: TournamentStatus[] = ["drop_open", "round_3", "round_4", "final"];

export function isPrePlayStatus(status: TournamentStatus) {
  return PRE_PLAY_STATUSES.includes(status);
}

export function isCutFinalizedStatus(status: TournamentStatus) {
  return CUT_FINALIZED_STATUSES.includes(status);
}

export function isScoringStatus(status: TournamentStatus) {
  return !isPrePlayStatus(status);
}

export function tournamentStageCopy(tournament: Pick<Tournament, "status">) {
  const copy: Record<TournamentStatus, { label: string; team: string; standings: string }> = {
    draft: {
      label: "Setup",
      team: "Build and submit your team before picks lock.",
      standings: "Standings open once the tournament starts.",
    },
    picks_open: {
      label: "Picks Open",
      team: "Your team is saved. You can still review it before picks lock.",
      standings: "Standings open once round 1 scores are loaded.",
    },
    picks_locked: {
      label: "Picks Locked",
      team: "Your team is locked. Round 1 scores will appear once play starts.",
      standings: "Standings open once round 1 scores are loaded.",
    },
    round_1: {
      label: "Round 1 Loaded",
      team: "Round 1 scores are in. Follow the early standings.",
      standings: "Round 1 scores are live.",
    },
    round_2: {
      label: "Round 2 Loaded",
      team: "Round 2 scores are in. The cut has not been processed yet.",
      standings: "Round 2 scores are live. Cut status is pending.",
    },
    cut_pending: {
      label: "Cut Pending",
      team: "Round 2 is complete. Cut processing is next.",
      standings: "Round 2 scores are live. Cut status is pending.",
    },
    drop_open: {
      label: "Cut Processed",
      team: "The cut is processed. Teams with four through must drop one golfer.",
      standings: "The cut is processed and best 3 scoring is active.",
    },
    round_3: {
      label: "Round 3 Loaded",
      team: "Round 3 scores are in. Weekend standings are live.",
      standings: "Round 3 scores are live.",
    },
    round_4: {
      label: "Round 4 Loaded",
      team: "Round 4 scores are in. Final results are ready to publish.",
      standings: "Round 4 scores are live.",
    },
    final: {
      label: "Final",
      team: "Final results are published.",
      standings: "Final results are published.",
    },
  };

  return copy[tournament.status];
}
