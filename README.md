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
├── CLAUDE.md                ← root: stack, env, auth, roles, global rules + session workflow
├── DESIGN_SYSTEM.md         ← color tokens, theming, day/night, design rules
├── STATE.md                 ← phased roadmap + build progress (agent reads this each session)
├── OPEN_QUESTIONS.md        ← questions blocking specific build steps
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
these lean and stable — they're rules, not status. When a question is answered and introduces a
new rule or constraint, record it here.

**2. Working docs — read/update as needed.**
`STATE.md`, `OPEN_QUESTIONS.md`, and `DESIGN_SYSTEM.md` are referenced when relevant. They change
over time. The root `CLAUDE.md` points the agent to them.

## Workflow

- **Before building:** check `STATE.md` for the next unblocked step; check `OPEN_QUESTIONS.md`
  for anything blocking the area. If a needed decision is missing, ask — don't guess.
- **While building:** update `STATE.md` status rows.
- **When a question is answered:** record the rule in the relevant `CLAUDE.md` file, then remove
  the question from `OPEN_QUESTIONS.md` and unblock the step in `STATE.md`.
- **Design/CSS work:** read `DESIGN_SYSTEM.md` first; use semantic tokens only.

## Suggested first instruction to the agent

> Read `CLAUDE.md` (root), `DESIGN_SYSTEM.md`, and `STATE.md`. Follow the session workflow in
> root `CLAUDE.md`. Do not build any page or feature whose blocking question is still open in
> `OPEN_QUESTIONS.md`. Start with the earliest ⬜ step in the earliest unblocked phase.
