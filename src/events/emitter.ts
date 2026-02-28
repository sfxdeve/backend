import { EventEmitter } from "node:events";

export interface MatchUpdatedPayload {
  matchId: string;
  tournamentId: string;
  versionNumber: number;
}

export interface TournamentLockedPayload {
  tournamentId: string;
}

export interface LineupLockedPayload {
  lineupId: string;
  userId: string;
  tournamentId: string;
}

export interface TournamentFinalizedPayload {
  tournamentId: string;
}

export interface AppEvents {
  "match:updated": MatchUpdatedPayload;
  "tournament:locked": TournamentLockedPayload;
  "lineup:locked": LineupLockedPayload;
  "tournament:finalized": TournamentFinalizedPayload;
}

class TypedEmitter extends EventEmitter {
  override emit<K extends keyof AppEvents>(
    event: K,
    payload: AppEvents[K],
  ): boolean {
    return super.emit(event, payload);
  }

  override on<K extends keyof AppEvents>(
    event: K,
    listener: (payload: AppEvents[K]) => void,
  ): this {
    return super.on(event, listener as (payload: unknown) => void);
  }
}

export const appEmitter = new TypedEmitter();
