# Where's my team?

Outil interactif pour gérer et suivre la position de vos équipes sur une carte en temps réel (avec gestion des statuts : en intervention, en pause, etc).

## 🛠 Stack Technique
- **Frontend** : React, TypeScript, Vite
- **Style** : Tailwind CSS
- **Backend / DB** : Supabase

## 🚀 Installation & Lancement

1. **Cloner le projet**
   ```bash
   git clone git@github.com:MathieuKer/Wheres-my-team.git
   cd Wheres-my-team
   ```

2. **Configurer les variables d'environnement**
   Créez un fichier `.env.local` à la racine du projet et ajoutez vos identifiants Supabase :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_anon_key_supabase
   ```

3. **Installer les dépendances**
   ```bash
   npm install
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   *L'application sera accessible sur `http://localhost:5173/`.*

## 📌 Utilisation basique
- Uploadez un plan/carte via le panneau latéral.
- Ajoutez des marqueurs (équipes) sur la carte.
- Déplacez-les (drag & drop).
- **Double-cliquez** sur un marqueur pour passer son statut en *Intervention*.
