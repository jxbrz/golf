# Major Picks Wireframes

Low-fidelity wireframes for organiser review. These describe the intended screens, navigation, and tournament states rather than exact visual styling.

## Product Shape

Major Picks is a private golf major sweepstake app.

Players:
- Pick 4 golfers under the 90 point cap before play starts.
- Track standings during the weekend.
- Drop one golfer if all 4 make the cut.
- View final results after the tournament.

Admins:
- Import/sync the tournament field.
- Generate player costs from outright odds.
- Lock picks and progress the tournament round by round.
- Sync leaderboard/scorecard data from the API.
- Correct entries or scores if needed.

## Navigation States

### Before Final

```text
Header
+------------------------------------------------+
| [Major Picks]          Home Pick Standings Field |
|                                      [Admin] [↗] |
+------------------------------------------------+

Bottom nav
+------------------------------------------------+
| Home | Team/Pick | Standings | Field | Admin*    |
+------------------------------------------------+
* Admin only
```

### After Final, Non-Admin

```text
Header
+------------------------------------------------+
| [Major Picks]             Results Field Results |
|                                             [↗] |
+------------------------------------------------+

Bottom nav
+------------------------------------------------+
|              Results | Field Results            |
+------------------------------------------------+
```

Admin users keep full navigation after finalisation.

## Player Screens

### 1. Login

```text
+------------------------------------------------+
|                 Major Picks                    |
| Private competition                            |
|                                                |
| Email                                          |
| +--------------------------------------------+ |
| Password                                       |
| +--------------------------------------------+ |
|                                                |
| [ Sign in ]                                    |
|                                                |
| Starter accounts / organiser-provided details  |
+------------------------------------------------+
```

Purpose:
- Simple access gate for private game.
- No public marketing page.

### 2. Home - No Team Submitted

```text
+------------------------------------------------+
| PGA Championship 2026                          |
| Aronimink Golf Club                            |
| Picks lock: date/time                          |
|                                                |
| [ Pick Team ] [ Current Standings ] [ Field ]  |
+------------------------------------------------+

+--------------------------+ +-------------------+
| Current standings        | | Simple rules      |
| Top 3 only on home       | | - Pick 4 golfers  |
|                          | | - Max 90 points   |
| Empty state if no teams  | | - Teams lock      |
|                          | | - Best 3 count    |
+--------------------------+ +-------------------+
```

Rules:
- Home standings preview shows top 3 only.
- Full standings live on the Standings page.

### 3. Pick Team

```text
+------------------------------------------------+
| Pick your team                                 |
| Pick exactly 4 golfers under the 90 point cap. |
+------------------------------------------------+

+-------------------------------+ +--------------+
| Search golfers                | | Selected     |
| +---------------------------+ | | Budget 0/90  |
|                               | |              |
| [ ] Golfer name       Cost 55 | | Player 1  -- |
|     Country / score           | | Player 2  -- |
|                               | | Player 3  -- |
| [ ] Golfer name       Cost 54 | | Player 4  -- |
|                               | |              |
| Only numeric-cost golfers     | | [Submit]     |
| are selectable. N/A field     | +--------------+
| players do not appear here.   |
+-------------------------------+
```

Rules:
- Only players with a numeric cost can be selected.
- Four golfers required.
- Total must be 90 or less.
- Submitted team is locked.

### 4. Submitted Team

```text
+------------------------------------------------+
| Pick your team                                 |
| Your team has been submitted.                  |
+------------------------------------------------+

+-------------------------------+ +--------------+
| Your team                     | | Team locked  |
| 90 points used        Score   | |              |
|                               | | [Standings]  |
| Golfer A  score/status/cost   | +--------------+
| Golfer B  score/status/cost   |
| Golfer C  score/status/cost   |
| Golfer D  score/status/cost   |
+-------------------------------+
```

### 5. Standings

```text
+------------------------------------------------+
| Current standings                              |
| Tap a name to see the full team.               |
| [View Field Leaderboard]                       |
+------------------------------------------------+

+------------------------------------------------+
| Current standings                              |
| Best 3 available scores count                  |
|                                                |
| 1  Player name                  -3      [v]    |
|    Status badge                                |
|                                                |
| 2  Player name                  +1      [v]    |
|                                                |
+------------------------------------------------+
```

Expanded row:

```text
+------------------------------------------------+
| 1  Player name                  -3      [^]    |
|    Qualified / Eliminated / Drop required      |
|------------------------------------------------|
| Golfer A       total/today/thru/cost   Counting|
| Golfer B       total/today/thru/cost   Counting|
| Golfer C       total/today/thru/cost   Counting|
| Golfer D       total/today/thru/cost   Cut     |
+------------------------------------------------+
```

Rules:
- Before cut: best 3 available scores count.
- After cut: only made-cut golfers can count.
- If 4 golfers make the cut, status becomes Drop required.
- Team dropdown does not show "3 made cut"; the entry status badge is enough.

### 6. Drop Player

```text
+------------------------------------------------+
| Drop one player                                |
| Choose the one player you do not want to count.|
+------------------------------------------------+

+------------------------------------------------+
| ( ) Golfer A       score / position / cost     |
| ( ) Golfer B       score / position / cost     |
| ( ) Golfer C       score / position / cost     |
| ( ) Golfer D       score / position / cost     |
+------------------------------------------------+

+------------------------------------------------+
| Confirm your choice                            |
| Dropping: Golfer name                          |
|                                                |
| These 3 will count:                            |
| - Golfer A                                     |
| - Golfer B                                     |
| - Golfer C                                     |
|                                                |
| [Confirm dropped player]                       |
+------------------------------------------------+
```

Rules:
- Only appears when all 4 selected golfers made the cut.
- Exactly one golfer is dropped.
- Remaining 3 count.

### 7. Field Results / Field Leaderboard

Before cut:

```text
+------------------------------------------------+
| Field leaderboard                              |
| PGA Championship                               |
+------------------------------------------------+

+------------------------------------------------+
| Pos | Player         | Cost | Total | Today | Thru |
| 1   | Golfer A       | 55   | -4    | -2    | 18   |
| T2  | Golfer B       | N/A  | -3    | E     | 18   |
+------------------------------------------------+
```

After cut:
- Cut players are removed from Field Results.
- Cut players still appear inside team dropdowns if picked.

### 8. Player Scorecard

```text
+------------------------------------------------+
| Player scorecard                               |
| Golfer name                                    |
| Country · Tournament                           |
+------------------------------------------------+

+-----------+-----------+-----------+-----------+
| Position  | Total     | Today     | Cost      |
| T8        | -2        | E         | 33 / N/A  |
+-----------+-----------+-----------+-----------+

+------------------------------------------------+
| Rounds                                         |
| Round | Score | Strokes | Thru                 |
| R1    | -2    | 68      | 18                   |
| R2    | +2    | 72      | 18                   |
| R3    | -     | -       | -                    |
| R4    | -     | -       | -                    |
+------------------------------------------------+
```

Rules:
- API `F` or `F*` is shown as `18`.
- Full field scorecards exist for synced players.

### 9. Final Results

```text
+------------------------------------------------+
| Final results                                  |
| PGA Championship 2026                          |
| Tournament complete                            |
+------------------------------------------------+

+------------------------------------------------+
| Lowest round                                   |
| Picked Golfer shot -5 in round 3.              |
| Picked by Player A, Player C.                  |
| If tied: winning on B3/B6/B9/B18 countback.    |
+------------------------------------------------+

+------------------------------------------------+
| Final leaderboard                              |
| 1  Player name                  -8      [v]    |
|    Final                                      |
| 2  Player name                  -4      [v]    |
+------------------------------------------------+
```

Rules:
- Non-admin users only see Results and Field Results after finalisation.
- Rows expand to show selected golfers.
- Lowest round only considers golfers who were picked.
- Countback order: B3, B6, B9, B18.

## Admin Screens

### 10. Admin Dashboard

```text
+------------------------------------------------+
| Admin                                          |
| Active tournament summary                      |
+------------------------------------------------+

+------------------------------------------------+
| Tournament card                                |
| Status / year / provider ID                    |
| [Manage tournament] [Entries] [Scores]         |
+------------------------------------------------+
```

### 11. Admin Tournament Control

```text
+------------------------------------------------+
| Admin tournament                               |
| PGA Championship 2026                          |
| 55+ golfers loaded · Status: picks_open        |
+------------------------------------------------+

+------------------------------------------------+
| Tournament control                             |
| Current stage title                            |
| Helper text                                    |
|                                                |
| Teams | Scored | Made cut                      |
|                                                |
| Next sensible action                           |
| [Lock Picks / Start Thursday / Process Cut]    |
+------------------------------------------------+

+------------------------------------------------+
| Weekend timeline                               |
| Tuesday | Lock | Thu | Fri | Sat | Sun | Final |
+------------------------------------------------+
```

### 12. Admin Odds Pricing

```text
+------------------------------------------------+
| Sweepstake pricing                             |
| Odds-based costs                               |
| Favourite = 55, 55th favourite = 1             |
|                                                |
| [Preview Odds Pricing]                         |
+------------------------------------------------+

Preview state:

+------------------------------------------------+
| Provider | Sport key | Matched 52/55 | Unmatched 3 |
+------------------------------------------------+

+------------------------------------------------+
| Rank | Cost | Odds runner | Matched golfer | Odds |
| 1    | 55   | Scottie...  | Scottie...     | 5.50 |
| 2    | 54   | Rory...     | Rory...        | 8.00 |
| 3    | 53   | Name...     | Unmatched      | 12.0 |
+------------------------------------------------+

| [Apply Matched Top 55 Costs]                   |
+------------------------------------------------+
```

Rules:
- Uses outright winner odds.
- Top 55 runners receive costs 55 down to 1.
- Matched golfers outside top 55 become N/A.
- Unmatched runners are shown for organiser review.
- Costs should be applied before picks open/lock.
- Existing submitted entries keep their point value at pick time.

### 13. Admin CSV Import

```text
+------------------------------------------------+
| Import golfers                                 |
| Paste CSV: name, points                        |
| Optional: country, providerPlayerId            |
|                                                |
| +--------------------------------------------+ |
| | CSV textarea                               | |
| +--------------------------------------------+ |
| [Import CSV]                                  |
+------------------------------------------------+
```

Purpose:
- Manual fallback for pricing/field setup.
- Useful if odds API names fail or no odds key is available.

### 14. Admin Entries

```text
+------------------------------------------------+
| Manage entries                                 |
| Change picks for any player.                   |
+------------------------------------------------+

+------------------------------------------------+
| Player One                         status      |
| Pick 1 [select golfer]                         |
| Pick 2 [select golfer]                         |
| Pick 3 [select golfer]                         |
| Pick 4 [select golfer]                         |
| Reason [input]                                 |
| [Save entry changes]                           |
+------------------------------------------------+
```

Rules:
- Admin can correct teams.
- Numeric-cost golfers only.
- Reason required for audit trail.

### 15. Admin Scores

```text
+------------------------------------------------+
| Edit scores                                    |
| Every change is logged as an admin override.   |
+------------------------------------------------+

+------------------------------------------------+
| Golfer name                           Cost     |
| Position / Total / Today / Status              |
| Total [input] [Save]                           |
| Today [input] [Save]                           |
| Pos   [input] [Save]                           |
| Thru  [input] [Save]                           |
| Cut   [input] [Save]                           |
| Status[input] [Save]                           |
+------------------------------------------------+
```

Purpose:
- Manual correction if API data is wrong or missing.

## Weekend State Machine

```text
picks_open
  ↓ Lock Picks
picks_locked
  ↓ Start Thursday
round_1
  ↓ Start Friday
round_2
  ↓ Process Cut
drop_open
  ↓ Start Saturday
round_3
  ↓ Start Sunday
round_4
  ↓ Finalise Results
final
```

Scoring rules:
- Team size: 4 golfers.
- Budget: 90 points.
- Before cut: best 3 scores count.
- After cut:
  - 0, 1, or 2 golfers through = eliminated.
  - 3 golfers through = qualified.
  - 4 golfers through = drop required.
- Final:
  - Lowest team score wins.
  - Final non-admin navigation is Results + Field Results only.

## API Data Rules

Golf leaderboard API:
- Full field sync creates tournament golfers when missing.
- Non-sweepstake players have cost N/A.
- Field Results includes all non-cut synced players.
- Scorecards show completed rounds as 18 thru.

Odds API:
- Outright winner odds determine sweepstake costs.
- Shortest odds are ranked highest.
- Costs assigned 55 down to 1.
- Matching is reviewed by admin before applying.

## Open Review Questions

1. Should unmatched top-55 odds runners block applying costs, or is warning enough?
2. Should odds pricing use one bookmaker, average of all bookmakers, or best available odds?
3. Should final standings need a tie-break beyond shared rank?
4. Should organisers be able to export final results to CSV?
5. Should player accounts be pre-created only, or should players self-register?
