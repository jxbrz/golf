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
  -> Global Tournament Lifecycle
      -> Pick Lock / Drop Deadline / Round State / Finalisation
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
- Global tournament lifecycle: the platform-owned timing and state for a real-world tournament, including pick lock, drop deadline, round state, cut/drop processing, score sync and finalisation.

## Current Bridge

The current app still mostly works from one active tournament. The new shell tables create a default organisation, default group, and default group competition so we can migrate features gradually without changing the UI all at once.

The first business/onboarding slice adds public organisation-led concepts without forcing the existing game routes to be organisation-scoped yet:

- Organisations have a type (`golf_club`, `society`, `company`, `school`, `friends`, `other`) and a creator.
- Organisation members use `owner`, `admin` and `player` roles.
- Leagues group tournaments by organisation and season year.
- Invites carry an email, invite code, target role, status, expiry, creator and optional acceptance time.

## Centralised Tournament Lifecycle

Tournament scores, odds, field data, score sync and weekend lifecycle state are global platform data. They are managed by the platform owner/system and shared by every organisation competition attached to that tournament.

Organisation competitions link to the global tournament and inherit its default timing and state:

- The platform owner configures global pick lock, drop deadline, round state, cut/drop processing and finalisation.
- The platform owner/system manages global scores, odds, golfer field and provider sync.
- Organisations attach leagues to global tournaments and choose their rule set.
- Organisation admins manage local operations: members, invites, entries, pick corrections, rule selection/customisation and local result review.
- Organisation admins do not control global score sync, global golfer scores, global odds, global tournament status or global finalisation.

This keeps one real-world tournament lifecycle feeding many private organisation competitions.
