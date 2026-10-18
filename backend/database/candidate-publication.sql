-- Preview analysis must be immediately publishable in a later write run.
alter table public.collector_candidates add column if not exists canonical_url text;
alter table public.collector_candidates add column if not exists published_at timestamptz;
