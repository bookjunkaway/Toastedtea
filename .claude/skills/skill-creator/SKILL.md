---
name: skill-creator
description: >-
  Author, scaffold, and refine Claude Code skills for this repository. Use when
  the user wants to "create a skill", "make a slash command into a skill",
  "scaffold a SKILL.md", improve an existing skill's description/triggering, or
  asks how skills are structured. Produces files under .claude/skills/<name>/.
---

# Skill Creator

Help the user design and write well-formed Claude Code skills that live in
`.claude/skills/`. A skill is a directory containing a `SKILL.md` file (plus any
optional supporting files the skill references).

## Anatomy of a skill

```
.claude/skills/<skill-name>/
  SKILL.md            # required: frontmatter + instructions
  <supporting files>  # optional: scripts, templates, reference docs
```

`SKILL.md` frontmatter fields:

- `name` (required) — must match the directory name. Lowercase, hyphenated.
- `description` (required) — the single most important field. Claude reads ONLY
  the description to decide whether to load the skill. It must say **what the
  skill does** AND **when to trigger it**, using concrete trigger phrases the
  user is likely to type. Write it in third person ("Use when…").
- `allowed-tools` (optional) — restrict which tools the skill may use.

## Workflow when creating a skill

1. **Clarify the job.** Ask (or infer) the one task this skill automates. A
   skill should do one thing well. If it sprawls, split it.
2. **Nail the trigger.** Collect the real phrases a user would say to invoke it.
   These go verbatim into the description so triggering is reliable.
3. **Choose the surface.** A *skill* is best for reusable know-how/workflows
   Claude should pull in automatically. A *slash command* (`.claude/commands/`)
   is best for an explicit user-typed action. If the user wants both, the skill
   holds the logic and a thin command can invoke it.
4. **Scaffold the files.** Create `.claude/skills/<name>/SKILL.md` with tight,
   imperative instructions — numbered steps, not prose. Keep it skimmable.
5. **Add supporting files only if needed.** Reference them by relative path from
   the skill dir. Don't pad with boilerplate.
6. **Verify.** Re-read the description and confirm it would fire for the
   intended phrases and NOT fire for unrelated ones.

## Quality bar for descriptions

Bad:  `description: Helps with testing.`
Good: `description: Run and debug this project's Jest suite. Use when the user
       says "run the tests", "why is this test failing", or asks to add test
       coverage for a file.`

## Writing the instruction body

- Lead with a one-line statement of what the skill produces.
- Use numbered steps for procedures; keep each step a single action.
- Show file paths and exact frontmatter, like this skill does.
- State what NOT to do when it prevents a common mistake.
- Keep it short. The body is loaded into context when the skill fires — every
  line costs tokens.

When done, tell the user the skill path and the trigger phrases that will load
it.
