-- Migrate document storage from base64 data_url (PostgreSQL) to Supabase Storage
-- documents.storage_path: path within the 'documents' private bucket
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
