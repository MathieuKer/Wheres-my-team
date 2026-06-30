# Wheres-my-team - Vibe Coding Rules

## Stack & Commands
- React 19 + TypeScript (Vite) + Tailwind CSS (v3)
- Package Manager: npm
- Run dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm run test`
- Verification: `npm run verify`

## Execution Workflow (Mandatory)
1. **Plan Mode First**: For any task, analyze code, list assumptions, propose file modifications, and wait for PM approval.
2. **Implementation**: Code concisely, no clever abstractions. Match patterns from existing components.
3. **Verification**: Always run `npm run verify` locally after code changes. Fix errors immediately.

## Off-Limits Zones
- Never touch `package.json` dependencies without explicit validation.
- Never modify Tailwind configuration (`tailwind.config.js`) or global styles (`src/index.css`).
- If unsure: propose 2 options and ask PM to choose.
