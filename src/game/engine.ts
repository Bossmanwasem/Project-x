import type { PlayerState } from "./types";

export interface GameState {
  turn: number;
  activePlayerId: string;
  players: Record<string, PlayerState>;
}

export const createInitialState = (players: PlayerState[]): GameState => {
  const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
  return {
    turn: 1,
    activePlayerId: players[0]?.id ?? "",
    players: playerMap,
  };
};
