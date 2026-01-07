export type CardId = string;

export interface CardDefinition {
  id: CardId;
  name: string;
  cost: number;
  faction: "rift" | "forge" | "veil" | "wild";
  rulesText: string;
}

export type RuleSource = "rule" | "card";

export type PermissionType = "allow" | "forbid";

export interface EffectPermission {
  source: RuleSource;
  type: PermissionType;
  description: string;
  ruleId?: string;
}

export interface GameInstruction {
  id: string;
  description: string;
  possible: boolean;
}

export interface PlayerState {
  id: string;
  health: number;
  hand: CardId[];
  deck: CardId[];
  discard: CardId[];
}
