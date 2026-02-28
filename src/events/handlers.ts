import mongoose from "mongoose";
import { appEmitter } from "./emitter.js";
import { onMatchUpdated } from "../services/recompute.service.js";
import { broadcast } from "../ws/index.js";
import { getLeagueStandings } from "../services/scoring.service.js";
import { Tournament } from "../models/Tournament.js";
import { Player } from "../models/Player.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { League } from "../models/League.js";
import { LeagueMember } from "../models/LeagueMember.js";
import { AuditLog } from "../models/AuditLog.js";
import { createNotification } from "../services/notifications.service.js";
import { AuditLogType, NotificationType } from "../models/enums.js";
import { sendAlert } from "../lib/alerts.js";
import { computeNewPrice } from "../scoring/price-engine.js";
import { logger } from "../lib/logger.js";

// ─── match:updated ──────────────────────────────────────────────────────────

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

    // Notify affected users of match result (best-effort)
    if (result.tournamentId && result.leagueIds.length > 0) {
      for (const leagueId of result.leagueIds) {
        const members = await LeagueMember.find(
          { leagueId: new mongoose.Types.ObjectId(leagueId) },
          { userId: 1 },
        ).lean();
        for (const member of members) {
          await createNotification(
            member.userId.toString(),
            NotificationType.MATCH_RESULT,
            {
              matchId: result.matchInfo?.matchId,
              tournamentId: result.tournamentId,
            },
          ).catch(() => {});
        }
      }
    }
  } catch (e) {
    logger.error({ err: e, payload }, "match:updated handler failed");
    await sendAlert(
      "match:updated handler error",
      `matchId=${payload.matchId} tournamentId=${payload.tournamentId} error=${String(e)}`,
    ).catch(() => {});
  }
});

// ─── tournament:locked ───────────────────────────────────────────────────────

appEmitter.on("tournament:locked", async (payload) => {
  try {
    await AuditLog.create({
      type: AuditLogType.ADMIN_ACTION,
      entity: "Tournament",
      entityId: new mongoose.Types.ObjectId(payload.tournamentId),
      tournamentId: new mongoose.Types.ObjectId(payload.tournamentId),
      by: "system",
      meta: { action: "registration_locked" },
    });
  } catch (e) {
    logger.error({ err: e, payload }, "tournament:locked handler failed");
  }
});

// ─── lineup:locked ───────────────────────────────────────────────────────────

appEmitter.on("lineup:locked", async (payload) => {
  try {
    await AuditLog.create({
      type: AuditLogType.LINEUP_LOCKED,
      entity: "Lineup",
      entityId: new mongoose.Types.ObjectId(payload.lineupId),
      tournamentId: new mongoose.Types.ObjectId(payload.tournamentId),
      by: "system",
      meta: { userId: payload.userId },
    });

    await createNotification(payload.userId, NotificationType.LINEUP_LOCKED, {
      tournamentId: payload.tournamentId,
    }).catch(() => {});
  } catch (e) {
    logger.error({ err: e, payload }, "lineup:locked handler failed");
  }
});

// ─── tournament:finalized ────────────────────────────────────────────────────

appEmitter.on("tournament:finalized", async (payload) => {
  try {
    const tournament = await Tournament.findById(payload.tournamentId).lean();
    if (!tournament || tournament.marketWindowOpen) return;

    const volatility = tournament.priceVolatilityFactor ?? 1;
    const floor = tournament.priceFloor ?? 10;
    const cap = tournament.priceCap ?? 200;

    const tournamentIdObj = new mongoose.Types.ObjectId(payload.tournamentId);
    const scores = await PlayerScore.aggregate([
      { $match: { tournamentId: tournamentIdObj } },
      { $group: { _id: "$playerId", totalPoints: { $sum: "$totalPoints" } } },
    ]);

    for (const row of scores) {
      const player = await Player.findById(row._id);
      if (!player) continue;
      const { newPrice, newMovingAverage } = computeNewPrice({
        oldPrice: player.currentPrice ?? 100,
        tournamentPoints: row.totalPoints as number,
        movingAveragePoints: player.movingAveragePoints ?? 0,
        volatility,
        floor,
        cap,
      });
      player.currentPrice = newPrice;
      player.movingAveragePoints = newMovingAverage;
      await player.save();
    }

    await Tournament.updateOne(
      { _id: payload.tournamentId },
      { $set: { marketWindowOpen: true } },
    );

    // Notify all league members of finalization (best-effort)
    const leagues = await League.find(
      { tournamentId: tournamentIdObj },
      { _id: 1 },
    ).lean();
    for (const league of leagues) {
      const members = await LeagueMember.find(
        { leagueId: league._id },
        { userId: 1 },
      ).lean();
      for (const member of members) {
        await createNotification(
          member.userId.toString(),
          NotificationType.TOURNAMENT_FINALIZED,
          { tournamentId: payload.tournamentId },
        ).catch(() => {});
      }
    }
  } catch (e) {
    logger.error({ err: e, payload }, "tournament:finalized handler failed");
    await sendAlert(
      "tournament:finalized handler error",
      `tournamentId=${payload.tournamentId} error=${String(e)}`,
    ).catch(() => {});
  }
});
