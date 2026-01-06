export type CardId = string;

export interface CardDefinition {
  id: CardId;
  name: string;
  cost: number;
  faction: "rift" | "forge" | "veil" | "wild";
  rulesText: string;
}

export interface PlayerState {
  id: string;
  health: number;
  hand: CardId[];
  deck: CardId[];
  discard: CardId[];
}
