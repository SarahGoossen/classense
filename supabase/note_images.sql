insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-note-images',
  'lesson-note-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own lesson note images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lesson-note-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own lesson note images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'lesson-note-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own lesson note images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lesson-note-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
