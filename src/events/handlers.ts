import mongoose from "mongoose";
import { appEmitter } from "./emitter.js";
import { onMatchUpdated } from "../services/recompute.service.js";
import { broadcast } from "../ws/index.js";
import { getLeagueStandings } from "../services/scoring.service.js";
import { Tournament } from "../models/Tournament.js";
import { Player } from "../models/Player.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { logger } from "../lib/logger.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

appEmitter.on("match:updated", async (payload) => {
  try {
    const result = await onMatchUpdated(
      payload.matchId,
      payload.tournamentId,
      payload.versionNumber,
    );
    if (result.leagueIds.length === 0) return;

    let playerTotals: Map<string, number> = new Map();
    if (result.playerIds?.length && result.tournamentId) {
      const agg = await PlayerScore.aggregate([
        {
          $match: {
            tournamentId: new mongoose.Types.ObjectId(result.tournamentId),
          },
        },
        { $group: { _id: "$playerId", totalPoints: { $sum: "$totalPoints" } } },
      ]);
      for (const row of agg) {
        playerTotals.set(row._id.toString(), row.totalPoints as number);
      }
    }

    for (const leagueId of result.leagueIds) {
      if (result.matchInfo) {
        broadcast(leagueId, {
          type: "match_score_update",
          matchId: result.matchInfo.matchId,
          sets: result.matchInfo.sets,
          result: result.matchInfo.result,
        });
      }
      if (result.playerIds && result.tournamentId) {
        for (const playerId of result.playerIds) {
          const totalPoints = playerTotals.get(playerId) ?? 0;
          broadcast(leagueId, {
            type: "athlete_points_update",
            playerId,
            tournamentId: result.tournamentId,
            totalPoints,
          });
        }
      }
      const standings = await getLeagueStandings(leagueId);
      for (const member of standings) {
        const userId =
          (member.userId as { _id: unknown })._id?.toString() ?? "";
        broadcast(leagueId, {
          type: "team_points_update",
          userId,
          leagueId,
          totalPoints: member.totalPoints ?? 0,
        });
      }
      broadcast(leagueId, {
        type: "standings_update",
        leagueId,
        standings,
      });
    }
  } catch (e) {
    logger.error({ err: e, payload }, "match:updated handler failed");
  }
});

appEmitter.on("tournament:finalized", async (payload) => {
  try {
    const tournament = await Tournament.findById(payload.tournamentId).lean();
    if (!tournament || tournament.marketWindowOpen) return;

    const volatility = tournament.priceVolatilityFactor ?? 1;
    const floor = tournament.priceFloor ?? 10;
    const cap = tournament.priceCap ?? 200;
    const maxChangePct = 0.15;

    const tournamentIdObj = new mongoose.Types.ObjectId(payload.tournamentId);
    const scores = await PlayerScore.aggregate([
      { $match: { tournamentId: tournamentIdObj } },
      { $group: { _id: "$playerId", totalPoints: { $sum: "$totalPoints" } } },
    ]);

    for (const row of scores) {
      const player = await Player.findById(row._id);
      if (!player) continue;
      const oldPrice = player.currentPrice ?? 100;
      const movingAvg = player.movingAveragePoints ?? 0;
      const tournamentPoints = row.totalPoints as number;
      const delta = volatility * (tournamentPoints - movingAvg);
      let newPrice = Math.round(oldPrice + delta);
      const maxChange = oldPrice * maxChangePct;
      newPrice = clamp(newPrice, oldPrice - maxChange, oldPrice + maxChange);
      newPrice = clamp(newPrice, floor, cap);

      player.currentPrice = newPrice;
      const n = 1; // simple: just this tournament in average
      player.movingAveragePoints =
        (player.movingAveragePoints ?? 0) * (1 - 1 / (n + 1)) +
        tournamentPoints / (n + 1);
      await player.save();
    }

    await Tournament.updateOne(
      { _id: payload.tournamentId },
      { $set: { marketWindowOpen: true } },
    );
  } catch (e) {
    logger.error({ err: e, payload }, "tournament:finalized handler failed");
  }
});

export function registerEventHandlers(): void {
  // Handlers registered above via appEmitter.on()
}
