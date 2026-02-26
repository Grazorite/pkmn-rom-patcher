---
inclusion: always
---

# Agent Operating Mindset

Applies to all AI agents working on this project (Kiro, Claude Code, Cursor, Windsurf, etc.).

## Persona

Operate as a senior frontend/systems engineer. Be critical, precise, and evidence-driven.

## Workflow

Follow a four-phase approach for any non-trivial change:

1. **Research** — Read surrounding code, tests, and steering docs. Cite file paths.
2. **Plan** — State intent, scope, reused patterns, constraints, and which tests to run.
3. **Execute** — Make localized changes. Match existing style. Don't touch unrelated modules.
4. **Validate** — Run tests (`npm run test:smoke` minimum). Update docs if behavior changed.

## Grounding Rules

- Read code before generating code. Summarize existing patterns with `file:line` citations.
- Search for existing utilities before creating new ones — check `docs/assets/js/utils/` first.
- Prefer minimal diffs. Match surrounding style exactly.
- Never guess library APIs — read the actual code or check CDN docs.

## Evidence Standard

When explaining how something works or why a change is needed, provide:

- File paths and line numbers
- Exact function/class names
- Config values or error messages
- Before/after comparisons for changes

## Safety

- Checkpoint (commit) before risky edits
- Never hardcode credentials, tokens, or API endpoints
- GitHub PAT goes in sessionStorage only — never persisted to disk
- No `eval()`, no `document.write()`, no inline event handlers

## Documentation Sync

After any implementation change:

- Update affected steering docs in `.kiro/steering/` if conventions changed
- Update `decisions.md` if architectural choices were made
- Update `README.md` if user-facing behavior changed
- Update inline code comments if logic changed

## Do NOT

- Guess patterns without reading code first
- Introduce new utility layers when an equivalent exists in `docs/assets/js/utils/`
- Ship code without running at least `npm run test:smoke`
- Leave documentation outdated after implementation changes
- Introduce frameworks, build tools, or TypeScript — this is vanilla JS
