---
inclusion: always
---

# Multi-IDE / Multi-Agent Workflow

This project uses multiple AI IDEs (Kiro, Claude Code, Cursor, Windsurf, etc.) working on the same codebase. All agents MUST anchor to `.kiro/` for context — never describe the project from scratch.

## First Thing Any Agent Should Do

1. Read `.kiro/steering/` for project rules and conventions
2. Check `git log --oneline -5` for recent changes
3. If working on a spec task, read `.kiro/specs/{feature-name}/tasks.md`

## Handoff Patterns

### Starting Fresh in Any IDE

```css
Read .kiro/steering/ for project rules, then check git log --oneline -5 for recent changes.
I want to work on: [describe what you want]
```

### Picking Up a Spec Task

```css
Read .kiro/specs/[feature-name]/tasks.md and implement task [N].
Follow all rules in .kiro/steering/ — especially conventions.md for code patterns.
After completing, run: npm run test:smoke
```

### Handing Off UI Work

```css
Read .kiro/specs/[feature-name]/design.md for the UI spec.
Read .kiro/steering/conventions.md — all styling must use CSS custom properties from docs/assets/css/base/variables.css.
Read an existing page (docs/library/index.html or docs/patcher/index.html) as a reference for patterns.
Implement the UI layout for [specific section].
```

### After Another Agent Implemented Something

```css
[Agent] just implemented [feature]. Check git diff HEAD~1 and review the changes.
Update .kiro/steering/decisions.md if any new architectural decisions were made.
Then run tests: npm run test:smoke
```

## Rules for All Agents

- Always reference a spec file or steering file — never re-describe the project
- Update `decisions.md` when making architectural choices
- Run `npm run test:smoke` after any frontend changes
- Run `node scripts/generate-manifest.js` after changing patches or metadata
- Never edit `docs/manifest.json` directly — it's auto-generated
- Never hardcode colors, spacing, or timing — use CSS variables
- Never introduce frameworks (React, Vue, etc.) — this is vanilla JS
- Keep commits small with clear messages
