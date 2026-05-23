---
description: Persist a note to project memory so it survives across sessions.
argument-hint: <the fact/decision/context to remember>
allowed-tools: Read, Edit, Write, Bash(date:*)
---

# Remember

Save this to durable project memory: **$ARGUMENTS**

Steps:

1. Read `.claude/memory/notes.md` (create it from scratch if missing, with a
   top-level `# Project Memory` heading).
2. Append a new bullet under the most fitting section heading (e.g. `## Decisions`,
   `## Conventions`, `## Gotchas`, `## TODO`). Create the section if absent.
3. Prefix the bullet with today's date in `YYYY-MM-DD` form, e.g.
   `- 2026-05-23: <note>`.
4. Keep it to one crisp line. De-duplicate — if the note already exists, update
   it in place instead of adding a duplicate.
5. Confirm in one sentence what was stored and under which section.

This file is committed to the repo, so it carries context into future sessions
(including fresh web/cloud containers). Don't store secrets here.
