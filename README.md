# Project Documentation Guide

This repo uses a layered documentation system to guide AI-agent development (Claude Code). This
file explains what each doc is and where it lives.

## Core principle

**Nothing is invented.** Pages, content, fields, and features are decided through discussion with
the human, then built. Undecided things go to `OPEN_QUESTIONS.md` and are asked about — never
guessed. See the "Working philosophy" section at the top of `CLAUDE.md`.

## File placement

```
project-root/
├── README.md                ← this file
├── CLAUDE.md                ← root: stack, env, auth, roles, global rules + working philosophy
├── DESIGN_SYSTEM.md         ← color tokens, theming, day/night, design rules
├── STATE.md                 ← live progress tracker (agent updates as it works)
├── OPEN_QUESTIONS.md        ← unresolved decisions needing a human answer
├── DECISIONS.md             ← log of settled choices + reasoning
└── src/
    ├── CLAUDE.md            ← frontend architecture, API client, auth flow, stores, animations
    └── routes/
        ├── CLAUDE.md        ← public site conventions
        └── admin/
            └── CLAUDE.md    ← CMS panel: guards, endpoints, post workflow
```

## Two kinds of docs

**1. `CLAUDE.md` files — always-on instructions.**
Claude Code automatically loads every `CLAUDE.md` from the working file up to the root. They live
in the directory they describe, so the agent gets the right rules for wherever it's working. Keep
these lean and stable — they're rules, not status.

**2. Working docs — read/update as needed.**
`STATE.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md` are referenced when relevant.
They change over time. The root `CLAUDE.md` points the agent to them.

## Workflow

- **Before building:** check `OPEN_QUESTIONS.md` for anything blocking the area. If a needed
  decision is missing, ask — don't guess.
- **While building:** update `STATE.md` status rows.
- **When a decision is made:** record it in `DECISIONS.md`, remove it from `OPEN_QUESTIONS.md`.
- **Design/CSS work:** read `DESIGN_SYSTEM.md` first; use semantic tokens only.

## Suggested first instruction to the agent

> Read all `CLAUDE.md` files, `DESIGN_SYSTEM.md`, and `STATE.md`. Do not build any page or feature
> that isn't agreed in `DECISIONS.md`. Start with the Foundations section of `STATE.md`, updating
> it as you go, and stop to ask whenever you hit something in `OPEN_QUESTIONS.md`.
