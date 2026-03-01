/**
 * Generates Postman collection and environment from a single source of truth.
 * Collection depends entirely on the environment for all variables.
 * Run: node scripts/generate-postman-collection.js
 *
 * All URLs use string form {{baseUrl}}{{apiPrefix}}/... to avoid double-slash issues.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const postmanDir = join(__dirname, "..", "postman");

// Single source of truth for all variables (collection has none; env provides all)
const ENV_VARS = [
  { key: "baseUrl", value: "http://localhost:5555", type: "default" },
  { key: "apiPrefix", value: "/api/v1", type: "default" },
  { key: "accessToken", value: "", type: "secret" },
  { key: "adminEmail", value: "admin@fantabeach.io", type: "default" },
  { key: "adminPassword", value: "CHANGE_ME_IN_PRODUCTION", type: "secret" },
  { key: "championshipId", value: "", type: "default" },
  { key: "tournamentId", value: "", type: "default" },
  { key: "leagueId", value: "", type: "default" },
  { key: "pairId", value: "", type: "default" },
  { key: "pairAId", value: "", type: "default" },
  { key: "pairBId", value: "", type: "default" },
  { key: "matchId", value: "", type: "default" },
  { key: "athleteId", value: "", type: "default" },
  { key: "athleteId1", value: "", type: "default" },
  { key: "athleteId2", value: "", type: "default" },
  { key: "athleteAId", value: "", type: "default" },
  { key: "athleteBId", value: "", type: "default" },
  { key: "creditPackId", value: "", type: "default" },
  { key: "packId", value: "", type: "default" },
  { key: "userId", value: "", type: "default" },
  { key: "stripeSignature", value: "", type: "secret" },
];

const collection = {
  info: {
    name: "Fantabeach API",
    description:
      "Fantabeach backend API – auth, championships, tournaments, matches, leagues, fantasy teams, credits, admin. Requires Fantabeach Local (or compatible) environment.",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
  },
  item: [
    {
      name: "Health",
      item: [
        {
          name: "Health",
          request: {
            auth: { type: "noauth" },
            method: "GET",
            header: [],
            url: "{{baseUrl}}/health",
          },
        },
        {
          name: "Ready",
          request: {
            auth: { type: "noauth" },
            method: "GET",
            header: [],
            url: "{{baseUrl}}/ready",
          },
        },
      ],
    },
    {
      name: "Auth",
      item: [
        {
          name: "Register",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "name": "Test User",\n  "email": "user@example.com",\n  "password": "password123"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/auth/register",
          },
        },
        {
          name: "Verify Email",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "email": "{{adminEmail}}",\n  "code": "123456"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/auth/verify-email",
          },
        },
        {
          name: "Login",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "const res = pm.response.json();",
                  "if (res.success && res.data && res.data.accessToken) {",
                  "  pm.environment.set('accessToken', res.data.accessToken);",
                  "}",
                ],
                type: "text/javascript",
              },
            },
          ],
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "email": "{{adminEmail}}",\n  "password": "{{adminPassword}}"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/auth/login",
          },
        },
        {
          name: "Refresh (uses cookie)",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/auth/refresh",
          },
        },
        {
          name: "Logout",
          request: {
            method: "POST",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/auth/logout",
          },
        },
        {
          name: "Forgot Password",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "email": "{{adminEmail}}"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/auth/forgot-password",
          },
        },
        {
          name: "Reset Password",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "email": "{{adminEmail}}",\n  "code": "123456",\n  "password": "newpassword123"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/auth/reset-password",
          },
        },
      ],
    },
    {
      name: "Championships",
      item: [
        {
          name: "List Championships",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/championships",
          },
        },
        {
          name: "Create Championship",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "name": "World Tour 2025",\n  "gender": "M",\n  "seasonYear": 2025\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/championships",
          },
        },
        {
          name: "Get Championship",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/championships/{{championshipId}}",
          },
        },
        {
          name: "Update Championship",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "name": "World Tour 2025 Updated",\n  "gender": "M",\n  "seasonYear": 2025\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/championships/{{championshipId}}",
          },
        },
      ],
    },
    {
      name: "Athletes",
      item: [
        {
          name: "List Athletes",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/athletes?championshipId={{championshipId}}&gender=M&page=1&limit=20",
          },
        },
        {
          name: "Create Athlete",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "firstName": "John",\n  "lastName": "Doe",\n  "gender": "M",\n  "championshipId": "{{championshipId}}",\n  "entryPoints": 0,\n  "globalPoints": 0,\n  "fantacoinCost": 0\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/athletes",
          },
        },
        {
          name: "Get Athlete",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/athletes/{{athleteId}}",
          },
        },
        {
          name: "Update Athlete",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "firstName": "John",\n  "lastName": "Doe Updated"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/athletes/{{athleteId}}",
          },
        },
      ],
    },
    {
      name: "Tournaments",
      item: [
        {
          name: "List Tournaments",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments?championshipId={{championshipId}}&status=UPCOMING&page=1&limit=20",
          },
        },
        {
          name: "Create Tournament",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "championshipId": "{{championshipId}}",\n  "location": "Rome",\n  "startDate": "2025-05-01T00:00:00.000Z",\n  "endDate": "2025-05-07T00:00:00.000Z"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/tournaments",
          },
        },
        {
          name: "Get Tournament",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}",
          },
        },
        {
          name: "Update Tournament",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "location": "Rome, Italy",\n  "status": "REGISTRATION_OPEN"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}",
          },
        },
        {
          name: "Get Pairs",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/pairs",
          },
        },
        {
          name: "Add Pair",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "athleteAId": "{{athleteAId}}",\n  "athleteBId": "{{athleteBId}}",\n  "entryStatus": "DIRECT",\n  "seedRank": 1\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/pairs",
          },
        },
        {
          name: "Remove Pair",
          request: {
            method: "DELETE",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/pairs/{{pairId}}",
          },
        },
        {
          name: "Lock Lineups",
          request: {
            method: "POST",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/lock",
          },
        },
        {
          name: "Get Bracket",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/bracket",
          },
        },
        {
          name: "Get Results",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/tournaments/{{tournamentId}}/results",
          },
        },
      ],
    },
    {
      name: "Matches",
      item: [
        {
          name: "List Matches",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/matches?tournamentId={{tournamentId}}&round=POOL&status=SCHEDULED",
          },
        },
        {
          name: "Create Match",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "tournamentId": "{{tournamentId}}",\n  "round": "POOL",\n  "pairAId": "{{pairAId}}",\n  "pairBId": "{{pairBId}}"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/matches",
          },
        },
        {
          name: "Get Match",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/matches/{{matchId}}",
          },
        },
        {
          name: "Update Match",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "set1A": 21,\n  "set1B": 18,\n  "set2A": 21,\n  "set2B": 19,\n  "winnerPairId": "{{pairId}}",\n  "status": "COMPLETED"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/matches/{{matchId}}",
          },
        },
      ],
    },
    {
      name: "Leagues",
      item: [
        {
          name: "List Leagues",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/leagues?type=PUBLIC&status=OPEN&championshipId={{championshipId}}&page=1&limit=20",
          },
        },
        {
          name: "Create League",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "name": "My League",\n  "type": "PUBLIC",\n  "championshipId": "{{championshipId}}",\n  "rankingMode": "OVERALL",\n  "rosterSize": 8,\n  "startersPerGameweek": 6,\n  "initialBudget": 100,\n  "marketEnabled": false\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/leagues",
          },
        },
        {
          name: "Get League",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}",
          },
        },
        {
          name: "Join League",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "teamName": "My Fantasy Team",\n  "inviteCode": ""\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/join",
          },
        },
        {
          name: "Get Standings",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/standings?tournamentId={{tournamentId}}",
          },
        },
      ],
    },
    {
      name: "Fantasy Teams",
      item: [
        {
          name: "Get My Team",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/team",
          },
        },
        {
          name: "Submit Roster",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "athleteIds": ["{{athleteId1}}", "{{athleteId2}}"]\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/team",
          },
        },
        {
          name: "Update Roster",
          request: {
            method: "PATCH",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "sell": [],\n  "buy": []\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/team",
          },
        },
        {
          name: "Get Lineup",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/team/lineup/{{tournamentId}}",
          },
        },
        {
          name: "Submit Lineup",
          request: {
            method: "PUT",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "slots": [\n    { "athleteId": "{{athleteId}}", "role": "STARTER" },\n    { "athleteId": "{{athleteId2}}", "role": "BENCH", "benchOrder": 1 }\n  ]\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/leagues/{{leagueId}}/team/lineup/{{tournamentId}}",
          },
        },
      ],
    },
    {
      name: "Credits",
      item: [
        {
          name: "List Credit Packs",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/credits/packs",
          },
        },
        {
          name: "Create Checkout",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "creditPackId": "{{creditPackId}}"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/credits/checkout",
          },
        },
        {
          name: "Get Wallet",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/credits/wallet?page=1&limit=20",
          },
        },
        {
          name: "Create Pack (Admin)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "name": "Starter Pack",\n  "credits": 100,\n  "stripePriceId": "price_xxx",\n  "active": true\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/credits/admin/packs",
          },
        },
        {
          name: "Toggle Pack (Admin)",
          request: {
            method: "PATCH",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/credits/admin/packs/{{packId}}",
          },
        },
        {
          name: "Grant Credits (Admin)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: '{\n  "userId": "{{userId}}",\n  "amount": 50,\n  "reason": "Bonus"\n}',
            },
            url: "{{baseUrl}}{{apiPrefix}}/credits/admin/grant",
          },
        },
      ],
    },
    {
      name: "Credits Webhook",
      item: [
        {
          name: "Stripe Webhook",
          request: {
            auth: { type: "noauth" },
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Stripe-Signature", value: "{{stripeSignature}}" },
            ],
            body: { mode: "raw", raw: "{}" },
            url: "{{baseUrl}}{{apiPrefix}}/credits/webhook",
          },
        },
      ],
    },
    {
      name: "Admin",
      item: [
        {
          name: "Audit Log",
          request: {
            method: "GET",
            header: [],
            url: "{{baseUrl}}{{apiPrefix}}/admin/audit-log?adminId=&entity=&from=&to=&page=1&limit=20",
          },
        },
      ],
    },
  ],
};

const environment = {
  id: "fantabeach-local-env",
  name: "Fantabeach Local",
  values: ENV_VARS.map(({ key, value, type }) => ({
    key,
    value,
    type: type || "default",
    enabled: true,
  })),
  _postman_variable_scope: "environment",
};

writeFileSync(
  join(postmanDir, "Fantabeach API.postman_collection.json"),
  JSON.stringify(collection, null, 2),
  "utf8",
);
writeFileSync(
  join(postmanDir, "Fantabeach Local.postman_environment.json"),
  JSON.stringify(environment, null, 2),
  "utf8",
);
console.log("Wrote postman/Fantabeach API.postman_collection.json");
console.log("Wrote postman/Fantabeach Local.postman_environment.json");
