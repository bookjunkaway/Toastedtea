---
description: Load project memory notes into context (optionally filter by topic).
argument-hint: "[optional topic to filter for]"
allowed-tools: Read
---

# Recall

Read `.claude/memory/notes.md` and surface its contents.

- If it doesn't exist, say there's no project memory yet and suggest `/remember`.
- If a topic was given (**$ARGUMENTS**), summarize only the matching notes.
- Otherwise, give a tight summary grouped by section.

Use what you recall to inform the rest of this session.
