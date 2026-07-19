begin;

-- Public buckets continue serving known object URLs through /object/public/.
-- Removing broad SELECT policies prevents authenticated or anonymous clients
-- from listing every company's assets through the Storage API.
drop policy if exists "Public read logos" on storage.objects;
drop policy if exists "Public read logos bucket" on storage.objects;
drop policy if exists "Public read pdf-assets" on storage.objects;
drop policy if exists "Public read pdf-assets bucket" on storage.objects;

drop policy if exists "Owner read logos" on storage.objects;
drop policy if exists "Owner read pdf-assets" on storage.objects;

create policy "Owner read logos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner read pdf-assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pdf-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
