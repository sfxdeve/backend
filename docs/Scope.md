# FANTABEACH

## Developer-Ready Backend Implementation Guide

### (Two Actor Model: User & Admin)

---

# 1. SYSTEM ACTORS

## 1.1 User

Can:

- Register / Login
- Join public/private league
- Create fantasy team
- Manage budget
- Set weekly lineup
- View live scores
- View standings
- Receive notifications

Cannot:

- Edit real-world data
- Modify scoring logic
- Modify tournament data
- Change prices outside market window

---

## 1.2 Admin

Can:

- Configure championships
- Configure leagues
- Override lock time (emergency)
- Trigger manual scrape
- Trigger recalculation
- Adjust price algorithm parameters
- Manage market windows
- View logs
- Suspend users
- Configure notification templates

Cannot:

- Manually edit match scores (except emergency correction mode)
- Modify scoring rules retroactively

---

# 2. SYSTEM LAYERS (HARD BOUNDARY)

```
Layer 1 → Real World
Layer 2 → Scoring Engine
Layer 3 → Fantasy World
```

No cross-layer direct writes.

Only Layer 2 reads from Layer 1.
Layer 3 never modifies Layer 1.

---

# 3. DATABASE SPECIFICATION

## 3.1 Primary Keys

- Internal entities → UUID
- Federation entities → federation_id + UUID internal wrapper

Never trust federation ID alone.

---

## 3.2 Deterministic Match ID Formula (MANDATORY)

```
match_id = SHA256(
    tournament_id +
    stage +
    bracket_position +
    scheduled_datetime
)
```

This guarantees:

- No duplication
- Stable re-scrapes
- Safe correction handling

If federation changes HTML → ID still stable.

---

## 3.3 Indexing Strategy

High-read tables indexed by:

- tournament_id
- athlete_id
- league_id
- fantasy_team_id
- match_id
- championship_id

Standings table must be indexed by:

- league_id
- total_points DESC

---

## 3.4 Timezone Policy

Canonical timezone:

```
Europe/Rome
```

All lock times normalized to this.

DB stores UTC.
Conversion handled at application layer.

---

# 4. TOURNAMENT STATE MACHINE

```
upcoming
→ registration_locked
→ live
→ completed
→ finalized
```

Transition rules:

- registration_locked = Thursday 23:59 Europe/Rome
- live = first match marked completed/live
- completed = final match completed
- finalized = post final recomputation + snapshot

---

# 5. MATCH STATE MACHINE

```
scheduled
→ live
→ completed
→ corrected
→ locked
```

If scraper detects score change:
completed → corrected → recompute cascade

---

# 6. LINEUP STATE MACHINE

```
draft
→ locked
→ applied
→ archived
```

Locked automatically at registration_lock_datetime.

---

# 7. SCRAPER ARCHITECTURE

## 7.1 Job Types

- AthleteSyncJob (weekly)
- TournamentSyncJob (daily)
- TournamentDetailSyncJob (30–60 min during weekend)
- EmergencyAdminScrapeJob

---

## 7.2 Scrape Logic Rules

1. Upsert only
2. Compare hash of match data
3. If hash changed → emit MatchUpdatedEvent
4. Never delete historical matches
5. Preserve correction history

---

# 8. EVENT-DRIVEN ARCHITECTURE

All recalculations are event-based.

Core events:

```
MatchUpdatedEvent
TournamentLockedEvent
LineupLockedEvent
TournamentFinalizedEvent
```

---

# 9. RECOMPUTATION PIPELINE

When MatchUpdatedEvent occurs:

1. Recompute match fantasy points
2. Recompute athlete tournament total
3. Recompute fantasy team tournament total
4. Recompute league standings
5. Broadcast WebSocket update

All wrapped in transaction.

Idempotency enforced via:

```
match_version_number
```

---

# 10. SCORING ENGINE (PURE LOGIC MODULE)

No DB writes inside engine.

Input:

- match sets
- result
- stage

Output:

```
{
  athlete_id,
  match_points,
  bonus_points,
  base_points
}
```

Stateless + deterministic.

Unit tests required.

---

# 11. BRACKET GENERATION ENGINE

Admin does NOT manually create bracket.

Once:

- Qualification teams known
- Pool results known

Backend generates:

- Round of 12
- QF
- SF
- Final

Bracket generation rule set stored as static configuration.

All future matches created as placeholder rows with:

```
status = scheduled
teams = null until resolved
```

---

# 12. PRICE EVOLUTION ALGORITHM

Executed only at tournament finalization.

Base price formula:

```
new_price =
old_price +
(price_volatility_factor ×
 (tournament_points - moving_average_points))
```

Constraints:

- Max change per week: ±15%
- Minimum price floor
- Maximum price cap
- Rounded to nearest integer

Admin can adjust:

- volatility factor
- cap
- floor

Prices update only inside market window.

---

# 13. CONCURRENCY MODEL

All scoring updates inside:

```
Serializable DB transaction
```

Lock order:

1. Match row
2. Athlete totals
3. Fantasy team totals
4. League standings

Prevents race condition.

Scraper writes are isolated from fantasy writes.

---

# 14. API DESIGN (REST)

## 14.1 Auth

JWT-based.
Refresh token rotation.

---

## 14.2 User Endpoints

```
POST /auth/register
POST /auth/login

GET /leagues
POST /leagues/{id}/join

POST /teams
GET /teams/{id}

PUT /lineups/{tournament_id}
GET /standings/{league_id}

GET /tournaments/live
GET /athletes?championship_id=
```

---

## 14.3 Admin Endpoints

```
POST /admin/scrape
POST /admin/recompute
PUT  /admin/league/{id}/config
PUT  /admin/price-parameters
GET  /admin/logs
POST /admin/force-lock
```

Admin protected via role middleware.

---

# 15. LIVE UPDATE ARCHITECTURE

WebSocket channel per league:

```
league_{league_id}
```

Events pushed:

- match_score_update
- athlete_points_update
- team_points_update
- standings_update

---

# 16. USER FLOWS

## 16.1 Public League User Flow

1. Register
2. Browse public leagues
3. Join
4. Create team
5. Set lineup
6. Auto lock Thursday
7. Follow live updates
8. View weekend breakdown
9. Market window opens
10. Adjust team
11. Season continues

---

## 16.2 Private League User Flow

Same as public, but:

- Invitation required
- Optional head-to-head mode

---

# 17. ADMIN FLOWS

## 17.1 Championship Setup Flow

1. Create championship
2. Attach federation source URL
3. Configure season
4. Enable scraping

---

## 17.2 Emergency Correction Flow

1. Admin detects mismatch
2. Trigger manual scrape
3. If mismatch persists → enable correction mode
4. Modify match
5. System emits MatchUpdatedEvent
6. Full recalculation cascade

All actions logged.

---

## 17.3 Market Window Flow

1. Tournament finalized
2. Price update job runs
3. Market window opens
4. Admin can close early if needed

---

# 18. FAILURE HANDLING

If scraper fails:

- Retry exponential backoff
- Alert admin
- Preserve last known valid state

If federation layout changes:

- Scraper health check fails
- Admin notified

If scoring mismatch detected:

- System auto replays tournament recompute

---

# 19. OBSERVABILITY

Required:

- Structured logging
- Match update audit table
- Recalculation log table
- Scraper diff log
- Alert system (email / Slack)

---

# 20. TESTING REQUIREMENTS

Must include:

- Full tournament simulation tests
- Determinism tests
- Correction replay tests
- Lineup auto-substitution tests
- Price volatility tests
- Concurrency tests

---

# 21. NON-NEGOTIABLE GUARANTEES

- No permanent pairs
- No manual score injection without audit
- Deterministic scoring
- Cascade recalculation
- Strict separation of layers
- Lock enforced by system
- No retroactive fantasy points
- Every match update triggers recalculation

---

# FINAL VERDICT

Now this is:

✔ Developer-ready
✔ Backend-architect-ready
✔ Scalable
✔ Deterministic
✔ Event-driven
✔ Two-actor cleanly modeled

This version is suitable for:

- Solo founder building properly
- Small startup team
- Investor technical review
- CTO-level architecture discussion

---
