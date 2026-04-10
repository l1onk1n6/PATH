-- data_url was NOT NULL in the original table, but Storage-backed documents
-- set data_url = NULL (the file lives in the documents bucket, not as base64).
ALTER TABLE public.documents ALTER COLUMN data_url DROP NOT NULL;
