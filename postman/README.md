# Postman Collection & Environment

## Import

1. Open Postman → **Import** → drag or select:
   - `FantaBeach-API.postman_collection.json`
   - `FantaBeach.postman_environment.json`
2. Select the **FantaBeach Local** environment in the top-right dropdown.

## Setup

1. **Base URL** — In the environment, `baseUrl` is set to `http://localhost:3000`. Change it if your backend runs elsewhere.
2. **Auth** — Run **Auth → Login** with valid credentials. The request’s test script will set `accessToken`, `refreshToken`, and `userId` in the environment. Other requests use `Authorization: Bearer {{accessToken}}` (collection-level auth).
3. **IDs** — After creating or listing resources, copy IDs (e.g. `seasonId`, `tournamentId`, `leagueId`) into the environment so linked requests (Team, Lineup, Matches, etc.) work.

## Collection structure

- **Health** — `/health`, `/ready` (no auth).
- **Auth** — Register, verify email, login, refresh, logout, forgot/reset password.
- **Seasons** — List, get, create, update (admin).
- **Tournaments** — List, live, get, create, update, finalize, force-lock, recompute, bracket, price params.
- **Players** — List, get, create, update, adjust price (admin).
- **Pairs** — List (by tournament), create, delete (admin).
- **Pools** — List, create group, assign pair (admin).
- **Matches** — List, get, create, update score, set live, complete (admin).
- **Brackets** — Get bracket by tournament.
- **Scoring** — Player scores, league standings.
- **Team** — Get/set team for a tournament (path includes `tournamentId`).
- **Lineup** — Get/set/lock lineup for a tournament.
- **Leagues** — List, get, standings, create, join, update.
- **Wallet** — Get wallet, list transactions.
- **Payments** — List packs, create checkout.
- **Users** — Profile, password, (admin) list, logs, block.

Requests marked **(Admin)** require a user with role `ADMIN`.
