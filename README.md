# Project X Digital TCG Client

A world-class, player-first digital client for **Project X**. This repo starts with a clean, scalable structure designed for a fast, maintainable build-out of core gameplay, UI, and live services.

## Goals
- **Fast iteration** on gameplay rules and card data.
- **Clear separation** between game engine, UI, and network layers.
- **Tooling-friendly** structure for future automation, testing, and build pipelines.

## Project Structure
```
/docs              Product vision, UX notes, and technical RFCs
/src
  /app             App bootstrap and composition root
  /assets          Artwork, audio, and branding assets
  /data            Static data sources (card sets, keywords, rules text)
  /game            Rules engine, state machine, and gameplay domain models
  /network         API client, matchmaking, and live ops
  /ui
    /components    Reusable UI building blocks
    /screens       Feature-level views (Deck Builder, Match, Profile)
  /utils           Shared helpers and utilities
```

## Getting Started (Electron shell)
This repo now includes a lightweight Electron shell so you can install and open the client on a Windows machine.

### Run locally
```bash
npm install
npm run dev
```

### Build a Windows installer
```bash
npm install
npm run build
```

The Windows installer (`.exe`) will be generated in the `dist/` folder. Run it on a Windows machine to install and launch the client.

## Next Steps
- Choose UI stack (e.g., React + PixiJS, Unity, or Godot).
- Define the authoritative rules engine boundaries.
- Establish data format for card sets.
