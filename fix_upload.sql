-- En créant le Bucket "maps" manuellement, Supabase l'a mis en lecture publique, 
-- mais il a bloqué l'écriture (Upload) par sécurité. 
-- Exécute ceci dans l'onglet SQL Editor de Supabase pour débloquer l'upload :

CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'maps');

CREATE POLICY "Public Updates"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'maps');

CREATE POLICY "Public Deletes"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'maps');
