import type { CardId } from "./types";

export interface DeckSectionEntry {
  cardId: CardId;
  count: number;
}

export interface ImportedDeck {
  name?: string;
  mainDeck: DeckSectionEntry[];
  runeDeck: DeckSectionEntry[];
}

type DeckSectionInput =
  | Record<string, number>
  | Array<string>
  | Array<{ cardId?: string; id?: string; count?: number }>;

const parseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const decodeBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const atobFn = (globalThis as { atob?: (data: string) => string }).atob;
  if (atobFn) {
    const binary = atobFn(padded);
    const decoder = new (globalThis as { TextDecoder: typeof TextDecoder }).TextDecoder();
    return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  }
  const buffer = (globalThis as {
    Buffer?: { from: (data: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;
  if (buffer) {
    return buffer.from(padded, "base64").toString("utf8");
  }
  throw new Error("Base64 decoding is not available in this environment.");
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const addEntry = (target: Map<CardId, number>, cardId: string, count: number) => {
  const normalizedId = cardId.trim();
  if (!normalizedId) {
    return;
  }
  const safeCount = Number.isFinite(count) && count > 0 ? count : 1;
  target.set(normalizedId, (target.get(normalizedId) ?? 0) + safeCount);
};

const normalizeSection = (input: DeckSectionInput | undefined): DeckSectionEntry[] => {
  if (!input) {
    return [];
  }
  const entries = new Map<CardId, number>();
  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (typeof item === "string") {
        addEntry(entries, item, 1);
        return;
      }
      if (item && typeof item === "object") {
        addEntry(entries, item.cardId ?? item.id ?? "", item.count ?? 1);
      }
    });
  } else {
    Object.entries(input).forEach(([cardId, count]) => {
      addEntry(entries, cardId, typeof count === "number" ? count : Number(count));
    });
  }

  return Array.from(entries.entries()).map(([cardId, count]) => ({ cardId, count }));
};

const normalizeDeckObject = (value: Record<string, unknown>): ImportedDeck | null => {
  const name = typeof value.name === "string" ? value.name : undefined;
  const cardsValue = value.cards;
  if (isRecord(cardsValue) && (cardsValue.main || cardsValue.rune)) {
    return {
      name,
      mainDeck: normalizeSection(cardsValue.main as DeckSectionInput | undefined),
      runeDeck: normalizeSection(cardsValue.rune as DeckSectionInput | undefined),
    };
  }

  const mainCandidate =
    (value.mainDeck ?? value.main ?? value.deck ?? value.cards) as DeckSectionInput | undefined;
  const runeCandidate = (value.runeDeck ?? value.rune ?? value.runes) as DeckSectionInput | undefined;

  if (mainCandidate || runeCandidate) {
    return {
      name,
      mainDeck: normalizeSection(mainCandidate),
      runeDeck: normalizeSection(runeCandidate),
    };
  }

  return null;
};

const parseFromJson = (value: string): ImportedDeck | null => {
  const parsed = parseJson(value);
  if (!parsed) {
    return null;
  }
  if (Array.isArray(parsed)) {
    return {
      mainDeck: normalizeSection(parsed as DeckSectionInput),
      runeDeck: [],
    };
  }
  if (isRecord(parsed)) {
    return normalizeDeckObject(parsed);
  }
  return null;
};

const parseFromLines = (value: string): ImportedDeck | null => {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return null;
  }
  const main = new Map<CardId, number>();
  const rune = new Map<CardId, number>();
  let section: "main" | "rune" = "main";
  let parsedAny = false;

  lines.forEach((line) => {
    if (/^#/.test(line)) {
      return;
    }
    if (/^rune\s+deck/i.test(line)) {
      section = "rune";
      return;
    }
    if (/^main\s+deck/i.test(line)) {
      section = "main";
      return;
    }
    const match = line.match(/^(\d+)x?\s+(.+)$/i);
    if (!match) {
      return;
    }
    parsedAny = true;
    const count = Number.parseInt(match[1] ?? "1", 10);
    const cardId = match[2] ?? "";
    if (section === "rune") {
      addEntry(rune, cardId, count);
    } else {
      addEntry(main, cardId, count);
    }
  });

  if (!parsedAny) {
    return null;
  }

  return {
    mainDeck: Array.from(main.entries()).map(([cardId, count]) => ({ cardId, count })),
    runeDeck: Array.from(rune.entries()).map(([cardId, count]) => ({ cardId, count })),
  };
};

const parseFromBase64Json = (value: string): ImportedDeck | null => {
  const decoded = decodeBase64(value);
  return parseFromJson(decoded);
};

export const importPiltoverArchiveDeck = (deckCode: string): ImportedDeck => {
  const trimmed = deckCode.trim();
  if (!trimmed) {
    throw new Error("Deck code is empty.");
  }

  const jsonResult = parseFromJson(trimmed);
  if (jsonResult) {
    return jsonResult;
  }

  const base64Result = parseFromBase64Json(trimmed);
  if (base64Result) {
    return base64Result;
  }

  const lineResult = parseFromLines(trimmed);
  if (lineResult) {
    return lineResult;
  }

  throw new Error("Unrecognized deck format for Piltover Archive import.");
};

export const expandDeckSection = (entries: DeckSectionEntry[]): CardId[] =>
  entries.flatMap((entry) => Array.from({ length: entry.count }, () => entry.cardId));
