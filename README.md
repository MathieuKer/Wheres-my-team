# Carte Équipe Répartition (Where's My Team)

Outil interactif et en temps réel pour gérer et suivre la position de vos équipes sur une carte. Dispose d'un système de synchronisation multi-utilisateurs via Supabase et d'un accès sécurisé.

## 🛠 Stack Technique
- **Frontend** : React, TypeScript, Vite
- **Style** : Tailwind CSS, Lucide Icons
- **Backend / Temps Réel** : Supabase (PostgreSQL, Storage, Realtime)
- **Déploiement** : Netlify

## 🔒 Sécurité et Authentification
L'application est protégée par un écran de connexion et des politiques RLS (Row Level Security) sur la base de données. 
- Personne ne peut lire, ajouter, ou supprimer des données sans être connecté.
- Identifiants : Gérés via Supabase Auth (ex: `admin@carte-equipe.local`).

## 🚀 Installation & Lancement en local

1. **Cloner le projet**
   ```bash
   git clone git@github.com:MathieuKer/Wheres-my-team.git
   cd Carte_Equipe_Repartition
   ```

2. **Configurer les variables d'environnement**
   Créez un fichier `.env.local` à la racine du projet et ajoutez vos clés Supabase :
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

## 🗄️ Configuration de la base de données (Supabase)

Pour recréer l'environnement depuis zéro sur Supabase, exécutez les requêtes suivantes dans l'éditeur SQL de votre projet :

```sql
-- 1. Table des équipes
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  pos_x FLOAT NOT NULL DEFAULT 50.0,
  pos_y FLOAT NOT NULL DEFAULT 50.0,
  status TEXT NOT NULL DEFAULT 'dispo' CHECK (status IN ('dispo', 'intervention', 'pause')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Table pour les cartes (maps)
CREATE TABLE public.maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  image_url TEXT,
  has_interventions BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Activation du Temps Réel
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_settings;

-- 4. Sécurité RLS (Accès authentifié uniquement)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users only" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users only" ON public.map_settings FOR ALL TO authenticated USING (true);

-- 5. Bucket Storage "maps" (Créer d'abord le bucket 'maps' dans l'interface, public)
CREATE POLICY "Authenticated Reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'maps');
CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'maps');
CREATE POLICY "Authenticated Updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'maps');
CREATE POLICY "Authenticated Deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'maps');
```

## 📌 Fonctionnalités
- **Uploader un plan** : Changez la carte de fond synchronisée pour tous les utilisateurs.
- **Ajouter et déplacer des équipes** : Glissez-déposez les marqueurs.
- **Gestion des statuts** : Double-cliquez sur un marqueur pour le passer en mode "Intervention" (Alerte Rouge).
- **Synchronisation en temps réel** : Toute action est visible instantanément par les autres utilisateurs connectés.
- **Easter Egg** : 🐴 (Il faut le trouver !)
