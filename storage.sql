-- Exécuter ceci dans l'éditeur SQL de Supabase pour créer le dossier de stockage des images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maps', 'maps', true) 
ON CONFLICT (id) DO NOTHING;

-- Autoriser la lecture et l'écriture pour tout le monde (à sécuriser plus tard)
CREATE POLICY "Public Access" 
ON storage.objects FOR ALL TO public 
USING (bucket_id = 'maps');
