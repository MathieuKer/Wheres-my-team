-- Supabase Schema pour Carte_Equipe_Repartition

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

-- 2. Table pour l'image de la carte globale
CREATE TABLE public.map_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  image_url TEXT
);

-- Insertion de la ligne unique pour la carte
INSERT INTO public.map_settings (id, image_url) VALUES (1, null) ON CONFLICT DO NOTHING;

-- 3. Activation du Temps Réel (Realtime)
-- C'est crucial pour que les WebSockets fonctionnent !
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_settings;

-- 4. Sécurité RLS (Row Level Security) très simple pour un accès authentifié
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

-- Autorise la lecture/écriture à tout le monde POUR L'INSTANT
-- (Tu pourras restreindre aux utilisateurs authentifiés une fois l'auth setup via le tableau de bord Supabase)
CREATE POLICY "Enable all for authenticated users only" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users only" ON public.map_settings FOR ALL TO authenticated USING (true);
