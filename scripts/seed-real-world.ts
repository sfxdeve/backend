import {
  Gender,
  MatchRound,
  MatchSide,
  MatchStatus,
  TournamentStatus,
} from "../src/prisma/generated/enums.js";
import { prisma } from "../src/prisma/index.js";
import { computeAthletePrice } from "../src/lib/pricing.js";

type SeedAthlete = {
  id: string;
  firstName: string;
  lastName: string;
  rank: number;
};

type SeedTournament = {
  id: string;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  lineupLockAt: Date;
};

type SeedMatch = {
  id: string;
  tournamentId: string;
  round: MatchRound;
  status: MatchStatus;
  scheduledAt: Date;
  sideAAthlete1Id: string;
  sideAAthlete2Id: string;
  sideBAthlete1Id: string;
  sideBAthlete2Id: string;
  set1A?: number;
  set1B?: number;
  set2A?: number;
  set2B?: number;
  set3A?: number;
  set3B?: number;
  winnerSide?: MatchSide;
};

const CHAMPIONSHIP = {
  id: "f6f4ca54-87bd-4a8d-93c8-c585c662114a",
  name: "Volleyball World Beach Pro Tour",
  gender: Gender.MALE,
  seasonYear: 2026,
};

const ATHLETES: SeedAthlete[] = [
  {
    id: "8d24ce29-bc4e-4c4d-a2ab-1d4761e80730",
    firstName: "Anders",
    lastName: "Mol",
    rank: 1,
  },
  {
    id: "1a347d5d-15ab-42b7-a388-f2ee8f7627f1",
    firstName: "Christian",
    lastName: "Sorum",
    rank: 2,
  },
  {
    id: "82af83fe-adbc-4600-88f5-cd6bd4deca3e",
    firstName: "David",
    lastName: "Ahman",
    rank: 3,
  },
  {
    id: "dc7fcaf0-70bf-487a-ab9d-5c1170933519",
    firstName: "Jonatan",
    lastName: "Hellvig",
    rank: 4,
  },
  {
    id: "2112538f-442f-4bbd-8011-42b1eacefc8d",
    firstName: "Ondrej",
    lastName: "Perusic",
    rank: 5,
  },
  {
    id: "b16e8b1c-afd7-49ad-9842-f51822f148c0",
    firstName: "David",
    lastName: "Schweiner",
    rank: 6,
  },
  {
    id: "4af655fe-040c-449b-b3ca-fdd950972542",
    firstName: "Miles",
    lastName: "Partain",
    rank: 7,
  },
  {
    id: "fa1a0d16-4e70-4348-a969-ad09c2d6c459",
    firstName: "Andy",
    lastName: "Benesh",
    rank: 8,
  },
] as const;

const TOURNAMENTS: SeedTournament[] = [
  {
    id: "4baa57f4-5945-4560-b7dd-a3dd10da98a6",
    status: TournamentStatus.COMPLETED,
    startDate: new Date("2026-03-01T08:00:00.000Z"),
    endDate: new Date("2026-03-05T18:00:00.000Z"),
    lineupLockAt: new Date("2026-03-01T06:00:00.000Z"),
  },
  {
    id: "0b9d5078-c19e-4333-8020-e7b80e20cf01",
    status: TournamentStatus.REGISTRATION_OPEN,
    startDate: new Date("2026-03-20T08:00:00.000Z"),
    endDate: new Date("2026-03-23T18:00:00.000Z"),
    lineupLockAt: new Date("2026-03-20T06:00:00.000Z"),
  },
] as const;

const MATCHES: SeedMatch[] = [
  {
    id: "4ef68be1-31ff-4815-b260-e3d319949051",
    tournamentId: TOURNAMENTS[0].id,
    round: MatchRound.POOL,
    status: MatchStatus.COMPLETED,
    scheduledAt: new Date("2026-03-01T10:00:00.000Z"),
    sideAAthlete1Id: ATHLETES[0].id,
    sideAAthlete2Id: ATHLETES[1].id,
    sideBAthlete1Id: ATHLETES[2].id,
    sideBAthlete2Id: ATHLETES[3].id,
    set1A: 21,
    set1B: 18,
    set2A: 19,
    set2B: 21,
    set3A: 15,
    set3B: 12,
    winnerSide: MatchSide.A,
  },
  {
    id: "8e28b02e-0f91-4640-a0d4-75f81e41ad4c",
    tournamentId: TOURNAMENTS[0].id,
    round: MatchRound.POOL,
    status: MatchStatus.COMPLETED,
    scheduledAt: new Date("2026-03-01T12:00:00.000Z"),
    sideAAthlete1Id: ATHLETES[4].id,
    sideAAthlete2Id: ATHLETES[5].id,
    sideBAthlete1Id: ATHLETES[6].id,
    sideBAthlete2Id: ATHLETES[7].id,
    set1A: 17,
    set1B: 21,
    set2A: 21,
    set2B: 19,
    set3A: 13,
    set3B: 15,
    winnerSide: MatchSide.B,
  },
  {
    id: "005c52f6-55ff-4a67-9be9-6cb2c7e0400e",
    tournamentId: TOURNAMENTS[1].id,
    round: MatchRound.POOL,
    status: MatchStatus.SCHEDULED,
    scheduledAt: new Date("2026-03-20T10:00:00.000Z"),
    sideAAthlete1Id: ATHLETES[0].id,
    sideAAthlete2Id: ATHLETES[1].id,
    sideBAthlete1Id: ATHLETES[4].id,
    sideBAthlete2Id: ATHLETES[5].id,
  },
  {
    id: "5d7b5ffa-3398-4670-aefe-b0c87ad2c8ee",
    tournamentId: TOURNAMENTS[1].id,
    round: MatchRound.POOL,
    status: MatchStatus.SCHEDULED,
    scheduledAt: new Date("2026-03-20T12:00:00.000Z"),
    sideAAthlete1Id: ATHLETES[2].id,
    sideAAthlete2Id: ATHLETES[3].id,
    sideBAthlete1Id: ATHLETES[6].id,
    sideBAthlete2Id: ATHLETES[7].id,
  },
] as const;

async function seedChampionship() {
  await prisma.championship.upsert({
    where: { id: CHAMPIONSHIP.id },
    update: {
      name: CHAMPIONSHIP.name,
      gender: CHAMPIONSHIP.gender,
      seasonYear: CHAMPIONSHIP.seasonYear,
    },
    create: CHAMPIONSHIP,
  });
}

async function seedAthletes() {
  for (const athlete of ATHLETES) {
    await prisma.athlete.upsert({
      where: { id: athlete.id },
      update: {
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        gender: CHAMPIONSHIP.gender,
        rank: athlete.rank,
        cost: computeAthletePrice(athlete.rank),
        championshipId: CHAMPIONSHIP.id,
      },
      create: {
        ...athlete,
        gender: CHAMPIONSHIP.gender,
        cost: computeAthletePrice(athlete.rank),
        championshipId: CHAMPIONSHIP.id,
      },
    });
  }
}

async function seedTournaments() {
  for (const tournament of TOURNAMENTS) {
    await prisma.tournament.upsert({
      where: { id: tournament.id },
      update: {
        championshipId: CHAMPIONSHIP.id,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        lineupLockAt: tournament.lineupLockAt,
      },
      create: {
        ...tournament,
        championshipId: CHAMPIONSHIP.id,
      },
    });
  }
}

async function seedMatches() {
  await prisma.match.deleteMany({
    where: {
      tournamentId: { in: TOURNAMENTS.map((tournament) => tournament.id) },
    },
  });

  await prisma.match.createMany({
    data: MATCHES.map((match) => ({
      ...match,
      set1A: match.set1A ?? null,
      set1B: match.set1B ?? null,
      set2A: match.set2A ?? null,
      set2B: match.set2B ?? null,
      set3A: match.set3A ?? null,
      set3B: match.set3B ?? null,
      winnerSide: match.winnerSide ?? null,
    })),
  });
}

async function main() {
  await seedChampionship();
  await seedAthletes();
  await seedTournaments();
  await seedMatches();

  console.log(
    `Seeded real-world entities: 1 championship, ${ATHLETES.length} athletes, ${TOURNAMENTS.length} tournaments, ${MATCHES.length} matches.`,
  );
}

main()
  .catch((error) => {
    console.error("Error seeding real-world entities:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
