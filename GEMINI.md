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

## 🔀 Workflow de Développement & Déploiement (Mandatoire)

1. **Étape 1 : Dév & Tests locaux** :
   - Développement sur la branche `dev` (ou feature/fix branches).
   - Validation locale complète obligatoire : `npm run verify` (`lint` + `test` + `build`).

2. **Étape 2 : Commit & Push sur `dev` + Contrôle GitHub Actions** :
   - Commit et push sur `dev`.
   - Attente et validation du workflow GitHub Actions : `CI / Verification Pipeline / Lint, Test & Build (push)` sur `dev` (doit être 100% vert ✅).

3. **Étape 3 : Feu Vert Utilisateur & Ouverture de la PR vers `main` sur GitHub** :
   - Dès que la CI sur `dev` est verte, l'utilisateur donne son accord et déclenche la Pull Request vers `main` directement sur GitHub.
   - 🚫 **L'agent ne merge jamais automatiquement vers `main`**. Le merge est déclenché par l'utilisateur sur GitHub.

4. **Étape 4 : Analyse SonarCloud sur la PR & Corrections itératives sur `dev`** :
   - L'utilisateur transmet l'URL SonarCloud de la PR.
   - L'agent récupère les anomalies SonarCloud via l'URL / API et les corrige sur `dev`.
   - Cycle répété : correction sur `dev` -> `npm run verify` local -> push `dev` -> validation CI GitHub Actions -> re-scan SonarCloud sur la PR jusqu'à validation complète (Quality Gate: OK).

5. **Étape 5 : Finalisation du Merge sur GitHub & Contrôle Post-Merge sur `main`** :
   - Une fois la PR validée par SonarCloud et la CI, l'utilisateur finalise le merge sur GitHub.
   - L'agent vérifie le bon passage de la CI GitHub Actions et de l'analyse SonarCloud sur la branche `main`.

---

## 📋 Execution Workflow (Mandatory for every change)

1. **Plan Mode First**:
   - Analyze the codebase, state assumptions, list files to modify or create, and submit an implementation plan (`implementation_plan.md`) for PM approval before executing code changes.

2. **Lean & Concise Implementation**:
   - Write simple, clear, readable TypeScript/React code without over-engineering or premature abstractions.
   - Maintain strict UI/UX patterns established in existing components.
   - Respect strict Reader Mode (`mode === 'reader'`): disable editing, replace inputs with static text spans, hide color pickers, deletion, and administrative actions.

3. **Tests E2E, Non-Régression & Cycle de Vie par Fonctionnalité**:
   - **À chaque fonctionnalité développée**: Créer systématiquement les tests E2E (parcours et flux utilisateur complets de bout en bout) et les tests de non-régression correspondants par rapport à la fonctionnalité dans `src/**/*.test.tsx`.
   - **Non-régression systématique**: Vérifier que les comportements existants, les interactions utilisateur et les modes d'accès (`reader`, `deployment`, `edition`) restent 100% opérationnels via des tests ciblés.
   - **Nettoyage proactif au retrait de fonctionnalité**: Au retrait ou à la dépréciation d'une fonctionnalité, tous les tests la concernant doivent être immédiatement et rigoureusement retirés ou mis à jour (zéro test zombie ou faux positif).
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
