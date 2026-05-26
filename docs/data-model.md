# Data Model

This is the intended product structure for the live app. Neon will show these as tables, while this file keeps the same model readable as a tree.

```text
Organisation
  -> Organisation Members
      -> Users
  -> Leagues
      -> League Tournaments
          -> Tournament
      -> Invites
  -> Groups
      -> Group Members
          -> Users
      -> Group Competitions
          -> Tournament
          -> Entries / Teams
              -> Entry Picks
                  -> Tournament Field Golfer

Tournament
  -> Tournament Field
      -> Golfer
      -> Round Scores
```

## Terms

- Organisation: the paying customer or account.
- Organisation member: a user inside an organisation, with owner, admin or player role.
- League: an organisation-owned season or competition collection.
- League tournament: one real-world tournament included in a league.
- Invite: a pending, accepted or expired email invitation into an organisation or league.
- Group: a private sweepstake/league inside an organisation.
- User: a person who can log in.
- Group member: a user inside a group, with a group role.
- Group competition: one group playing one real golf tournament.
- Entry / team: one user's submitted picks for one group competition.
- Golfer: a real-world professional golfer.
- Tournament: a real-world golf event.
- Tournament field: the golfers available in that specific tournament.

## Current Bridge

The current app still mostly works from one active tournament. The new shell tables create a default organisation, default group, and default group competition so we can migrate features gradually without changing the UI all at once.

The first business/onboarding slice adds public organisation-led concepts without forcing the existing game routes to be organisation-scoped yet:

- Organisations have a type (`golf_club`, `society`, `company`, `school`, `friends`, `other`) and a creator.
- Organisation members use `owner`, `admin` and `player` roles.
- Leagues group tournaments by organisation and season year.
- Invites carry an email, invite code, target role, status, expiry, creator and optional acceptance time.
