# Major Picks

Major Picks is a private golf major sweepstake app built with Next.js. Players pick four golfers under a 90 point budget, follow live standings through the weekend, and make a required drop when all four picks survive the cut. Organisers get admin tools for field setup, odds-based pricing, score sync, manual corrections, and final results.

## What It Does

- Private login for organiser-created admin and player accounts
- Tournament home, pick builder, submitted team review, live standings, field leaderboard, scorecards, drop flow, and final results
- Admin dashboard for tournament state changes, score sync, CSV imports, odds pricing, score overrides, and entry corrections
- Mock data mode for rehearsal without live API usage
- Optional live golf leaderboard sync and odds pricing via provider API keys
- Drizzle schema for the planned Postgres persistence layer

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon Postgres compatible schema
- Vitest for scoring logic tests
- Vercel-ready deployment

## Getting Started

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

For local rehearsal, keep these values in `.env.local`:

```bash
GOLF_DATA_PROVIDER=mock
SCORE_SYNC_MODE=mock
SCORECARD_SYNC_ENABLED=false
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

The in-memory mock store includes these local accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@majorpicks.local` | `Admin123!` |
| Player | `player1@majorpicks.local` | `Player123!` |
| Player | `player2@majorpicks.local` | `Player123!` |

## Useful Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Build the production app |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply Drizzle migrations using `.env.local` |
| `npm run db:seed` | Seed the database using `.env.local` |

## Environment Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | For Postgres | Neon/Postgres connection string for Drizzle |
| `GOLF_DATA_PROVIDER` | Yes | Use `mock` locally unless a live provider is configured |
| `SCORE_SYNC_MODE` | Yes | Use `mock` to prevent live score API calls |
| `SCORECARD_SYNC_ENABLED` | Optional | Keep `false` unless API allowance supports per-player scorecards |
| `SLASH_GOLF_API_KEY` | Live scores only | RapidAPI key for Slash Golf / Live Golf Data |
| `SLASH_GOLF_API_BASE_URL` | Live scores only | Defaults to `https://live-golf-data.p.rapidapi.com` |
| `SLASH_GOLF_ORG_ID` | Live scores only | Provider organisation ID |
| `ODDS_DATA_PROVIDER` | Odds pricing only | Defaults to The Odds API integration |
| `ODDS_API_KEY` | Odds pricing only | API key for outright winner pricing |
| `ODDS_API_REGIONS` | Odds pricing only | Comma-separated odds regions |

See `.env.example` for the full list and provider-specific defaults.

## Product Flow

1. Admin loads the field and applies point values.
2. Players sign in and submit exactly four golfers under the 90 point cap.
3. Admin locks picks and moves the tournament through each round.
4. Live standings count the best three available scores.
5. After the cut, entries with four surviving golfers must drop one player.
6. Admin finalises results after round four.
7. Players see final standings, field results, and the lowest-round prize.

## Project Structure

```text
docs/                         Product wireframes and planning notes
drizzle/                      Generated database migration snapshots
public/images/                Static tournament imagery
src/app/                      Next.js routes and server actions
src/components/admin/         Organiser controls
src/components/leaderboard/   Team and field leaderboard UI
src/components/picks/         Pick builder and budget controls
src/db/                       Drizzle schema and seed script
src/lib/                      Auth, scoring, providers, theme, mock store
```

## Design Reference

The current low-fidelity product wireframes live in [`docs/wireframes.md`](docs/wireframes.md). They cover player, admin, responsive navigation, tournament states, and API data rules.

## Deployment

The project is linked for Vercel deployment. Standard flow:

```bash
npm run lint
npm run test
npm run build
vercel deploy
```

Use production deployment only after local checks pass and required production environment variables are configured in Vercel.
