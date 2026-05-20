# Major Picks Wireframes

Low-fidelity wireframes for organiser review. These describe the intended screens, navigation, tournament states, and admin operations rather than exact visual styling.

## Product Shape

Major Picks is a private golf major sweepstake app.

Players:
- Sign in with organiser-provided account details.
- Pick exactly 4 golfers under the 90 point cap before picks lock.
- Review a submitted team while the tournament has not started.
- Track live standings once play begins.
- Drop one golfer only when all 4 picked golfers make the cut.
- View final results and field results after the tournament is finalised.

Admins:
- View all tournaments and quick admin tasks.
- Import/sync the tournament field.
- Generate player costs from outright odds.
- Lock picks and progress the tournament through each weekend state.
- Sync leaderboard and scorecard data from the configured provider.
- Manually import/edit scores if the provider data is wrong or unavailable.
- Correct submitted entries with an audit reason.

## Navigation States

The app uses a desktop header nav and a mobile bottom nav. Admin users always keep access to the Admin area.

### Pre-Play, Non-Admin

Before play begins, non-admin users have a deliberately small navigation surface.

```text
+------------------------------------------------+
| [Major Picks] PGA 2026                 [User] |
|                                        [Log]  |
+------------------------------------------------+

Mobile bottom nav
+------------------------------------------------+
|                 Welcome / Team                 |
+------------------------------------------------+
```

Rules:
- If the player has not submitted, the nav item is Welcome and routes to the home screen.
- If the player has submitted, the nav item is Team and routes to the locked team view.
- Standings are hidden until play starts.

### Live Tournament, Non-Admin

```text
+------------------------------------------------+
| [Major Picks] PGA 2026                         |
|             Team  Standings  Drop*  Field [Log]|
+------------------------------------------------+

Mobile bottom nav
+------------------------------------------------+
|        Team | Standings | Drop* | Field         |
+------------------------------------------------+
* Drop appears only for entries with status drop_required.
```

### Final, Non-Admin

```text
+------------------------------------------------+
| [Major Picks] PGA 2026                         |
|                   Results  Field Results [Log] |
+------------------------------------------------+

Mobile bottom nav
+------------------------------------------------+
|             Results | Field Results            |
+------------------------------------------------+
```

Admin users keep full tournament navigation after finalisation, with Results added.

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
- Simple access gate for a private game.
- No public marketing page.

### 2. Home - No Team Submitted

```text
+------------------------------------------------+
| [Major mark] PGA Championship                  |
| 2026 private sweepstake                        |
|                                                |
| Welcome. Select your picks.                    |
| Pick 4 golfers under the 90 point cap.         |
|                                                |
| [ Select your picks ]                          |
|                                                |
|                      +-----------------------+ |
|                      | Venue image           | |
|                      | Aronimink Golf Club   | |
|                      | Picks lock date/time  | |
|                      | Four golfers, best 3  | |
|                      +-----------------------+ |
+------------------------------------------------+

+------------------------------------------------+
| How it works                                   |
| +------------+ +------------+ +-------------+  |
| | 1 Pick 4   | | 2 Under 90 | | 3 Best 3   |  |
| | golfers    | | points     | | count      |  |
| +------------+ +------------+ +-------------+  |
+------------------------------------------------+
```

Rules:
- This is the first screen for players before play starts.
- If picks are locked before a player submits, the hero changes to "Picks are locked."

### 3. Home - Team Submitted

```text
+------------------------------------------------+
| [Major mark] PGA Championship                  |
|                                                |
| Your team is in.                               |
| Nothing else to do yet. Standings open after   |
| round one is in.                               |
+------------------------------------------------+

+-------------------------------+ +--------------+
| Thanks for your picks.        | | Team card    |
| Your team is saved.           | |              |
|                               | | 90 points    |
| [ Review team ]               | | Golfer A     |
+-------------------------------+ | Golfer B     |
                                  | Golfer C     |
                                  | Golfer D     |
                                  +--------------+
```

### 4. Pick Team

```text
+------------------------------------------------+
| Pick your team                                 |
| Pick exactly 4 golfers under the 90 point cap. |
+------------------------------------------------+

+-------------------------------+ +--------------+
| Available golfers             | | Team sheet   |
| Only priced players selectable| | Four names.  |
| +---------------------------+ | | 90 points.  |
| | Search golfers            | | |              |
| +---------------------------+ | | Budget 0/90  |
|                               | |              |
| [ ] Golfer name          55   | | Player 1  -- |
|     Not started - Country     | | Player 2  -- |
|                               | | Player 3  -- |
| [ ] Golfer name          54   | | Player 4  -- |
|     T12 - -2 - Country        | |              |
|                               | | [Submit      |
| Unaffordable or fifth picks   | |  locked team]|
| are disabled.                 | +--------------+
+-------------------------------+
```

Mobile behaviour:
- A floating budget bar appears while picks are selected and the team sheet is off-screen.

Rules:
- Only golfers with a numeric point value are selectable.
- Four golfers are required.
- Total must be 90 or less.
- Submitted teams are locked.

### 5. Submitted Team

```text
+------------------------------------------------+
| Pick your team                                 |
| Thanks for your picks. Come back after round 1.|
+------------------------------------------------+

+-------------------------------+ +--------------+
| Team card                     | | Team locked  |
| 90 points used        Score   | |              |
|                               | | Saved team   |
| Golfer A  score/status/cost   | | can be       |
| Golfer B  score/status/cost   | | reviewed.    |
| Golfer C  score/status/cost   | |              |
| Golfer D  score/status/cost   | | [Standings]* |
+-------------------------------+ +--------------+
* Shown once standings are available.
```

### 6. Standings

```text
+------------------------------------------------+
| Standings                                      |
| The live sweepstake table.                     |
| [View field results]                           |
+------------------------------------------------+

+------------------------------------------------+
| Current standings                              |
| Best 3 available scores count                  |
|                                                |
| 1  Player name                  -3      [show] |
|    Status badge                                |
|                                                |
| 2  Player name                  +1      [show] |
+------------------------------------------------+
```

Expanded row:

```text
+------------------------------------------------+
| 1  Player name                  -3      [hide] |
|    Qualified / Eliminated / Drop required      |
|------------------------------------------------|
| Golfer A       total/today/thru/cost   Counting|
| Golfer B       total/today/thru/cost   Counting|
| Golfer C       total/today/thru/cost   Counting|
| Golfer D       total/today/thru/cost   Cut     |
+------------------------------------------------+
```

Rules:
- Non-admin players are redirected here once play begins.
- Before the cut, best 3 available scores count.
- After the cut, only made-cut golfers can count.
- If 4 picked golfers make the cut, status becomes Drop required and Drop appears in nav.

### 7. Drop Player

Drop required state:

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

No drop needed state:

```text
+------------------------------------------------+
| No manual drop needed                          |
| The standings now count the best 3 available   |
| scores automatically.                          |
+------------------------------------------------+
```

Rules:
- Drop only appears when the entry status is drop_required.
- Exactly one golfer is dropped.
- Remaining 3 count.

### 8. Field Leaderboard / Field Results

```text
+------------------------------------------------+
| [Back]                                         |
+------------------------------------------------+

+------------------------------------------------+
| [Major mark] Field leaderboard                 |
| Tournament leaderboard. Cut players are removed|
| after the cut, but remain visible in teams.    |
+------------------------------------------------+

+------------------------------------------------+
| Pos | Player         | Cost | Total | Today | Thru |
| 1   | Golfer A       | 55   | -4    | -2    | 18   |
| T2  | Golfer B       | N/A  | -3    | E     | 18   |
+------------------------------------------------+
```

Rules:
- Title is Field leaderboard before final.
- Title is Field results after final.
- Cut players are removed from the field list after the cut.
- Cut players still appear inside team rows if they were picked.
- Player names link to the scorecard.

### 9. Player Scorecard

```text
+------------------------------------------------+
| [Back to field leaderboard]                    |
+------------------------------------------------+

+------------------------------------------------+
| Player scorecard                               |
| Golfer name                                    |
| Country - Tournament year                      |
+------------------------------------------------+

+-----------+-----------+-----------+-----------+
| Position  | Total     | Today     | Cost      |
| T8        | -2        | E         | 33 / N/A  |
+-----------+-----------+-----------+-----------+

+------------------------------------------------+
| Rounds                                  [badge]|
| Round | Score | Strokes | Thru                 |
| R1    | -2    | 68      | 18                   |
| R2    | +2    | 72      | 18                   |
| R3    | -     | -       | -                    |
| R4    | -     | -       | -                    |
|                                                |
| Last updated date/time                         |
+------------------------------------------------+
```

Rules:
- Provider `F` or `F*` is shown as `18`.
- Full field scorecards exist for synced players.

### 10. Final Results

```text
+------------------------------------------------+
| [Current Standings / Field Results]            |
+------------------------------------------------+

+------------------------------------------------+
| Final results                                  |
| PGA Championship 2026                          |
| Tournament complete                            |
+------------------------------------------------+

+------------------------------------------------+
| [Trophy] Lowest round                          |
| Picked Golfer shot -5 in round 3.              |
| Picked by Player A, Player C.                  |
| If tied: winning on B3/B6/B9/B18 countback.    |
+------------------------------------------------+

+------------------------------------------------+
| Final leaderboard                              |
| Lowest combined score wins.                    |
|                                                |
| 1  Player name                  -8      [show] |
|    Final                                      |
| 2  Player name                  -4      [show] |
+------------------------------------------------+
```

Rules:
- Non-admin users only see Results and Field Results after finalisation.
- Admin users can navigate back to Current Standings.
- Rows expand to show selected golfers.
- Lowest round only considers golfers who were picked.
- Countback order: B3, B6, B9, B18.

## Admin Screens

### 11. Admin Dashboard

```text
+------------------------------------------------+
| Admin                                          |
| Simple controls for running the competition.   |
+------------------------------------------------+

+------------------------+ +---------------------+
| Tournament card        | | Tournament card     |
| status                 | | status              |
| Major/year             | | Major/year          |
| Venue                  | | Venue               |
+------------------------+ +---------------------+

+------------------------------------------------+
| Quick tasks                                    |
| [Entries] [Scores] [Final Results*]            |
+------------------------------------------------+
* Final Results appears only when the active tournament is final.
```

### 12. Admin Tournament Control

```text
+------------------------------------------------+
| Admin tournament                               |
| PGA Championship 2026                          |
| 55 golfers loaded - Status: picks_open         |
+------------------------------------------------+

+------------------------------------------------+
| Tournament control                             |
| Current stage title                            |
| Helper text                                    |
|                                                |
| +----------+ +----------+ +----------+         |
| | Teams 12 | | Scored 0 | | Made cut |         |
| +----------+ +----------+ +----------+         |
|                                                |
| Next sensible action                           |
| [Lock Picks / Start Thursday / Process Cut]    |
+------------------------------------------------+

+------------------------------------------------+
| Weekend timeline                               |
| Tuesday | Lock | Thu | Fri | Sat | Sun | Final |
+------------------------------------------------+

+------------------------------------------------+
| Admin tasks                                    |
| [Entries] [Scores] [Import] [Odds] [Advanced] |
| [Final Results]                                |
+------------------------------------------------+
```

### 13. Admin Odds Pricing

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

### 14. Admin CSV Import

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

### 15. Admin Score Sync

```text
+------------------------------------------------+
| Score sync                                     |
| live provider / mock simulator                 |
| Tournament ID: provider id                     |
|                                                |
| Success - provider                             |
| Message and synced date/time                   |
|                                                |
| Failed - provider                              |
| Error message and synced date/time             |
+------------------------------------------------+
```

Rules:
- Mock mode makes no live score API calls.
- Live mode can sync leaderboard data.
- Scorecard API calls can be separately enabled or skipped.

### 16. Admin Advanced Controls

```text
+------------------------------------------------+
| Advanced controls                              |
| Use these only for corrections or recovery.    |
+------------------------------------------------+

+------------------------------------------------+
| Raw tournament status                          |
| [status select] [Update]                       |
|                                                |
| [Process cut] [Recalculate] [Sync scores]      |
| [Finalise]    [Edit scores]                    |
+------------------------------------------------+
```

Purpose:
- Recovery panel for direct status changes and repair actions.
- Hidden inside a details/accordion surface by default.

### 17. Admin Entries

```text
+------------------------------------------------+
| [Back to Admin]                                |
+------------------------------------------------+

+------------------------------------------------+
| Entries                                        |
| Review and correct submitted teams.            |
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
- Reason is required for audit trail.

### 18. Admin Scores

```text
+------------------------------------------------+
| Scores                                         |
| Edit scores, cut status, WD/DQ, and positions. |
+------------------------------------------------+

+------------------------------------------------+
| Manual score import                            |
| Paste leaderboard/score CSV                    |
| +--------------------------------------------+ |
| | CSV textarea                               | |
| +--------------------------------------------+ |
| [Import scores]                                |
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
- Imported scores do not require API calls.
- Every edit should be treated as a deliberate admin override.

## Weekend State Machine

```text
draft
  -> Open picks / load field
picks_open
  -> Lock Picks
picks_locked
  -> Start Thursday
round_1
  -> Start Friday
round_2
  -> Process Cut
cut_pending
  -> Process Cut
drop_open
  -> Start Saturday
round_3
  -> Start Sunday
round_4
  -> Finalise Results
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
6. Should admins be able to reopen picks after locking, or should that stay an advanced/manual recovery action?
