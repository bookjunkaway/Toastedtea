---
description: Get-shit-done — turn a goal into a tight plan and drive it to done.
argument-hint: <what you want to accomplish>
---

# Get Shit Done

Goal: **$ARGUMENTS**

Run this lightweight execution loop. Bias toward shipping, not ceremony.

1. **Frame it.** Restate the goal in one sentence. If it's ambiguous or has
   risky/irreversible parts, ask ONE clarifying question via AskUserQuestion;
   otherwise proceed.
2. **Scout.** Find the relevant files fast (Explore agent or targeted grep).
   Don't read the whole repo — read what the task touches.
3. **Plan.** Write a short checklist of concrete steps (3–7 items). Order them
   so each step is verifiable. Surface the single biggest risk or unknown.
4. **Execute.** Work the checklist top to bottom. After each meaningful change,
   keep moving — don't stop to over-explain. Make all independent tool calls in
   parallel.
5. **Verify.** Run the project's checks where relevant: `npm run type-check`,
   `npm run lint`, and `npm run dev` for UI changes. Fix what breaks.
6. **Report.** End with: what changed (files), what's verified, and the single
   next action if anything remains. Two sentences max.

Do not commit or push unless I explicitly ask. Keep scope to the goal — no
drive-by refactors.
