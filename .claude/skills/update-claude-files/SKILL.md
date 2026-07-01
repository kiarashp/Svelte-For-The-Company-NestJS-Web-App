---
name: update-claude-files
description: This skill should be used when the user asks to "update claudes", "update claude files", "update claude.md", "sync the claude docs", "sync STATE.md and OPEN_QUESTIONS.md", or otherwise signals that conversation context is about to be cleared and the project's persistent docs (the CLAUDE.md hierarchy, STATE.md, OPEN_QUESTIONS.md) need to reflect the session's work before that happens.
---

# Update CLAUDE.md / STATE.md / OPEN_QUESTIONS.md

This project treats `STATE.md`, `OPEN_QUESTIONS.md`, and the `CLAUDE.md` file hierarchy as its
only persistent memory across sessions — nothing else survives a context reset. This skill
reconciles those files against everything the current session actually did, decided, or
discovered, on the assumption that conversation context is about to be lost for good.

## Before writing anything

Gather the full picture from the filesystem — do not rely on conversation memory alone. These
files can change from outside the conversation too (concurrent edits from the user or another
session have happened in this repo before), so conversation memory of "what a file said" can
already be stale.

1. Run `git status` and `git diff` (staged + unstaged) to see every file actually touched this
   session, plus anything changed concurrently that this session didn't cause.
2. Run `git log --oneline -20` for anything already committed this session.
3. Re-read the current session's conversation for decisions, answers to open questions, or facts
   discovered that are **not yet reflected anywhere in the diff** — e.g. a rule the user stated
   verbally, a backend behavior discovered through testing that isn't obvious from the code change
   itself, or a scope decision ("we're deferring X until Y").
4. Read the *current* contents of `STATE.md`, `OPEN_QUESTIONS.md`, and every `CLAUDE.md` file in
   the changed area's directory chain (root `CLAUDE.md` + `DESIGN_SYSTEM.md` + `src/CLAUDE.md` +
   `src/routes/CLAUDE.md` + `src/routes/admin/CLAUDE.md`, as applicable to what changed) — do not
   assume their contents from earlier in the conversation.

## What belongs in each file

**`CLAUDE.md` files** — durable rules, conventions, gotchas, and facts about *how the system
behaves* that a future session needs before touching this area again. Examples: a backend behavior
discovered through testing (rate limits, response-envelope quirks, ownership rules), a new
file/folder convention introduced, a decision about *why* something was built one way and not
another. Write additions in the same voice and structure as the surrounding file — short,
comment-style, "why" over "what" (see root `CLAUDE.md` → "Comments — REQUIRED, not optional" for
the house style; it applies to prose in these docs too). Never invent a new section structure —
extend an existing section or add a bullet where the pattern already fits. Place the fact in the
most specific `CLAUDE.md` that owns that area (e.g. an admin-only backend quirk belongs in
`src/routes/admin/CLAUDE.md`, not the root file).

**`STATE.md`** — roadmap progress. For each step actually finished and verified this session (not
merely started or attempted), flip its status to ✅. Update a phase's narrative blockquote note if
newly discovered facts change how that phase should be approached going forward. If the session did
project-level work that isn't part of the existing phase table (tooling, test infra, config), add a
short factual note rather than inventing a new phase — follow the precedent of the existing
blockquote notes under each phase heading. Update the `_Last updated:_` line at the top to today's
date with a one-line summary of what changed, matching the existing format.

**`OPEN_QUESTIONS.md`** — only genuinely blocking, undecided questions. For each question resolved
this session: confirm the resolving fact is actually recorded in the relevant `CLAUDE.md` file
first, then remove the question from this file, and flip its dependent `STATE.md` step from ⛔ to
⬜ — follow the file's own header checklist at the top exactly. For each new gap discovered this
session that blocks a future step and has no answer yet, add a new question in the same numbered
format as its section, stating exactly what's undecided and which step it unblocks. Do not invent
an answer to fill the gap — that is exactly what this file exists to prevent (see root `CLAUDE.md`
→ "Working philosophy — nothing is invented").

## Do not

- Do not mark a `STATE.md` step ✅ if it was only attempted, not verified working.
- Do not remove an `OPEN_QUESTIONS.md` entry unless its resolving fact is actually written down
  somewhere durable (a `CLAUDE.md` file) — otherwise the decision is lost the moment context clears.
- Do not restructure, reformat, or reorganize a file beyond the edits needed to reflect this
  session's actual work.
- Do not invent scope, phases, or answers that were not actually decided in this session — this
  mirrors the project's core "nothing is invented" rule from root `CLAUDE.md`, and it applies to
  documentation exactly as much as it applies to code.

## After editing

Summarize, file by file, exactly what changed and why — this is the user's last chance to catch
anything before context is cleared. Explicitly call out anything left uncertain (a gray area worth
a second pair of eyes) rather than silently guessing at it.
