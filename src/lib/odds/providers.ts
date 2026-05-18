import type { MajorKey, Tournament } from "@/lib/types";

export type OddsRunner = {
  name: string;
  averageDecimalOdds: number;
  bookmakerCount: number;
};

export type OddsPricingRow = {
  rank: number;
  cost: number;
  runnerName: string;
  averageDecimalOdds: number;
  bookmakerCount: number;
  matchedTournamentGolferId: string | null;
  matchedGolferName: string | null;
};

export type OddsPricingPreview = {
  provider: string;
  sportKey: string;
  rows: OddsPricingRow[];
  unmatched: OddsPricingRow[];
  matchedCount: number;
  generatedAt: string;
  error?: string;
};

export interface OddsProvider {
  getOutrightOdds(tournament: Pick<Tournament, "majorKey">): Promise<OddsRunner[]>;
  sportKeyForMajor(majorKey: MajorKey): string;
}

export class TheOddsApiProvider implements OddsProvider {
  sportKeyForMajor(majorKey: MajorKey) {
    const envKey = process.env[`ODDS_API_${majorKey.toUpperCase()}_SPORT_KEY`];
    if (envKey) return envKey;

    const defaults: Record<MajorKey, string> = {
      masters: "golf_masters_tournament_winner",
      pga: "golf_pga_championship_winner",
      us_open: "golf_us_open_winner",
      the_open: "golf_the_open_championship_winner",
    };

    return defaults[majorKey];
  }

  async getOutrightOdds(tournament: Pick<Tournament, "majorKey">) {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      throw new Error("ODDS_API_KEY is required to fetch outright odds.");
    }

    const sportKey = this.sportKeyForMajor(tournament.majorKey);
    const url = new URL(`/v4/sports/${sportKey}/odds`, "https://api.the-odds-api.com");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", process.env.ODDS_API_REGIONS ?? "uk,eu,us");
    url.searchParams.set("markets", "outrights");
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Odds sync failed: ${response.status} ${response.statusText}`);
    }

    return aggregateOutrightOdds(await response.json());
  }
}

export class MockOddsProvider implements OddsProvider {
  sportKeyForMajor(majorKey: MajorKey) {
    return `mock_${majorKey}_winner`;
  }

  async getOutrightOdds() {
    return mockMajorOdds.map((name, index) => ({
      name,
      averageDecimalOdds: Number((5 + index * 0.85).toFixed(2)),
      bookmakerCount: 4,
    }));
  }
}

export function getOddsProvider(provider = process.env.ODDS_DATA_PROVIDER ?? "the-odds-api") {
  if (provider === "mock") return new MockOddsProvider();
  return new TheOddsApiProvider();
}

export function normalizeOddsName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function aggregateOutrightOdds(payload: unknown): OddsRunner[] {
  const events = Array.isArray(payload) ? payload.filter(isRecord) : [];
  const prices = new Map<string, { name: string; prices: number[] }>();

  for (const event of events) {
    const bookmakers = Array.isArray(event.bookmakers) ? event.bookmakers.filter(isRecord) : [];
    for (const bookmaker of bookmakers) {
      const markets = Array.isArray(bookmaker.markets) ? bookmaker.markets.filter(isRecord) : [];
      const outrightMarket = markets.find((market) => String(market.key) === "outrights");
      const outcomes = Array.isArray(outrightMarket?.outcomes)
        ? outrightMarket.outcomes.filter(isRecord)
        : [];
      for (const outcome of outcomes) {
        const name = String(outcome.name ?? "").trim();
        const price = Number(outcome.price);
        if (!name || !Number.isFinite(price) || price <= 1) continue;
        const key = normalizeOddsName(name);
        const existing = prices.get(key) ?? { name, prices: [] };
        existing.prices.push(price);
        prices.set(key, existing);
      }
    }
  }

  return [...prices.values()]
    .map((runner) => ({
      name: runner.name,
      averageDecimalOdds:
        runner.prices.reduce((total, price) => total + price, 0) / runner.prices.length,
      bookmakerCount: runner.prices.length,
    }))
    .sort((a, b) => a.averageDecimalOdds - b.averageDecimalOdds || a.name.localeCompare(b.name));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const mockMajorOdds = [
  "Scottie Scheffler",
  "Rory McIlroy",
  "Cameron Young",
  "Jon Rahm",
  "Bryson DeChambeau",
  "Xander Schauffele",
  "Ludvig Aberg",
  "Matt Fitzpatrick",
  "Tommy Fleetwood",
  "Justin Thomas",
  "Collin Morikawa",
  "Justin Rose",
  "Brooks Koepka",
  "Chris Gotterup",
  "Hideki Matsuyama",
  "Tyrrell Hatton",
  "Joaquin Niemann",
  "Patrick Cantlay",
  "Ben Griffin",
  "Viktor Hovland",
  "Robert MacIntyre",
  "Russell Henley",
  "Corey Conners",
  "Sam Burns",
  "Sepp Straka",
  "Jordan Spieth",
  "Shane Lowry",
  "Patrick Reed",
  "Cameron Smith",
  "Tony Finau",
  "Daniel Berger",
  "Jason Day",
  "Max Homa",
  "Akshay Bhatia",
  "Sungjae Im",
  "Marco Penge",
  "Adam Scott",
  "Jake Knapp",
  "Si Woo Kim",
  "Minwoo Lee",
  "Maverick McNealy",
  "Gary Woodland",
  "Wyndham Clark",
  "Will Zalatoris",
  "Dustin Johnson",
  "J.J. Spaun",
  "Jacob Bridgeman",
  "Rickie Fowler",
  "Harris English",
  "Brian Harman",
  "Aaron Rai",
  "Denny McCarthy",
  "Ryan Fox",
  "Sahith Theegala",
  "Nicolai Hojgaard",
];
