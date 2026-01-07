import type { EffectPermission, GameInstruction } from "./types";

export interface CoreRule {
  id: string;
  title: string;
  text: string;
}

export const coreRules: CoreRule[] = [
  {
    id: "002",
    title: "Golden Rule",
    text: "Card text supersedes rules text. Whenever a card fundamentally contradicts the rules, the card's indication is what is true.",
  },
  {
    id: "051",
    title: "Silver Rule",
    text: "Card text uses different terminology than rules. Card text should be interpreted according to these rules, not as though it were text within these rules.",
  },
  {
    id: "052",
    title: "Card Definition",
    text: 'Card, when written in card effects, is shorthand for "Main Deck card." Runes, legends, and battlefields are not considered cards when executing the abilities and effects of game objects.',
  },
  {
    id: "053",
    title: "Self-Reference",
    text: "Cards refer to themselves in the first person.",
  },
  {
    id: "054.1",
    title: "Can't Beats Can",
    text: "Cards that forbid actions or effects supersede cards that allow or permit that same action or effect.",
  },
  {
    id: "266",
    title: "Impossible Instructions",
    text: "If all of a card's instructions are impossible, it is still played and resolved, but nothing happens.",
  },
];

export interface PermissionResolution {
  allowed: boolean;
  appliedRuleId: string;
  reason: string;
}

export const resolvePermissions = (permissions: EffectPermission[]): PermissionResolution => {
  const cardForbids = permissions.filter(
    (permission) => permission.source === "card" && permission.type === "forbid",
  );
  if (cardForbids.length > 0) {
    return {
      allowed: false,
      appliedRuleId: "054.1",
      reason: "A card forbids this action or effect.",
    };
  }

  const cardAllows = permissions.filter(
    (permission) => permission.source === "card" && permission.type === "allow",
  );
  if (cardAllows.length > 0) {
    return {
      allowed: true,
      appliedRuleId: "002",
      reason: "A card explicitly permits this action or effect.",
    };
  }

  const ruleForbids = permissions.filter(
    (permission) => permission.source === "rule" && permission.type === "forbid",
  );
  if (ruleForbids.length > 0) {
    return {
      allowed: false,
      appliedRuleId: ruleForbids[0]?.ruleId ?? "000",
      reason: "A core rule forbids this action or effect.",
    };
  }

  return {
    allowed: true,
    appliedRuleId: "000",
    reason: "No rule or card forbids this action or effect.",
  };
};

export interface InstructionResolution {
  instructions: GameInstruction[];
  appliedRuleId?: string;
  note?: string;
}

export const resolveInstructions = (instructions: GameInstruction[]): InstructionResolution => {
  const possibleInstructions = instructions.filter((instruction) => instruction.possible);
  if (possibleInstructions.length === 0) {
    return {
      instructions: [],
      appliedRuleId: "266",
      note: "All instructions are impossible; resolve with no effect.",
    };
  }

  return { instructions: possibleInstructions };
};
