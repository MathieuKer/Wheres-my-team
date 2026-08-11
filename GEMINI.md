# Wheres-my-team - Vibe Coding & Quality Rules

## 🛠️ Stack & Commands
- **Framework & Tech**: React 19 + TypeScript (Vite) + Tailwind CSS (v3) + Supabase
- **Package Manager**: `npm`
- **Development Server**: `npm run dev`
- **Build Production**: `npm run build`
- **Linter**: `npm run lint` (ESLint)
- **Unit & Integration Tests**: `npm run test` (Vitest)
- **Full Verification Suite**: `npm run verify` (`lint` + `test` + `build`)

---

## 🔀 Git Branching & Deployment Strategy (Mandatory)
- 🚫 **Strict Protection of `main` (Production)** : Never push code changes directly to `main`.
- 🌿 **Development Branch (`dev`)** : All bug fixes, refactoring, feature developments, and SonarCloud Quality Gate analyses must be executed on the `dev` branch (or feature/fix branches).
- 🚦 **Merge Criteria & Explicit User Authorization** : Merging `dev` into `main` is executed by the agent ONLY upon explicit user request (e.g., "Merge vers main" / "Merge en prod"), and after automated verification (`npm run verify`), GitHub Actions CI success, and SonarCloud Quality Gate validation.
- 📡 **Post-Merge SonarCloud Check** : Immediately after a merge to `main`, inspect SonarCloud API results on `main` to confirm production health.

---

## 📋 Execution Workflow (Mandatory for every change)

1. **Plan Mode First**:
   - Analyze the codebase, state assumptions, list files to modify or create, and submit an implementation plan (`implementation_plan.md`) for PM approval before executing code changes.

2. **Lean & Concise Implementation**:
   - Write simple, clear, readable TypeScript/React code without over-engineering or premature abstractions.
   - Maintain strict UI/UX patterns established in existing components.
   - Respect strict Reader Mode (`mode === 'reader'`): disable editing, replace inputs with static text spans, hide color pickers, deletion, and administrative actions.

3. **Test Suite Creation & Maintenance**:
   - **Unit & UI Tests**: Add or update corresponding unit tests in `src/**/*.test.tsx` for any new component, hook, or state modification.
   - **Headless & JSDOM Mocks**: Ensure global browser APIs absent in JSDOM (e.g., `localStorage`, `ResizeObserver`) are properly stubbed in `src/test/setup.ts` to prevent runtime test crashes.

4. **Automated Verification Pipeline**:
   - Always run `npm run verify` locally after making any code changes.
   - Fix all compilation (`tsc`), linting (`eslint`), and test (`vitest`) failures immediately before concluding a task.

5. **CI/CD & Deployment Readiness**:
   - **GitHub Actions**: Automated pipeline (`.github/workflows/ci.yml`) runs `npm run verify` on every `push` and `pull_request` to `dev` and `main`.
   - **Netlify Hosting Constraints**:
     - Ensure global SPA redirection rule `/* -> /index.html 200` is preserved in `netlify.toml`.
     - Static assets under `/assets/*` must retain immutable long-term caching (`public, max-age=31536000, immutable`).

---

## ⛔ Off-Limits & Safety Zones
- **Dependencies**: Never add, remove, or update dependencies in `package.json` without explicit user validation.
- **Global Styles & Config**: Do not modify `tailwind.config.js` or `src/index.css` unless explicitly requested.
- **Ambiguity Resolution**: If a design choice or requirement is ambiguous, propose 2 concise options and wait for PM selection.
