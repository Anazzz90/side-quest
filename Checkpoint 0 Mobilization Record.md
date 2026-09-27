# Checkpoint 0 Mobilization Record

**Project:** Side Quest  
**Checkpoint:** 0 — Mobilize and settle decisions  
**Record date:** 25 September 2026  
**Status:** In progress — independent, cross-institution direction confirmed; named assignments and calendar dates remain open

## Product premise

Side Quest is an independently operated, student-centered local connection platform open to any account holder aged 18 or older who meets account-integrity and safety rules. Students from different institutions are a core audience, but student status is not required for general access. No university’s acceptance, sponsorship, identity system, or integration is required for the service to operate.

Campuses, clubs, and student organizations may be optional communities or meetup contexts. The platform can initially concentrate activity in one geographic launch area to make the pilot manageable; that area is an operating choice, not an institution-based eligibility boundary. Public meetup places are the default. Permission is needed only for restricted venues, university branding, official channels, or integrations if the team chooses to use them.

This direction does not imply institutional permission, legal/privacy approval, an assigned project team, or authorization to collect real student data.

## Proposed first release

- Google sign-in or email/password account access, account recovery, profiles, privacy, and account controls; no student-status verification for general access.
- Local-area map and equivalent list discovery with search, filters, time, capacity, and suitable public meetup places.
- Activity and bounded Favor quest creation, editing, publishing, cancellation, and expiry.
- Join requests, host decisions, server-enforced capacity, and private quest-room access for accepted participants.
- Private room chat, completion submissions, optional private evidence, confirmation/dispute, and consent-based recaps.
- Auditable points, configurable seasons/caps, opt-in leaderboard, and notification preferences.
- Reporting, blocking, moderation case handling, pause controls, and data-minimized pilot analytics.

Production account standing, age rules, quest state, capacity, room access, completion, and point awards must be enforced by trusted backend services. The browser prototype is illustrative and must not collect real user information.

## First release exclusions

Native iOS/Android apps, payments or money settlement, gig-work/courier activity, public follower graphs, open direct messages, continuous GPS, public user-location sharing, public proof images, and university-system integrations. Emergency response, regulated transport, medical decisions, financial transactions, controlled goods, and private/home access are outside the product boundary. No official university status or endorsement is claimed.

## Candidate technical direction

The prototype README proposes Next.js on Vercel with Supabase for PostgreSQL, authentication, private media, and realtime chat. The database design specifies PostgreSQL with PostGIS and a modular-monolith approach; the product plan also names NestJS or a similarly structured TypeScript API. Select and record one production architecture before environment setup.

Mapbox GL JS with a restricted public browser token is the current map recommendation. Begin with map rendering and curated public meetup places; geocoding and device-location tracking are not needed for the first release. Dubai Academic City is selected as the first launch area; validate its exact operating boundary, venue coverage, map coverage, and provider terms.

## Accountability map

| Role | Accountable work | Named person | Acceptance authority |
|---|---|---|---|
| Product owner | Scope, priorities, hypotheses, product decisions, phase gates | To assign | Accepts scope and checkpoint gates |
| Engineering lead | Architecture, implementation, security, deployment, reliability | To assign | Accepts technical readiness evidence |
| Design lead | Journeys, UI states, accessibility, usability validation | To assign | Accepts design evidence |
| Moderator and backup | Coverage, cases, escalation, appeals, incident pause | To assign | Accepts moderation readiness |
| Privacy/legal reviewer | Applicable privacy, 18+ age-assurance controls, hosting, processors, retention, deletion, holds | To assign | Confirms review outcomes within remit |
| Local operating advisor (optional) | Local public-venue and event constraints | To assign | Confirms venue-specific input |
| Pilot student representatives | Usability feedback and pilot journey review | To assign | Provide feedback; do not approve policy |

## Decision log

Calendar due dates are not set in the source material. The product owner should add named owners and dates at kickoff.

| ID | Decision | Responsible roles | Needed by | Status |
|---|---|---|---|---|
| D-01 | The product minimum age is 18; define and review age-assurance controls, evidence, and data minimization; student status is not a general-access requirement | Product owner, privacy/legal reviewer | Before pilot approval | 18+ rule decided; enforcement and review open |
| D-02 | Decide whether an optional student label or student-restricted community should exist in a later phase; it must not gate general access | Product owner, engineering lead, privacy/legal reviewer | Before any such future feature | Out of MVP; no student-status verification for general access |
| D-03 | Select the geographic launch area and pilot cohort size for operational focus | Product owner, moderator | Before discovery build | Dubai Academic City selected; exact boundary and cohort size open |
| D-04 | List suitable public meetup places and categories; obtain permission only for restricted venues or optional institutional resources | Product owner, moderator, optional local advisor | Before map content is approved | Open |
| D-05 | Select map provider and location behavior; validate map detail in the chosen area | Product owner, engineering lead | Before map implementation is committed | Mapbox GL JS approved and integrated (CP4 addendum); a personal-account public token is in use for development — a production-owned token/account is still open before launch |
| D-06 | Select production architecture, hosting/data region, authentication, realtime, and media providers | Product owner, engineering lead, privacy/legal reviewer | Before environment/data setup | Open |
| D-07 | Approve data inventory, processors, retention, deletion/export, legal holds, and applicable privacy review | Product owner, privacy/legal reviewer | Before storing real student data | Open; launch blocker |
| D-08 | Appoint moderator and backup; set coverage, response target, escalation, appeals, and pause criteria | Product owner, moderator | Before pilot launch | Open; launch blocker |
| D-09 | Set completion quorum, dispute window, evidence retention, and recap consent rules | Product owner, moderator, privacy/legal reviewer | Before completion feature acceptance | Open |
| D-10 | Set points, seasons, caps, adjustments, and leaderboard opt-in behavior | Product owner, engineering lead, moderator | Before points feature acceptance | Open |
| D-11 | Decide rejoin behavior and closed-room access/retention after completion | Product owner, engineering lead, moderator, privacy/legal reviewer | Before data model freeze | Open |
| D-12 | Set cohort/load target, support hours, success thresholds, and stop/extend/expand criteria | Product owner, engineering lead, moderator | Before readiness gate | Open |
| D-13 | Resolve filter behavior, theme persistence, saved quests, and completed chat/recap behavior | Product owner, design lead | Before UX acceptance | Open |
| D-14 | Support Google sign-in and email/password for account access; select the authentication service and define confirmation, recovery, account linking, and duplicate-account behavior | Product owner, engineering lead, privacy/legal reviewer | Before identity build | Sign-in methods selected; lifecycle/provider details open |

## Prioritized delivery baseline

1. Resolve 18+ age-assurance and enforcement, account security/recovery, privacy, public venue, and moderation decisions.
2. Establish secure identity, geographic discovery, optional communities, authorization, audit, backup, and privacy foundations.
3. Deliver discovery, quest creation, requests, acceptance, capacity, and authorized private room access.
4. Deliver chat, completion, evidence, dispute handling, points, feed/recap, and notifications.
5. Complete moderation/admin controls, accessibility, analytics, runbooks, and pilot hardening.
6. Run an invited, cross-institution pilot in the selected area; use evidence to decide whether to iterate, stop, or expand.

## Success measure baseline

The north-star measure is weekly completed quests with at least two distinct students, reported per active launch area or optional community. Supporting measures include activation, join conversion, completion, time to first connection, repeat participation, safety, fairness, and reliability. Numeric targets, pilot size, and stop thresholds remain open for the product owner; this record does not invent them.

## Checkpoint 0 exit review

| Exit evidence | Current state |
|---|---|
| Independent cross-institution product premise, launch model, and exclusions | Confirmed by the project direction change and recorded |
| Decisions captured with responsible roles and latest required gate | Prepared; named owners and dates pending |
| Accountability map | Prepared; individual assignments pending |
| Prioritized delivery order and north-star measure | Prepared; numeric targets pending |
| Product owner accepts the remaining accountability, decision log, and hypotheses | Pending named role assignments and numeric pilot thresholds |

**Checkpoint result:** The revised product premise is confirmed. Checkpoint 0 remains in progress until named role assignments, calendar dates, and pilot thresholds are recorded. University acceptance is not a launch dependency. The fixed 18+ rule and its approved enforcement, privacy, moderation, and permission rules for any restricted venue or optional institutional resource remain launch requirements. Student-status verification is not a general-access launch gate.

## Source documents reviewed

- Side Quest Software Requirements Document.
- Side Quest Website Product and Technical Plan.
- Side Quest Database Design Document.
- SideQuest UI UX Design Specification.
- Clickable prototype README.
