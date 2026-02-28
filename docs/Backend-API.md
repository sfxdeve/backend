# FantaBeach Backend API — Frontend Developer Guide

Base URL: `http://localhost:3000` (or your deployed origin)  
API prefix: `/api`  
All JSON request/response; charset UTF-8.

---

## 1. Authentication

### 1.1 Overview

- **JWT access token** — Send in the `Authorization` header for protected routes:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Refresh token** — Stored by the client; used to get a new access token via `POST /api/auth/refresh` (body: `{ "refreshToken": "..." }`).
- **Session** — Logout revokes the current session; refresh uses the same session until revoked.

### 1.2 Auth Endpoints

| Method | Path                        | Auth   | Description                                          |
| ------ | --------------------------- | ------ | ---------------------------------------------------- |
| POST   | `/api/auth/register`        | No     | Register; returns `userId`; sends OTP email          |
| POST   | `/api/auth/verify-email`    | No     | Verify email with 6-digit code                       |
| POST   | `/api/auth/login`           | No     | Login; returns `accessToken`, `refreshToken`, `user` |
| POST   | `/api/auth/refresh`         | No     | Get new access token from refresh token              |
| POST   | `/api/auth/logout`          | Bearer | Revoke current session                               |
| POST   | `/api/auth/forgot-password` | No     | Send reset code to email                             |
| POST   | `/api/auth/reset-password`  | No     | Reset password with code                             |

**Rate limits:** Stricter limits on register, login, and forgot-password.

#### Request bodies

- **Register**  
  `POST /api/auth/register`

  ```json
  { "email": "user@example.com", "name": "Jane Doe", "password": "min8chars" }
  ```

  - Response: `201` → `{ "userId": "<id>" }`

- **Verify email**  
  `POST /api/auth/verify-email`

  ```json
  { "userId": "<id from register>", "code": "123456" }
  ```

  - `code`: exactly 6 digits.
  - Response: `204` no content.

- **Login**  
  `POST /api/auth/login`

  ```json
  { "email": "user@example.com", "password": "..." }
  ```

  - Response: `200` →  
    `{ "accessToken": "...", "refreshToken": "...", "user": { "id", "email", "name", "role" } }`
  - `role`: `"USER"` or `"ADMIN"`.

- **Refresh**  
  `POST /api/auth/refresh`

  ```json
  { "refreshToken": "..." }
  ```

  - Response: `200` → `{ "accessToken": "..." }`

- **Logout**  
  `POST /api/auth/logout`
  - Headers: `Authorization: Bearer <accessToken>`
  - Response: `204`

- **Forgot password**  
  `POST /api/auth/forgot-password`

  ```json
  { "email": "user@example.com" }
  ```

  - Response: `204` (no leak if email missing)

- **Reset password**  
  `POST /api/auth/reset-password`
  ```json
  { "userId": "<id>", "code": "123456", "newPassword": "min8chars" }
  ```

  - Response: `204`

---

## 2. Global Behaviour

### 2.1 Health

- `GET /health` → `200` `{ "status": "ok" }` (no auth).
- `GET /ready` → `200` `{ "status": "ok" }` when DB is ready; `503` `{ "status": "unavailable", "reason": "db" }` otherwise.

### 2.2 Errors

Error responses are JSON:

```json
{
  "code": "BAD_REQUEST",
  "message": "Human-readable message",
  "details": {},
  "traceId": "uuid"
}
```

Common `code` values: `NOT_FOUND` (404), `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `CONFLICT` (409), `UNPROCESSABLE` (422), `TOO_MANY_REQUESTS` (429), `INTERNAL_SERVER_ERROR` (500).

### 2.3 Pagination

List endpoints that support pagination accept query params:

- `page` — default `1`
- `limit` — default `20`, max `100`

Response shape:

```json
{
  "items": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### 2.4 Admin-only routes

Endpoints that require **admin** are marked below with **(Admin)**. Use a user with `role: "ADMIN"` and send the access token in `Authorization: Bearer <accessToken>`.

---

## 3. API Reference by Resource

### 3.1 Seasons

| Method | Path               | Auth               | Description              |
| ------ | ------------------ | ------------------ | ------------------------ |
| GET    | `/api/seasons`     | Bearer             | List seasons (paginated) |
| GET    | `/api/seasons/:id` | Bearer             | Get season by id         |
| POST   | `/api/seasons`     | Bearer **(Admin)** | Create season            |
| PUT    | `/api/seasons/:id` | Bearer **(Admin)** | Update season            |

**Query (list):** `page`, `limit`, `year`, `gender` (M|W), `isActive` (boolean).

**Create/update body:**  
`{ "name": "BVB World Tour", "year": 2025, "gender": "M"|"W", "isActive": true }`

---

### 3.2 Tournaments

| Method | Path                                    | Auth               | Description                  |
| ------ | --------------------------------------- | ------------------ | ---------------------------- |
| GET    | `/api/tournaments`                      | Bearer             | List tournaments (paginated) |
| GET    | `/api/tournaments/live`                 | Bearer             | List live tournaments        |
| GET    | `/api/tournaments/:id`                  | Bearer             | Get tournament by id         |
| POST   | `/api/tournaments`                      | Bearer **(Admin)** | Create tournament            |
| PUT    | `/api/tournaments/:id`                  | Bearer **(Admin)** | Update (only when UPCOMING)  |
| POST   | `/api/tournaments/:id/finalize`         | Bearer **(Admin)** | Finalize tournament          |
| POST   | `/api/tournaments/:id/force-lock`       | Bearer **(Admin)** | Force registration lock      |
| POST   | `/api/tournaments/:id/recompute`        | Bearer **(Admin)** | Trigger full recompute       |
| POST   | `/api/tournaments/:id/bracket/generate` | Bearer **(Admin)** | Generate bracket             |
| PUT    | `/api/tournaments/:id/price-params`     | Bearer **(Admin)** | Update price params          |

**Query (list):** `page`, `limit`, `seasonId`, `gender`, `status`.

**Create body:**  
`{ "seasonId", "name", "location", "gender", "startDate", "endDate", "lineupLockAt", "rosterSize?", "officialUrl?", "scoringTable?" }`  
Dates as ISO 8601 strings. `rosterSize` 4–30, default 7.

**Update body:** Same fields, all optional.

**Price params body:**  
`{ "priceVolatilityFactor?", "priceFloor?", "priceCap?" }` (numbers ≥ 0).

**Tournament status values:** `UPCOMING`, `REGISTRATION_LOCKED`, `LIVE`, `COMPLETED`, `FINALIZED`.

---

### 3.3 Players

| Method | Path                     | Auth               | Description                  |
| ------ | ------------------------ | ------------------ | ---------------------------- |
| GET    | `/api/players`           | Bearer             | List players (paginated)     |
| GET    | `/api/players/:id`       | Bearer             | Get player by id             |
| POST   | `/api/players`           | Bearer **(Admin)** | Create player                |
| PUT    | `/api/players/:id`       | Bearer **(Admin)** | Update player                |
| PUT    | `/api/players/:id/price` | Bearer **(Admin)** | Adjust price (market window) |

**Query (list):** `page`, `limit`, `gender`, `search`, `tournamentId`.

**Create body:**  
`{ "firstName", "lastName", "gender" ("M"|"W"), "nationality?", "federationId?" }`

**Adjust price body:**  
`{ "currentPrice": number >= 0 }`

---

### 3.4 Pairs

| Method | Path                           | Auth               | Description                     |
| ------ | ------------------------------ | ------------------ | ------------------------------- |
| GET    | `/api/pairs?tournamentId=<id>` | Bearer             | List pairs for tournament       |
| POST   | `/api/pairs?tournamentId=<id>` | Bearer **(Admin)** | Create pair                     |
| DELETE | `/api/pairs/:id`               | Bearer **(Admin)** | Delete pair (no matches played) |

**Create body:**  
`{ "player1Id", "player2Id" }`

---

### 3.5 Pools

| Method | Path                           | Auth               | Description                   |
| ------ | ------------------------------ | ------------------ | ----------------------------- |
| GET    | `/api/pools?tournamentId=<id>` | Bearer             | List pool groups with matches |
| POST   | `/api/pools?tournamentId=<id>` | Bearer **(Admin)** | Create pool group             |
| POST   | `/api/pools/:groupId/pairs`    | Bearer **(Admin)** | Assign pair to pool           |

**Create group body:**  
`{ "name", "gender" ("M"|"W") }`

**Assign pair body:**  
`{ "pairId" }`

---

### 3.6 Matches

| Method | Path                             | Auth               | Description               |
| ------ | -------------------------------- | ------------------ | ------------------------- |
| GET    | `/api/matches?tournamentId=<id>` | Bearer             | List matches (paginated)  |
| GET    | `/api/matches/:id`               | Bearer             | Get match by id           |
| POST   | `/api/matches`                   | Bearer **(Admin)** | Create match              |
| PUT    | `/api/matches/:id/score`         | Bearer **(Admin)** | Update score (correction) |
| POST   | `/api/matches/:id/live`          | Bearer **(Admin)** | Set match live            |
| POST   | `/api/matches/:id/complete`      | Bearer **(Admin)** | Complete match with score |

**Query (list):** `tournamentId` (required), `page`, `limit`, `phase`, `status`.

**Create body:**  
`{ "tournamentId", "phase", "scheduledAt", "bracketSlot?", "poolGroupId?", "poolRound?" }`  
`phase`: `QUALIFICATION` | `POOL` | `MAIN_R12` | `MAIN_QF` | `MAIN_SF` | `MAIN_FINAL` | `MAIN_3RD`.  
`scheduledAt` ISO 8601.

**Score body (update/complete):**  
`{ "sets": [ { "home": 21, "away": 15 }, ... ], "result": "WIN_2_0"|"WIN_2_1"|"LOSS_0_2"|"LOSS_1_2" }`  
`result` is from **home pair** perspective (WIN_2_0 = home won 2–0).

---

### 3.7 Brackets

| Method | Path                              | Auth   | Description                          |
| ------ | --------------------------------- | ------ | ------------------------------------ |
| GET    | `/api/brackets?tournamentId=<id>` | Bearer | Get bracket structure for tournament |

---

### 3.8 Scoring

| Method | Path                                                    | Auth   | Description             |
| ------ | ------------------------------------------------------- | ------ | ----------------------- |
| GET    | `/api/scoring/players?tournamentId=<id>&playerId=<id>?` | Bearer | Player score aggregates |
| GET    | `/api/scoring/standings/:leagueId`                      | Bearer | League standings        |

---

### 3.9 Team (user’s fantasy team per tournament)

Base path: `/api/tournaments/:tournamentId/team`  
`:tournamentId` in URL path.

| Method | Path                                  | Auth   | Description           |
| ------ | ------------------------------------- | ------ | --------------------- |
| GET    | `/api/tournaments/:tournamentId/team` | Bearer | Get my team           |
| PUT    | `/api/tournaments/:tournamentId/team` | Bearer | Create or update team |

**Set team body:**  
`{ "playerIds": [ "<playerId1>", ... ] }`  
Length must equal tournament’s `rosterSize` (default 7). Budget = sum of players’ `currentPrice`; wallet is debited.

---

### 3.10 Lineup (user’s lineup per tournament)

Base path: `/api/tournaments/:tournamentId/lineup`

| Method | Path                                         | Auth   | Description                  |
| ------ | -------------------------------------------- | ------ | ---------------------------- |
| GET    | `/api/tournaments/:tournamentId/lineup`      | Bearer | Get my lineup                |
| PUT    | `/api/tournaments/:tournamentId/lineup`      | Bearer | Set lineup (only when DRAFT) |
| POST   | `/api/tournaments/:tournamentId/lineup/lock` | Bearer | Lock lineup                  |

**Set lineup body:**  
`{ "starters": [ "<id1>", "<id2>", "<id3>", "<id4>" ], "reserves": [ "<id5>", "<id6>", "<id7>" ] }`  
Starters and reserves must be disjoint and all belong to the user’s team for that tournament.

---

### 3.11 Leagues

| Method | Path                         | Auth   | Description              |
| ------ | ---------------------------- | ------ | ------------------------ |
| GET    | `/api/leagues`               | Bearer | List leagues (paginated) |
| GET    | `/api/leagues/:id`           | Bearer | Get league by id         |
| GET    | `/api/leagues/:id/standings` | Bearer | Get league standings     |
| POST   | `/api/leagues`               | Bearer | Create league            |
| POST   | `/api/leagues/:id/join`      | Bearer | Join league              |
| PUT    | `/api/leagues/:id`           | Bearer | Update (owner or admin)  |

**Query (list):** `page`, `limit`, `tournamentId`, `isPublic`, `status`.

**Create body:**  
`{ "tournamentId", "name", "isPublic", "gameMode?" ("CLASSIC"|"HEAD_TO_HEAD"), "entryFee?", "maxMembers?" }`

**Join body:**  
`{ "inviteCode"? }` (required for private leagues).

**Update body:**  
`{ "name?", "isPublic?", "maxMembers?" }`

---

### 3.12 Wallet

| Method | Path                       | Auth   | Description                   |
| ------ | -------------------------- | ------ | ----------------------------- |
| GET    | `/api/wallet`              | Bearer | Get my wallet                 |
| GET    | `/api/wallet/transactions` | Bearer | List transactions (paginated) |

**Query (transactions):** `page`, `limit`.

---

### 3.13 Payments

| Method | Path                     | Auth   | Description                    |
| ------ | ------------------------ | ------ | ------------------------------ |
| GET    | `/api/payments/packs`    | Bearer | List credit packs              |
| POST   | `/api/payments/checkout` | Bearer | Create Stripe checkout session |

**Checkout body:**  
`{ "packId" }`  
Response typically includes a URL or session id for redirecting to Stripe Checkout.

**Note:** `POST /api/payments/stripe-webhook` is for Stripe only (raw body, signature verification); not for frontend.

---

### 3.14 Users

| Method | Path                     | Auth               | Description            |
| ------ | ------------------------ | ------------------ | ---------------------- |
| GET    | `/api/users/me`          | Bearer             | Get my profile         |
| PUT    | `/api/users/me`          | Bearer             | Update my profile      |
| PUT    | `/api/users/me/password` | Bearer             | Change password        |
| GET    | `/api/users`             | Bearer **(Admin)** | List users (paginated) |
| GET    | `/api/users/logs`        | Bearer **(Admin)** | Audit log              |
| PUT    | `/api/users/:id/block`   | Bearer **(Admin)** | Block/unblock user     |

**Query (list users):** `page`, `limit`, `search`.  
**Query (logs):** `page`, `limit`.

**Update profile body:**  
`{ "name"? }`

**Change password body:**  
`{ "oldPassword", "newPassword" }` (new min 8 chars).

**Block body:**  
`{ "blocked": true|false }`

---

## 4. WebSocket (live updates)

- **URL:** Same host as API, path ` /ws` (e.g. `ws://localhost:3000/ws`).
- **Subscribe to a league:** Send a JSON message:
  ```json
  { "type": "subscribe", "leagueId": "<leagueId>" }
  ```
- **Server → client events** (JSON):
  - `match_score_update` — `{ "type", "matchId", "sets", "result" }`
  - `athlete_points_update` — `{ "type", "playerId", "tournamentId", "totalPoints" }`
  - `team_points_update` — `{ "type", "userId", "leagueId", "totalPoints" }`
  - `standings_update` — `{ "type", "leagueId", "standings" }`
- Server sends ping periodically; client should respond with pong to keep connection alive.

---

## 5. Enums (reference)

- **Gender:** `M`, `W`
- **TournamentStatus:** `UPCOMING`, `REGISTRATION_LOCKED`, `LIVE`, `COMPLETED`, `FINALIZED`
- **MatchPhase:** `QUALIFICATION`, `POOL`, `MAIN_R12`, `MAIN_QF`, `MAIN_SF`, `MAIN_FINAL`, `MAIN_3RD`
- **MatchResult:** `WIN_2_0`, `WIN_2_1`, `LOSS_0_2`, `LOSS_1_2` (home pair perspective)
- **MatchStatus:** `SCHEDULED`, `LIVE`, `COMPLETED`, `CORRECTED`, `LOCKED`
- **LineupStatus:** `DRAFT`, `LOCKED`, `APPLIED`, `ARCHIVED`
- **LeagueStatus:** `REGISTRATION_OPEN`, `IN_PROGRESS`, `COMPLETED`
- **LeagueGameMode:** `CLASSIC`, `HEAD_TO_HEAD`
- **Role:** `USER`, `ADMIN`

---

## 6. Typical frontend flows

1. **Register → Verify → Login**  
   Register → store `userId` → show “Enter 6-digit code” → verify-email → login → store `accessToken` and `refreshToken`.

2. **Refresh token**  
   When API returns 401, call refresh with `refreshToken`; store new `accessToken`. If refresh fails, redirect to login.

3. **Build team**  
   GET tournaments (or live) → pick tournament → GET players (filter by tournament/gender) → PUT team with selected `playerIds`.

4. **Set lineup**  
   GET lineup for tournament → PUT lineup (starters 4, reserves 3) → optional POST lock before deadline.

5. **Leagues**  
   GET leagues (filter by tournament) → POST create or POST join (with inviteCode for private) → GET standings.

6. **Live**  
   Connect WebSocket → send `{ "type": "subscribe", "leagueId" }` → handle `standings_update` and other events.
