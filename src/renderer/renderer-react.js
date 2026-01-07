const { useMemo, useState } = React;

const statusText = window.projectX?.version ? `Installed · v${window.projectX.version}` : "Installed";

const cardCatalog = {
  "PX-001": {
    id: "PX-001",
    name: "Auric Sentinel",
    type: "Unit",
    cost: 2,
    power: 3,
    text: "When deployed, gain 1 shield for each ally in lane.",
    accent: "#f5b453",
  },
  "PX-002": {
    id: "PX-002",
    name: "Hextech Ranger",
    type: "Unit",
    cost: 3,
    power: 4,
    text: "Quickstrike: Deal 1 damage to an opposing unit.",
    accent: "#5eead4",
  },
  "PX-003": {
    id: "PX-003",
    name: "Arcane Forge",
    type: "Base",
    cost: 1,
    power: 0,
    text: "Once per turn, draw a card when you play a rune.",
    accent: "#818cf8",
  },
  "PX-004": {
    id: "PX-004",
    name: "Storm Archivist",
    type: "Legend",
    cost: 4,
    power: 5,
    text: "Legends enter with 2 lore counters.",
    accent: "#f472b6",
  },
  "PX-005": {
    id: "PX-005",
    name: "Piltover Vanguard",
    type: "Unit",
    cost: 2,
    power: 2,
    text: "Deploy: Draw a rune card.",
    accent: "#38bdf8",
  },
  "PX-006": {
    id: "PX-006",
    name: "Rune Seeker",
    type: "Rune",
    cost: 1,
    power: 0,
    text: "Runes in play empower adjacent units.",
    accent: "#c4b5fd",
  },
};

const createDeckId = () => `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const expandDeckEntries = (entries) =>
  entries.flatMap((entry) => Array.from({ length: entry.count }, () => entry.cardId));

const countEntries = (entries) => entries.reduce((total, entry) => total + entry.count, 0);

const buildStarterDeck = (label) => ({
  id: createDeckId(),
  name: label,
  source: "Starter",
  mainDeck: [
    { cardId: "PX-001", count: 3 },
    { cardId: "PX-002", count: 3 },
    { cardId: "PX-005", count: 4 },
    { cardId: "PX-003", count: 2 },
  ],
  runeDeck: [
    { cardId: "PX-006", count: 4 },
    { cardId: "PX-002", count: 1 },
  ],
});

const normalizeDeckSections = (mainDeck, runeDeck) => ({
  mainDeck: mainDeck ?? [],
  runeDeck: runeDeck ?? [],
});

const parsePiltoverArchiveDeck = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a Piltover Archive export to import.");
  }

  try {
    const parsed = JSON.parse(trimmed);
    const section = parsed.cards ?? parsed;
    if (section.main || section.rune || section.mainDeck || section.runeDeck) {
      const mainDeck = section.main ?? section.mainDeck ?? [];
      const runeDeck = section.rune ?? section.runeDeck ?? [];
      return normalizeDeckSections(mainDeck, runeDeck);
    }
    if (Array.isArray(parsed)) {
      return normalizeDeckSections(parsed, []);
    }
  } catch (error) {
    // Fall through to text parsing.
  }

  let activeSection = "main";
  const main = new Map();
  const rune = new Map();

  trimmed.split(/\r?\n/).forEach((line) => {
    const cleaned = line.trim();
    if (!cleaned) return;
    if (/^rune\s+deck/i.test(cleaned)) {
      activeSection = "rune";
      return;
    }
    if (/^main\s+deck/i.test(cleaned)) {
      activeSection = "main";
      return;
    }

    const match = cleaned.match(/^(\d+)\s*[xX]?\s+(.+)$/);
    if (!match) return;
    const count = Number(match[1]);
    const cardId = match[2].trim();
    const bucket = activeSection === "rune" ? rune : main;
    bucket.set(cardId, (bucket.get(cardId) ?? 0) + count);
  });

  const mainDeck = Array.from(main.entries()).map(([cardId, count]) => ({ cardId, count }));
  const runeDeck = Array.from(rune.entries()).map(([cardId, count]) => ({ cardId, count }));
  return normalizeDeckSections(mainDeck, runeDeck);
};

const createPlayerState = (name, deck) => {
  const deckList = expandDeckEntries(deck.mainDeck);
  const hand = deckList.slice(0, 5);
  const remainingDeck = deckList.slice(5);
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    collection: [deck],
    activeDeckId: deck.id,
    deck: remainingDeck,
    hand,
    battlefield: [null, null],
    discard: [],
    runes: expandDeckEntries(deck.runeDeck).slice(0, 3),
  };
};

const getCardDetails = (cardId) =>
  cardCatalog[cardId] ?? {
    id: cardId,
    name: cardId,
    type: "Unknown",
    cost: 0,
    power: 0,
    text: "Imported card data not found in catalog.",
    accent: "#94a3b8",
  };

const App = () => {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [importedDeck, setImportedDeck] = useState(null);

  const [players, setPlayers] = useState(() => {
    const starterOne = buildStarterDeck("Piltover Vanguard");
    const starterTwo = buildStarterDeck("Hextech Reserve");
    return [createPlayerState("Player One", starterOne), createPlayerState("Player Two", starterTwo)];
  });

  const handleImport = () => {
    try {
      const parsed = parsePiltoverArchiveDeck(importText);
      const deck = {
        id: createDeckId(),
        name: `Piltover Archive · ${new Date().toLocaleTimeString()}`,
        source: "Piltover Archive",
        ...parsed,
      };
      setImportedDeck(deck);
      setImportError("");
    } catch (error) {
      setImportError(error.message);
      setImportedDeck(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
    } catch (error) {
      setImportError("Clipboard access failed. Paste manually instead.");
    }
  };

  const addDeckToPlayer = (playerIndex) => {
    if (!importedDeck) {
      setImportError("Import a deck before adding it to a collection.");
      return;
    }

    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex) return player;
        return {
          ...player,
          collection: [...player.collection, importedDeck],
        };
      })
    );
  };

  const activateDeck = (playerIndex, deckId) => {
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex) return player;
        const deck = player.collection.find((item) => item.id === deckId);
        if (!deck) return player;
        const refreshed = createPlayerState(player.name, deck);
        return { ...refreshed, collection: player.collection };
      })
    );
  };

  const drawCard = (playerIndex) => {
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex || player.deck.length === 0) return player;
        const [nextCard, ...rest] = player.deck;
        return {
          ...player,
          deck: rest,
          hand: [...player.hand, nextCard],
        };
      })
    );
  };

  const playCardFromHand = (playerIndex, handIndex) => {
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex) return player;
        const openLane = player.battlefield.findIndex((slot) => slot === null);
        if (openLane === -1) return player;
        const cardId = player.hand[handIndex];
        if (!cardId) return player;
        const nextHand = player.hand.filter((_, idx) => idx !== handIndex);
        const nextField = player.battlefield.map((slot, idx) => (idx === openLane ? cardId : slot));
        return {
          ...player,
          hand: nextHand,
          battlefield: nextField,
        };
      })
    );
  };

  const discardBattlefieldCard = (playerIndex, laneIndex) => {
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex) return player;
        const cardId = player.battlefield[laneIndex];
        if (!cardId) return player;
        const nextField = player.battlefield.map((slot, idx) => (idx === laneIndex ? null : slot));
        return {
          ...player,
          battlefield: nextField,
          discard: [cardId, ...player.discard],
        };
      })
    );
  };

  const renderCard = (cardId, { onClick, compact, key } = {}) => {
    const card = getCardDetails(cardId);
    return React.createElement(
      "button",
      {
        key,
        type: "button",
        className: `card ${compact ? "card--compact" : ""}`,
        style: { "--card-accent": card.accent },
        onClick,
      },
      React.createElement("div", { className: "card-art" }, React.createElement("span", null, card.type)),
      React.createElement(
        "div",
        { className: "card-info" },
        React.createElement(
          "div",
          { className: "card-header" },
          React.createElement("h4", null, card.name),
          React.createElement("span", { className: "card-cost" }, card.cost)
        ),
        React.createElement("p", null, card.text),
        React.createElement("div", { className: "card-footer" }, `Power ${card.power}`)
      )
    );
  };

  return React.createElement(
    "main",
    { className: "shell" },
    React.createElement(
      "section",
      { className: "hero" },
      React.createElement("p", { className: "eyebrow" }, "Project X Digital Client"),
      React.createElement("h1", null, "Decks, collections, and the full Riftbound arena."),
      React.createElement(
        "p",
        { className: "subhead" },
        "Import Piltover Archive lists, assign them to each player, and play cards into a two-sided battlefield with full card art previews."
      )
    ),
    React.createElement(
      "section",
      { className: "layout" },
      React.createElement(
        "div",
        { className: "deck-manager" },
        React.createElement("h2", null, "Deck & Collection Manager"),
        React.createElement(
          "div",
          { className: "deck-actions" },
          React.createElement(
            "button",
            { type: "button", className: "btn", onClick: handlePaste },
            "Paste Piltover Archive"
          ),
          React.createElement(
            "button",
            { type: "button", className: "btn btn--primary", onClick: handleImport },
            "Import Deck"
          )
        ),
        React.createElement("textarea", {
          className: "deck-input",
          placeholder: "Paste Piltover Archive JSON or text list here...",
          value: importText,
          onChange: (event) => setImportText(event.target.value),
        }),
        importError
          ? React.createElement("p", { className: "error" }, importError)
          : React.createElement(
              "p",
              { className: "hint" },
              importedDeck
                ? `Imported deck ready: ${importedDeck.name}`
                : "Import a deck to add it to a player's collection."
            ),
        React.createElement(
          "div",
          { className: "deck-assign" },
          React.createElement(
            "button",
            { type: "button", className: "btn", onClick: () => addDeckToPlayer(0) },
            "Add to Player One"
          ),
          React.createElement(
            "button",
            { type: "button", className: "btn", onClick: () => addDeckToPlayer(1) },
            "Add to Player Two"
          )
        ),
        React.createElement(
          "div",
          { className: "collections" },
          players.map((player, playerIndex) =>
            React.createElement(
              "div",
              { key: player.id, className: "collection" },
              React.createElement(
                "div",
                { className: "collection-header" },
                React.createElement("h3", null, `${player.name} Collection`),
                React.createElement(
                  "span",
                  { className: "pill" },
                  `Active: ${
                    player.collection.find((deck) => deck.id === player.activeDeckId)?.name ?? "None"
                  }`
                )
              ),
              React.createElement(
                "ul",
                null,
                player.collection.map((deck) =>
                  React.createElement(
                    "li",
                    { key: deck.id },
                    React.createElement(
                      "div",
                      { className: "deck-row" },
                      React.createElement(
                        "div",
                        null,
                        React.createElement("strong", null, deck.name),
                        React.createElement(
                          "span",
                          null,
                          `${countEntries(deck.mainDeck)} main · ${countEntries(deck.runeDeck)} rune`
                        )
                      ),
                      React.createElement(
                        "button",
                        { type: "button", className: "btn btn--ghost", onClick: () => activateDeck(playerIndex, deck.id) },
                        "Set Active"
                      )
                    )
                  )
                )
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "arena" },
        React.createElement("h2", null, "Two-Player Battlefield"),
        React.createElement(
          "div",
          { className: "arena-boards" },
          players.map((player, playerIndex) =>
            React.createElement(
              "section",
              { key: player.id, className: `player-board ${playerIndex === 0 ? "opponent" : "local"}` },
              React.createElement(
                "header",
                { className: "player-header" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("h3", null, player.name),
                  React.createElement("span", null, "Arena Side")
                ),
                React.createElement(
                  "div",
                  { className: "player-actions" },
                  React.createElement(
                    "button",
                    { type: "button", className: "btn btn--ghost", onClick: () => drawCard(playerIndex) },
                    "Draw"
                  ),
                  React.createElement("span", { className: "pill" }, `${player.deck.length} cards left`)
                )
              ),
              React.createElement(
                "div",
                { className: "zone-grid" },
                React.createElement(
                  "div",
                  { className: "zone" },
                  React.createElement("span", { className: "zone-title" }, "Main Deck"),
                  React.createElement("span", null, `${player.deck.length} cards`)
                ),
                React.createElement(
                  "div",
                  { className: "zone" },
                  React.createElement("span", { className: "zone-title" }, "Rune Deck"),
                  React.createElement("span", null, `${player.runes.length} runes`)
                ),
                React.createElement(
                  "div",
                  { className: "zone" },
                  React.createElement("span", { className: "zone-title" }, "Base"),
                  React.createElement("span", null, "Arcane Forge")
                ),
                React.createElement(
                  "div",
                  { className: "zone" },
                  React.createElement("span", { className: "zone-title" }, "Trash"),
                  React.createElement("span", null, `${player.discard.length} cards`)
                )
              ),
              React.createElement(
                "div",
                { className: "battlefield" },
                player.battlefield.map((cardId, laneIndex) =>
                  React.createElement(
                    "div",
                    { key: `${player.id}-lane-${laneIndex}`, className: "lane" },
                    cardId
                      ? renderCard(cardId, {
                          key: `${player.id}-lane-${laneIndex}`,
                          compact: true,
                          onClick: () => discardBattlefieldCard(playerIndex, laneIndex),
                        })
                      : React.createElement("div", { className: "lane-slot" }, `Lane ${laneIndex + 1}`)
                  )
                )
              ),
              React.createElement(
                "div",
                { className: "hand" },
                React.createElement("h4", null, "Hand"),
                React.createElement(
                  "div",
                  { className: "hand-cards" },
                  player.hand.length
                    ? player.hand.map((cardId, handIndex) =>
                        renderCard(cardId, {
                          key: `${player.id}-hand-${handIndex}`,
                          compact: true,
                          onClick:
                            playerIndex === 1 ? () => playCardFromHand(playerIndex, handIndex) : undefined,
                        })
                      )
                    : React.createElement("p", { className: "hint" }, "No cards in hand.")
                )
              )
            )
          )
        )
      )
    ),
    React.createElement(
      "section",
      { className: "status" },
      React.createElement("span", { className: "label" }, "Client status"),
      React.createElement("span", { className: "pill" }, statusText)
    )
  );
};

const root = document.getElementById("root");
ReactDOM.render(React.createElement(App), root);
