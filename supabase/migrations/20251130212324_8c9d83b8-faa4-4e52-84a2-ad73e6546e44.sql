-- Allow conversations without missions (direct messaging)
ALTER TABLE public.conversations ALTER COLUMN mission_id DROP NOT NULL;