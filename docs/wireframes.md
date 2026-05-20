# Major Picks Wireframes

Low-fidelity product wireframes for organiser review. These sketches document layout, navigation, state changes, and operational rules. They are not final visual design specs.

## Product Promise

Major Picks is a private golf major sweepstake:

- Players sign in, pick exactly four golfers, and stay under a 90 point budget.
- Submitted teams lock immediately.
- Live standings open once tournament play begins.
- The best three available scores count.
- If all four picked golfers make the cut, the player must drop one.
- Final results include the sweepstake leaderboard, field results, and lowest-round prize.
- Admins can import fields, apply odds pricing, sync scores, correct data, and move the tournament through the weekend.

## Core States

```text
draft
  -> picks_open
  -> picks_locked
  -> round_1
  -> round_2
  -> cut_pending
  -> drop_open
  -> round_3
  -> round_4
  -> final
```

Player navigation changes by state:

| State | Player nav | Admin nav |
| --- | --- | --- |
| Before play, no entry | Welcome | Admin plus tournament tools |
| Before play, submitted | Team | Admin plus tournament tools |
| Live before cut | Team, Standings, Field | Admin plus tournament tools |
| Drop required | Team, Standings, Drop, Field | Admin plus tournament tools |
| Final | Results, Field Results | Admin, Current Standings, Results, Field Results |

## Screen Map

```text
Login
  -> Home
       -> Pick Team
       -> Submitted Team
  -> Standings
       -> Expanded Entry
       -> Drop Player
  -> Field Leaderboard
       -> Player Scorecard
  -> Final Results

Admin
  -> Tournament Control
  -> Entries
  -> Scores
  -> Import Golfers
  -> Odds Pricing
  -> Advanced Controls
```

## Layout System

Desktop uses a top header with contextual tournament navigation. Mobile uses a bottom nav with the smallest possible set of actions for the current state.

```text
Desktop
+------------------------------------------------------------------+
| Major Picks  PGA Championship  Team  Standings  Field      User  |
+------------------------------------------------------------------+
|                                                                  |
| Page content                                                     |
|                                                                  |
+------------------------------------------------------------------+

Mobile
+--------------------------------+
| Page content                   |
|                                |
+--------------------------------+
| Team | Standings | Drop | Field|
+--------------------------------+
```

Design rules:

- Keep the player experience quiet before the tournament starts.
- Hide standings until play begins.
- Show Drop only when the signed-in player has `drop_required` status.
- Preserve admin access regardless of tournament state.
- Keep critical admin actions grouped by risk: routine tasks first, recovery actions behind an advanced panel.

## Player Flow

### Login

```text
+----------------------------------------------+
| Major Picks                                  |
| Private competition                          |
|                                              |
| Email                                        |
| +------------------------------------------+ |
| Password                                     |
| +------------------------------------------+ |
|                                              |
| [ Sign in ]                                  |
+----------------------------------------------+
```

Purpose:

- Simple access gate for a private game.
- No public marketing surface.
- Accounts are organiser-provided.

### Home, No Team Submitted

```text
+--------------------------------------------------------------+
| PGA Championship                                              |
| Welcome. Select your picks.                                   |
| Pick 4 golfers under the 90 point cap.                        |
|                                                              |
| [ Select your picks ]                                         |
|                                                              |
| Venue: Aronimink Golf Club  Picks lock: Thu 14 May  Format: 4 |
+--------------------------------------------------------------+

+--------------------------------------------------------------+
| How it works                                                  |
| [1 Pick 4 golfers] [2 Stay under 90] [3 Best 3 scores count]  |
+--------------------------------------------------------------+
```

State variants:

- If picks are locked before submission, replace the call to action with "Picks are locked."
- If the player already submitted, show a saved-team confirmation and a compact team card.

### Pick Team

```text
+--------------------------------------------------------------+
| Pick your team                                                |
| Pick exactly 4 golfers under the 90 point cap.                |
+--------------------------------------+-----------------------+
| Available golfers                    | Team sheet            |
| +----------------------------------+ | Budget 0 / 90         |
| | Search golfers                   | |                       |
| +----------------------------------+ | Slot 1  --            |
|                                      | Slot 2  --            |
| [ ] Scottie Scheffler          55    | Slot 3  --            |
|     Not started - INT               | Slot 4  --            |
| [ ] Rory McIlroy              54     |                       |
|     Not started - INT               | [Submit locked team]  |
+--------------------------------------+-----------------------+
```

Rules:

- Exactly four golfers are required.
- Total cost must be 90 or less.
- Golfers without a numeric point value cannot be selected.
- Fifth picks and unaffordable picks are disabled.
- Mobile shows a floating budget bar while the team sheet is off-screen.

### Submitted Team

```text
+--------------------------------------------------------------+
| Your team is in.                                              |
| Nothing else to do yet. Standings open after round one.       |
+--------------------------------------+-----------------------+
| Team card                            | Team locked           |
| 90 points used                       | Saved team can be     |
|                                      | reviewed before play. |
| Golfer A       cost/status/score     |                       |
| Golfer B       cost/status/score     | [Review team]         |
| Golfer C       cost/status/score     | [Standings]*          |
| Golfer D       cost/status/score     |                       |
+--------------------------------------+-----------------------+
```

`Standings` appears once tournament play begins.

### Standings

```text
+--------------------------------------------------------------+
| Standings                                      [View field]   |
| Live sweepstake table. Best 3 available scores count.         |
+--------------------------------------------------------------+
| 1  Player One                                 -3       [show] |
|    Qualified                                                 |
| 2  Player Two                                 +1       [show] |
|    Drop required                                             |
+--------------------------------------------------------------+
```

Expanded entry:

```text
+--------------------------------------------------------------+
| 1  Player One                                 -3       [hide] |
| Golfer A      total/today/thru/cost       Counting           |
| Golfer B      total/today/thru/cost       Counting           |
| Golfer C      total/today/thru/cost       Counting           |
| Golfer D      total/today/thru/cost       Cut                |
+--------------------------------------------------------------+
```

### Drop Player

```text
+--------------------------------------------------------------+
| Drop one player                                               |
| Choose the one player you do not want to count.               |
+--------------------------------------------------------------+
| ( ) Golfer A       score / position / cost                    |
| ( ) Golfer B       score / position / cost                    |
| ( ) Golfer C       score / position / cost                    |
| ( ) Golfer D       score / position / cost                    |
+--------------------------------------------------------------+
| Confirm your choice                                           |
| Dropping: Golfer name                                         |
| These 3 will count: Golfer A, Golfer B, Golfer C              |
| [Confirm dropped player]                                      |
+--------------------------------------------------------------+
```

No drop needed:

```text
+--------------------------------------------------------------+
| No manual drop needed                                         |
| The standings count your best 3 available scores automatically.|
+--------------------------------------------------------------+
```

### Field Leaderboard And Scorecard

```text
+--------------------------------------------------------------+
| Field leaderboard                              [Back]         |
| Tournament leaderboard. Cut players are hidden after the cut. |
+--------------------------------------------------------------+
| Pos | Player              | Cost | Total | Today | Thru       |
| 1   | Golfer A            | 55   | -4    | -2    | 18         |
| T2  | Golfer B            | N/A  | -3    | E     | 18         |
+--------------------------------------------------------------+
```

Player scorecard:

```text
+--------------------------------------------------------------+
| Player scorecard                              [Back]          |
| Golfer name - Tournament year                                |
+--------------------------------------------------------------+
| Position | Total | Today | Cost                               |
| T8       | -2    | E     | 33                                 |
+--------------------------------------------------------------+
| Round | Score | Strokes | Thru                                |
| R1    | -2    | 68      | 18                                  |
| R2    | +2    | 72      | 18                                  |
| R3    | -     | -       | -                                   |
| R4    | -     | -       | -                                   |
+--------------------------------------------------------------+
```

Rules:

- `F` and `F*` provider values display as `18`.
- Cut players are removed from the field leaderboard after the cut.
- Cut players remain visible inside any submitted team that picked them.
- Player names link to scorecards when scorecard data exists.

### Final Results

```text
+--------------------------------------------------------------+
| Final results                                                 |
| PGA Championship 2026 - Tournament complete                   |
+--------------------------------------------------------------+
| Lowest round                                                  |
| Picked Golfer shot -5 in round 3.                             |
| Picked by Player One, Player Three.                           |
| Countback: B3, B6, B9, B18                                    |
+--------------------------------------------------------------+
| Final leaderboard                                             |
| 1  Player One                                  -8      [show] |
| 2  Player Two                                  -4      [show] |
+--------------------------------------------------------------+
```

Rules:

- Non-admin users only see Results and Field Results after finalisation.
- Admins can still access Current Standings.
- Lowest round only considers picked golfers.
- Lowest round ties use B3, B6, B9, then B18 countback.

## Admin Flow

### Admin Dashboard

```text
+--------------------------------------------------------------+
| Admin                                                        |
| Simple controls for running the competition.                  |
+-----------------------------+--------------------------------+
| Tournament card             | Tournament card                 |
| status / major / year       | status / major / year           |
| venue / next action         | venue / next action             |
+-----------------------------+--------------------------------+
| Quick tasks: Entries | Scores | Import | Odds | Final Results |
+--------------------------------------------------------------+
```

### Tournament Control

```text
+--------------------------------------------------------------+
| Admin tournament                                              |
| PGA Championship 2026 - 55 golfers loaded - picks_open        |
+--------------------------------------------------------------+
| Tournament control                                            |
| Current stage title                                           |
| Helper text                                                   |
| [Teams 12] [Scored 0] [Made cut 0]                            |
| [Lock Picks / Start Thursday / Process Cut / Finalise]        |
+--------------------------------------------------------------+
| Timeline: Tue -> Lock -> Thu -> Fri -> Cut -> Sat -> Sun -> Final |
+--------------------------------------------------------------+
| Admin tasks: Entries | Scores | Import | Odds | Advanced      |
+--------------------------------------------------------------+
```

### Odds Pricing

```text
+--------------------------------------------------------------+
| Sweepstake pricing                                            |
| Favourite = 55, 55th favourite = 1                            |
| [Preview Odds Pricing]                                        |
+--------------------------------------------------------------+
| Provider | Sport key | Matched 52/55 | Unmatched 3            |
+--------------------------------------------------------------+
| Rank | Cost | Odds runner       | Matched golfer | Odds       |
| 1    | 55   | Scottie...        | Scottie...     | 5.50       |
| 2    | 54   | Rory...           | Rory...        | 8.00       |
| 3    | 53   | Name...           | Unmatched      | 12.00      |
+--------------------------------------------------------------+
| [Apply Matched Top 55 Costs]                                  |
+--------------------------------------------------------------+
```

Rules:

- Outright winner odds drive costs.
- Top 55 runners receive costs 55 down to 1.
- Matched golfers outside the top 55 become `N/A`.
- Unmatched runners stay visible for organiser review.
- Costs should be applied before picks open or lock.
- Submitted entries preserve point value at pick time.

### Import And Score Sync

```text
+--------------------------------------------------------------+
| Import golfers                                                |
| Paste CSV: name, points, country, providerPlayerId            |
| +----------------------------------------------------------+  |
| | CSV textarea                                             |  |
| +----------------------------------------------------------+  |
| [Import CSV]                                                 |
+--------------------------------------------------------------+

+--------------------------------------------------------------+
| Score sync                                                    |
| Provider: mock or live                                        |
| Tournament ID: provider id                                    |
| Last result: success/failure message and synced timestamp     |
| [Sync scores]                                                 |
+--------------------------------------------------------------+
```

Rules:

- Mock mode makes no live provider calls.
- Live mode can sync leaderboard data.
- Scorecard sync is separately controlled to protect API allowance.
- Manual imports remain available if provider data is wrong or unavailable.

### Entries And Scores

```text
+--------------------------------------------------------------+
| Entries                                      [Back to Admin]  |
| Review and correct submitted teams.                           |
+--------------------------------------------------------------+
| Player One                                           status   |
| Pick 1 [select golfer]                                        |
| Pick 2 [select golfer]                                        |
| Pick 3 [select golfer]                                        |
| Pick 4 [select golfer]                                        |
| Reason [input]                                                |
| [Save entry changes]                                          |
+--------------------------------------------------------------+
```

```text
+--------------------------------------------------------------+
| Scores                                                       |
| Edit scores, cut status, WD/DQ, and positions.                |
+--------------------------------------------------------------+
| Manual score import                                           |
| +----------------------------------------------------------+  |
| | CSV textarea                                             |  |
| +----------------------------------------------------------+  |
| [Import scores]                                               |
+--------------------------------------------------------------+
| Golfer name                                          Cost     |
| Position / Total / Today / Status                             |
| Total [input] [Save]  Today [input] [Save]                    |
| Pos [input] [Save]    Thru [input] [Save]                     |
| Cut [input] [Save]    Status [input] [Save]                   |
+--------------------------------------------------------------+
```

Rules:

- Admin team corrections require an audit reason.
- Only numeric-cost golfers can be selected for submitted teams.
- Manual score edits should be treated as deliberate overrides.

### Advanced Controls

```text
+--------------------------------------------------------------+
| Advanced controls                                             |
| Use only for corrections or recovery.                         |
+--------------------------------------------------------------+
| Raw tournament status                                         |
| [status select] [Update]                                      |
| [Process cut] [Recalculate] [Sync scores] [Finalise]          |
+--------------------------------------------------------------+
```

Purpose:

- Recovery surface for direct state changes and repair actions.
- Hidden inside a collapsed details panel by default.

## Data Rules

Scoring:

- Team size is exactly four golfers.
- Budget is 90 points.
- Before the cut, best three available scores count.
- After the cut:
  - 0, 1, or 2 golfers through means eliminated.
  - 3 golfers through means qualified.
  - 4 golfers through means drop required.
- Final standings use lowest team score.

Golf data:

- Full-field sync creates missing tournament golfers.
- Non-sweepstake players use `N/A` cost.
- Field results include all synced, non-cut players after the cut.
- Scorecards show completed rounds as `18` thru.

Odds data:

- Shortest outright winner odds rank highest.
- Pricing assigns 55 down to 1 across the top 55.
- Matching must be reviewed before applying costs.

## Open Review Questions

1. Should unmatched top-55 odds runners block applying costs, or is a warning enough?
2. Should odds pricing use one bookmaker, average odds, or best available odds?
3. Should final standings need a tie-break beyond shared rank?
4. Should organisers be able to export final results to CSV?
5. Should accounts stay pre-created, or should players self-register?
6. Should admins be able to reopen picks after locking, or should that remain an advanced recovery action?
