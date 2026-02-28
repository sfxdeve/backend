import cron from "node-cron";
import { Tournament } from "../models/Tournament.js";
import { TournamentStatus } from "../models/enums.js";
import { appEmitter } from "../events/emitter.js";
import * as lineupsService from "../services/lineups.service.js";
import { logger } from "../lib/logger.js";

export function startLineupLockJob(): void {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const tournaments = await Tournament.find({
        lineupLockAt: { $lte: now },
        status: TournamentStatus.UPCOMING,
      })
        .select("_id")
        .lean();

      for (const t of tournaments) {
        const tournamentId = t._id.toString();
        await lineupsService.lockAllForTournament(tournamentId);
        await Tournament.updateOne(
          { _id: tournamentId },
          { $set: { status: TournamentStatus.REGISTRATION_LOCKED } },
        );
        appEmitter.emit("tournament:locked", { tournamentId });
        logger.info({ tournamentId }, "Lineups auto-locked for tournament");
      }
    } catch (e) {
      logger.error({ err: e }, "Lineup lock job failed");
    }
  });
  logger.info("Lineup auto-lock cron job started (hourly)");
}
