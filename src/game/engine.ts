import type { EffectPermission, GameInstruction, PlayerState } from "./types";
import { resolveInstructions, resolvePermissions } from "./rules";
export { expandDeckSection, importPiltoverArchiveDeck } from "./deckImporter";

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

export const evaluateActionPermissions = (permissions: EffectPermission[]) => {
  return resolvePermissions(permissions);
};

export const resolveCardInstructions = (instructions: GameInstruction[]) => {
  return resolveInstructions(instructions);
};
