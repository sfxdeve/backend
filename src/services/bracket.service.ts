import type { ClientSession, Types } from "mongoose";
import { Match } from "../models/Match.js";
import { PoolGroup } from "../models/PoolGroup.js";
import type { MatchPhase } from "../models/enums.js";

// After a QUALIFICATION round-1 match completes, populate the round-2 match
async function advanceQualification(
  match: {
    _id: Types.ObjectId;
    tournamentId: Types.ObjectId;
    bracketSlot?: string;
    winnerId?: Types.ObjectId;
  },
  session: ClientSession,
): Promise<void> {
  if (!match.bracketSlot || !match.winnerId) return;

  // Slot format: Q{group}_R{round}_M{matchNum}
  // e.g. Q0_R1_M1 → winner goes into Q0_R2 as home or away
  const parts = match.bracketSlot.split("_");
  if (parts.length < 3) return;
  const [group, round] = parts;
  if (round !== "R1") return; // only round-1 triggers auto-gen

  const matchNum = parseInt(parts[2].replace("M", ""), 10);
  const r2Slot = `${group}_R2_M1`;

  const existing = await Match.findOne({
    tournamentId: match.tournamentId,
    bracketSlot: r2Slot,
  }).session(session);

  if (existing) {
    // Populate the missing pair slot
    const field = existing.homePairId ? "awayPairId" : "homePairId";
    await Match.updateOne(
      { _id: existing._id },
      { [field]: match.winnerId },
      { session },
    );
  } else {
    // Create the R2 match, winner from M1 is home, winner from M2 will be away
    const homeOrAway =
      matchNum % 2 === 1
        ? { homePairId: match.winnerId }
        : { awayPairId: match.winnerId };
    await Match.create(
      [
        {
          tournamentId: match.tournamentId,
          phase: "QUALIFICATION" as MatchPhase,
          bracketSlot: r2Slot,
          ...homeOrAway,
        },
      ],
      { session },
    );
  }
}

// After a POOL match completes, check if we need to create WINNERS/LOSERS or finalize pool
async function advancePool(
  match: {
    _id: Types.ObjectId;
    tournamentId: Types.ObjectId;
    poolGroupId?: Types.ObjectId;
    poolRound?: string;
    winnerId?: Types.ObjectId;
    loserId?: Types.ObjectId;
  },
  session: ClientSession,
): Promise<void> {
  if (!match.poolGroupId) return;

  if (match.poolRound === "INITIAL") {
    // Check if both initial matches in this pool are done
    const initials = await Match.find({
      tournamentId: match.tournamentId,
      poolGroupId: match.poolGroupId,
      poolRound: "INITIAL",
    })
      .session(session)
      .lean();

    if (initials.length === 2 && initials.every((m) => m.isCompleted)) {
      // Create WINNERS match (winner M1 vs winner M2)
      const [m1, m2] = initials;
      await Match.insertMany(
        [
          {
            tournamentId: match.tournamentId,
            phase: "POOL" as MatchPhase,
            poolGroupId: match.poolGroupId,
            poolRound: "WINNERS",
            homePairId: m1.winnerId,
            awayPairId: m2.winnerId,
          },
          {
            tournamentId: match.tournamentId,
            phase: "POOL" as MatchPhase,
            poolGroupId: match.poolGroupId,
            poolRound: "LOSERS",
            homePairId: m1.loserId,
            awayPairId: m2.loserId,
          },
        ],
        { session },
      );
    }
  } else if (match.poolRound === "WINNERS" || match.poolRound === "LOSERS") {
    // Check if both WINNERS and LOSERS matches are done → finalize pool ranks
    const [winners, losers] = await Promise.all([
      Match.findOne({
        tournamentId: match.tournamentId,
        poolGroupId: match.poolGroupId,
        poolRound: "WINNERS",
      })
        .session(session)
        .lean(),
      Match.findOne({
        tournamentId: match.tournamentId,
        poolGroupId: match.poolGroupId,
        poolRound: "LOSERS",
      })
        .session(session)
        .lean(),
    ]);

    if (winners?.isCompleted && losers?.isCompleted) {
      // Rank: 1=winners.winner, 2=winners.loser, 3=losers.winner, 4=losers.loser
      const poolGroup = await PoolGroup.findById(match.poolGroupId).session(
        session,
      );
      if (!poolGroup) return;

      const rankMap = new Map([
        [String(winners.winnerId), 1],
        [String(winners.loserId), 2],
        [String(losers.winnerId), 3],
        [String(losers.loserId), 4],
      ]);

      for (const slot of poolGroup.slots) {
        if (slot.pairId) {
          const rank = rankMap.get(String(slot.pairId));
          if (rank !== undefined) slot.finalRank = rank;
        }
      }
      await poolGroup.save({ session });

      // Check if ALL pools are done
      await checkAllPoolsDone(match.tournamentId, session);
    }
  }
}

async function checkAllPoolsDone(
  tournamentId: Types.ObjectId,
  session: ClientSession,
): Promise<void> {
  const pools = await PoolGroup.find({ tournamentId }).session(session).lean();
  const allDone = pools.every((p) => p.slots.every((s) => s.finalRank != null));
  if (!allDone || pools.length !== 4) return;

  // Collect rankings
  const byRank = new Map<number, Types.ObjectId[]>();
  for (const pool of pools) {
    for (const slot of pool.slots as {
      pairId: Types.ObjectId;
      finalRank: number;
    }[]) {
      if (!byRank.has(slot.finalRank)) byRank.set(slot.finalRank, []);
      byRank.get(slot.finalRank)!.push(slot.pairId);
    }
  }

  const firstPlace = byRank.get(1) ?? []; // 4 pairs → get byes to QF
  const secondThird = [...(byRank.get(2) ?? []), ...(byRank.get(3) ?? [])]; // 8 pairs → R12

  // Assign 1st-place teams directly to QF slots (bye)
  const qfSlots = ["QF1", "QF2"];
  const qfSides = ["home", "away"];
  for (let i = 0; i < firstPlace.length && i < 4; i++) {
    const slotIndex = Math.floor(i / 2);
    const side = qfSides[i % 2];
    const slot = qfSlots[slotIndex];
    if (!slot) continue;

    const field = side === "home" ? "homePairId" : "awayPairId";
    await Match.findOneAndUpdate(
      { tournamentId, bracketSlot: slot },
      { $set: { [field]: firstPlace[i] } },
      { upsert: true, new: true, session },
    );
  }

  // Create pending R12 slots for 2nd+3rd place teams (admin will assign matchups)
  for (let i = 0; i < secondThird.length; i++) {
    const slotNum = Math.floor(i / 2) + 1;
    const side = i % 2 === 0 ? "home" : "away";
    const slot = `R12_M${slotNum}`;
    const field = side === "home" ? "homePairId" : "awayPairId";

    await Match.findOneAndUpdate(
      { tournamentId, bracketSlot: slot },
      { $set: { [field]: secondThird[i] } },
      { upsert: true, new: true, session, setDefaultsOnInsert: true },
    );
    // Set phase on new docs
    await Match.updateOne(
      { tournamentId, bracketSlot: slot, phase: { $exists: false } },
      { $set: { phase: "MAIN_R12" as MatchPhase } },
      { session },
    );
  }
}

// After R12 completes, winner goes to QF based on homeFedFrom/awayFedFrom on the target QF match
async function advanceMainDraw(
  match: {
    _id: Types.ObjectId;
    tournamentId: Types.ObjectId;
    bracketSlot?: string;
    phase: string;
    winnerId?: Types.ObjectId;
    loserId?: Types.ObjectId;
  },
  session: ClientSession,
): Promise<void> {
  if (!match.bracketSlot || !match.winnerId) return;

  const currentSlot = match.bracketSlot;
  const winnerRef = `${currentSlot}.winner`;
  const loserRef = `${currentSlot}.loser`;

  // Find any match that is waiting for this slot's winner or loser
  const nextMatches = await Match.find({
    tournamentId: match.tournamentId,
    $or: [{ homeFedFrom: winnerRef }, { awayFedFrom: winnerRef }],
  })
    .session(session)
    .lean();

  for (const next of nextMatches) {
    const field = next.homeFedFrom === winnerRef ? "homePairId" : "awayPairId";
    await Match.updateOne(
      { _id: next._id },
      { [field]: match.winnerId },
      { session },
    );
  }

  // SF losers → 3RD place match
  if (match.phase === "MAIN_SF" && match.loserId) {
    const loserMatches = await Match.find({
      tournamentId: match.tournamentId,
      $or: [{ homeFedFrom: loserRef }, { awayFedFrom: loserRef }],
    })
      .session(session)
      .lean();

    for (const next of loserMatches) {
      const field = next.homeFedFrom === loserRef ? "homePairId" : "awayPairId";
      await Match.updateOne(
        { _id: next._id },
        { [field]: match.loserId },
        { session },
      );
    }

    // Also create the 3RD place match if not already created
    const existing3rd = await Match.findOne({
      tournamentId: match.tournamentId,
      bracketSlot: "3RD",
    }).session(session);

    if (!existing3rd) {
      await Match.create(
        [
          {
            tournamentId: match.tournamentId,
            phase: "MAIN_3RD" as MatchPhase,
            bracketSlot: "3RD",
          },
        ],
        { session },
      );
    }
  }

  // SF winners → create FINAL if not already created
  if (match.phase === "MAIN_SF") {
    const sfMatches = await Match.find({
      tournamentId: match.tournamentId,
      phase: "MAIN_SF",
      isCompleted: true,
    })
      .session(session)
      .lean();

    if (sfMatches.length === 2) {
      const existingFinal = await Match.findOne({
        tournamentId: match.tournamentId,
        bracketSlot: "FINAL",
      }).session(session);

      if (!existingFinal) {
        await Match.create(
          [
            {
              tournamentId: match.tournamentId,
              phase: "MAIN_FINAL" as MatchPhase,
              bracketSlot: "FINAL",
              homePairId: sfMatches[0].winnerId,
              awayPairId: sfMatches[1].winnerId,
            },
          ],
          { session },
        );
      }
    }
  }
}

export async function advanceBracket(
  matchId: string,
  session: ClientSession,
): Promise<void> {
  const match = await Match.findById(matchId).session(session).lean();
  if (!match || !match.isCompleted) return;

  switch (match.phase) {
    case "QUALIFICATION":
      await advanceQualification(
        match as Parameters<typeof advanceQualification>[0],
        session,
      );
      break;
    case "POOL":
      await advancePool(match as Parameters<typeof advancePool>[0], session);
      break;
    case "MAIN_R12":
    case "MAIN_QF":
    case "MAIN_SF":
      await advanceMainDraw(
        match as Parameters<typeof advanceMainDraw>[0],
        session,
      );
      break;
    case "MAIN_FINAL":
    case "MAIN_3RD":
      // Tournament complete — no further advancement
      break;
  }
}

export interface GetBracketResult {
  qualification: Array<{
    group: string;
    matches: Record<string, unknown>[];
  }>;
  pools: Array<
    Record<string, unknown> & { matches: Record<string, unknown>[] }
  >;
  mainDraw: {
    r12: Record<string, unknown>[];
    quarterfinals: Record<string, unknown>[];
    semifinals: Record<string, unknown>[];
    final: Record<string, unknown> | null;
    thirdPlace: Record<string, unknown> | null;
  };
}

export async function getBracket(
  tournamentId: string,
): Promise<GetBracketResult> {
  const [matches, pools] = await Promise.all([
    Match.find({ tournamentId })
      .populate({
        path: "homePairId",
        populate: [
          { path: "player1Id", select: "firstName lastName" },
          { path: "player2Id", select: "firstName lastName" },
        ],
      })
      .populate({
        path: "awayPairId",
        populate: [
          { path: "player1Id", select: "firstName lastName" },
          { path: "player2Id", select: "firstName lastName" },
        ],
      })
      .lean(),
    PoolGroup.find({ tournamentId })
      .populate({
        path: "slots.pairId",
        populate: [
          { path: "player1Id", select: "firstName lastName" },
          { path: "player2Id", select: "firstName lastName" },
        ],
      })
      .sort({ poolIndex: 1 })
      .lean(),
  ]);

  const qualMatches = matches.filter((m) => m.phase === "QUALIFICATION");
  const qualGroups = new Map<string, typeof qualMatches>();
  for (const m of qualMatches) {
    const slot = m.bracketSlot ?? "";
    const group = slot.split("_")[0] ?? "Q0";
    if (!qualGroups.has(group)) qualGroups.set(group, []);
    qualGroups.get(group)!.push(m);
  }
  const qualification = Array.from(qualGroups.entries()).map(
    ([group, groupMatches]) => ({
      group,
      matches: groupMatches
        .sort((a, b) =>
          (a.bracketSlot ?? "").localeCompare(b.bracketSlot ?? ""),
        )
        .map((m) => m as unknown as Record<string, unknown>),
    }),
  );

  const poolPhaseMatches = matches.filter((m) => m.phase === "POOL");
  const poolsWithMatches = pools.map((pool) => ({
    ...pool,
    matches: poolPhaseMatches
      .filter((m) => String(m.poolGroupId) === String(pool._id))
      .map((m) => m as unknown as Record<string, unknown>),
  })) as GetBracketResult["pools"];

  const byPhase = (phase: string) =>
    matches
      .filter((m) => m.phase === phase)
      .sort((a, b) => (a.bracketSlot ?? "").localeCompare(b.bracketSlot ?? ""))
      .map((m) => m as unknown as Record<string, unknown>);

  return {
    qualification,
    pools: poolsWithMatches,
    mainDraw: {
      r12: byPhase("MAIN_R12"),
      quarterfinals: byPhase("MAIN_QF"),
      semifinals: byPhase("MAIN_SF"),
      final: byPhase("MAIN_FINAL")[0] ?? null,
      thirdPlace: byPhase("MAIN_3RD")[0] ?? null,
    },
  };
}
