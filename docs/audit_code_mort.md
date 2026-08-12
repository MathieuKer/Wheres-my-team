# 🧹 Audit Exhaustif du Code Mort & Fichiers Obsolètes

Ce document répertorie l'ensemble des éléments identifiés comme code mort, orphelin ou résiduel dans le projet **Wheres-my-team**.

---

## 1. 📁 Fichiers Résiduels & Templates Inutilisés

| Fichier / Ressource | Taille | Statut | Justification |
| :--- | :--- | :--- | :--- |
| **`src/App.css`** | 2.89 KB (185 lignes) | 🔴 **100% Mort** | Reliquat du template initial Vite (`.hero`, `#next-steps`, `.ticks`, etc.). Jamais importé dans `App.tsx` ni ailleurs dans le projet. |
| **`src/assets/hero.png`** | 44.9 KB | 🔴 **100% Mort** | Image de démo du starter Vite. Aucun composant ne la référence. |
| **`src/assets/react.svg`** | 4.12 KB | 🔴 **100% Mort** | Logo React par défaut de Vite. Inutilisé (l'application utilise `lucide-react`). |
| **`src/assets/vite.svg`** | 8.71 KB | 🔴 **100% Mort** | Logo Vite par défaut. Inutilisé dans le code applicatif. |

---

## 2. 🧩 Incohérences Architecturales & Redondances

### A. Repositories Asymétriques (`src/lib/repositories/`)
- **`base.ts` (`createRepository`)** : Créé comme usine générique mais uniquement consommé par `zones.ts`.
- **`teams.ts`, `interventions.ts`, `map.ts`** : N'utilisent pas `createRepository` et réimplémentent manuellement leur logique CRUD et souscription temps réel avec du code boilerplate dupliqué.
- **Piste de nettoyage** : Soit unifier tous les repositories sous une classe/factory commune profonde, soit supprimer l'abstraction `base.ts` pour alléger le bundle.

### B. Easter Egg Externe Fragile (`src/components/Dashboard.tsx`)
- Lignes 288-310 : Image GIF externe pointant vers `https://media.giphy.com/media/26AHG5KGFxSkUWw1i/giphy.gif`.
- **Problème** : Dépendance externe HTTP non garantie (peut casser en mode hors-ligne ou si le CDN Giphy révoque l'URL), non optimisée pour le chargement.

### C. Types & Mocks non synchronisés
- Dans les interfaces de tests et types (`Team` vs `Zone` vs `SquadMap`) : certaines interfaces comportent `created_at` alors que la table `teams` expose uniquement `updated_at`. Uniformiser les schémas TypeScript évite les erreurs de typage silencieuses.

---

## 3. 🎯 Gain Estimé après Nettoyage
- **Suppression nette** : ~60 KB de ressources binaires superflues.
- **Réduction du code source** : ~250 lignes de code et CSS obsolètes éliminées.
- **Amélioration du bundle Vite** : Build plus rapide et arbre de dépendances 100% propre.
