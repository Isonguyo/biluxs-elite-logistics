
UPDATE storage.buckets SET public = false WHERE id = 'procurement-refs';

DROP POLICY IF EXISTS "Procurement refs public read" ON storage.objects;

CREATE POLICY "Procurement refs owner or admin read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'procurement-refs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(),'admin')
    )
  );
