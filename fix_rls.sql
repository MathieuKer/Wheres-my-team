-- Supabase a bloqué tes requêtes car j'avais configuré la politique pour les utilisateurs "authentifiés" uniquement.
-- Exécute ce code pour rendre la base réellement publique pour l'instant :

DROP POLICY IF EXISTS "Enable all for authenticated users only" ON public.teams;
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON public.map_settings;

CREATE POLICY "Enable all for public users" ON public.teams FOR ALL TO public USING (true);
CREATE POLICY "Enable all for public users" ON public.map_settings FOR ALL TO public USING (true);
