# Workspace Rules - Wheres-my-team

## Vibe Coding Instructions
You must strictly follow the rules defined in [GEMINI.md](file:///Users/mkeromnes/repos/Wheres-my-team/GEMINI.md).

1. **Plan Mode First**: Before executing any code changes or running modifying commands, analyze the codebase, list your assumptions, outline proposed changes, and write an implementation plan. Wait for explicit approval from the user.
2. **Lean & Concise Code**: Avoid over-engineering, write clear, readable, and concise TypeScript/React code. Follow patterns from existing successful components in the repository.
3. **Automated Verification**: After any code changes, run the project's local verification suite:
   ```bash
   npm run verify
   ```
   Fix any compilation, linting, or test failures immediately before concluding your task.
4. **Off-Limits**: Do not add/remove npm dependencies without explicit user validation. Do not touch `tailwind.config.js` or `src/index.css` unless requested.

## Ergonomie & Directives Responsive (Mobile/Tablette)
- **Affichage et masquage universel du Menu** : La barre latérale doit pouvoir être repliée/dépliée sur tous les écrans via le bouton Menu. Sur tablette et PC, fermer le menu doit complètement masquer le panneau (`md:hidden`), permettant à la carte de s'étendre en plein écran (100% de la largeur). Le menu commence ouvert par défaut sur PC/tablette et fermé sur mobile.
- **Flexbox Mobile** : Pour que le défilement tactile fonctionne correctement dans les barres latérales mobiles, appliquez toujours la classe `flex` de base sur le conteneur parent (au lieu de `md:flex` uniquement).
- **Hauteur contrainte pour défilement** : Sur les pages de listes (ex: sélection des cartes), préférez `h-[100dvh]` à `min-h-screen` pour contenir la hauteur du composant dans le viewport et déclencher correctement le scroll interne.
- **Bandeaux de Carte Réactifs** : Les bandeaux/drapeaux affichés sur la carte doivent avoir un z-index faible (ex: `z-20`) pour passer sous les volets mobiles. Raccourcissez le texte dynamiquement sur mobile (`md:hidden` / `hidden md:inline`) pour éviter les retours à la ligne.

## Rôles & Gestion des Droits d'Éléments
- **Actions d'Administration** : Les actions lourdes ("Changer le plan", "Flush Événement") doivent être réservées et affichées uniquement en mode **Plan** (édition).
- **Mode Lecteur strict** : En mode `'reader'`, tous les inputs modifiables d'équipes (noms) doivent être rendus en texte statique (`<span>`), les éditeurs de notes doivent être bloqués, et les color pickers, boutons de recentrage et suppressions doivent être complètement masqués.

## Standards de Tests Headless & CI/CD
- **Mock de variables globales** : Dans les suites de tests Vitest / JSDOM, mockez systématiquement les API globales absentes ou défaillantes comme `localStorage` (avec stubGlobal) et `ResizeObserver` (avec mock de classe) pour éviter les crashs à la compilation ou au montage.
- **CI/CD GitHub Actions** : Le pipeline automatisé (`.github/workflows/ci.yml`) valide tout commit et toute pull request sur `main` en exécutant `npm run verify`.

## Optimisations de Déploiement Netlify
- **Mise en cache immuable** : Dans `netlify.toml`, configurez toujours les en-têtes des éléments compilés sous `/assets/*` avec `public, max-age=31536000, immutable`. Les assets étant hashés par Vite, cela permet de réduire à zéro le coût de bande passante pour les utilisateurs récurrents.
- **SPA Rewrite Rule** : Assurez-vous d'avoir une règle de redirection globale `/* -> /index.html 200` dans `netlify.toml` pour éviter les erreurs de serveur 404 lors des rechargements ou partages de liens profonds.
