-- Operational data is server-only. Existing public listing policy is unchanged.
create table if not exists public.collector_runs (
 id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(),
 finished_at timestamptz, status text not null default 'running', summary jsonb not null default '{}',
 checkpoint jsonb not null default '{}'
);
create table if not exists public.collector_candidates (
 id uuid primary key default gen_random_uuid(), url text unique not null, title text, company text,
 status text not null default 'pending', score numeric, reason text, description text,
 content_hash text, analysis jsonb, profile_version text, extraction_method text,
 updated_at timestamptz not null default now(), attempts integer not null default 0
);
create table if not exists public.collector_sources (
 id text primary key, provider text not null, board text not null, last_checked_at timestamptz,
 unique(provider,board)
);
create table if not exists public.collector_usage (
 id bigint generated always as identity primary key, provider text not null,
 credits integer not null check(credits>0), created_at timestamptz not null default now()
);
create index if not exists collector_usage_provider_date on public.collector_usage(provider,created_at);
create table if not exists public.collector_lease (
 name text primary key, run_id uuid not null, expires_at timestamptz not null
);
do $$ declare t text; begin
 foreach t in array array['collector_runs','collector_candidates','collector_sources','collector_usage','collector_lease'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.collector_usage_id_seq to service_role;
create or replace function public.collector_reserve_credit(p_provider text,p_daily integer,p_monthly integer,p_credits integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare d integer; m integer;
begin
 if p_provider not in ('tavily','firecrawl') or p_credits<1 or p_daily<0 or p_monthly<0 then raise exception 'Invalid budget'; end if;
 perform pg_advisory_xact_lock(hashtext('collector-budget-'||p_provider));
 select coalesce(sum(credits) filter(where created_at>=date_trunc('day',now())),0),coalesce(sum(credits),0)
 into d,m from public.collector_usage where provider=p_provider and created_at>=date_trunc('month',now());
 if d+p_credits>p_daily or m+p_credits>p_monthly then return false; end if;
 insert into public.collector_usage(provider,credits) values(p_provider,p_credits); return true;
end $$;
create or replace function public.collector_acquire(p_run uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 insert into public.collector_lease(name,run_id,expires_at) values('daily',p_run,now()+interval '2 hours')
 on conflict(name) do update set run_id=excluded.run_id,expires_at=excluded.expires_at
 where public.collector_lease.expires_at<now();
 return found;
end $$;
create or replace function public.collector_ingest(p_job jsonb,p_match jsonb,p_profile text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare jid uuid;
begin
 if p_profile<>'skills-v2' then raise exception 'Unexpected collector profile'; end if;
 insert into public.jobs(canonical_url,apply_url,source_urls,external_job_id,source_type,company,title,description,location_text,work_mode,eligible_from_india,employment_type,experience_text,minimum_experience_years,degree_requirements,compensation_text,currency,required_skills,preferred_skills,responsibilities,posting_status,last_verified_at)
 values(p_job->>'canonical_url',p_job->>'apply_url',array[p_job->>'canonical_url'],p_job->>'external_job_id',p_job->>'source_type',p_job->>'company',p_job->>'title',p_job->>'description',p_job->>'location_text',p_job->>'work_mode',p_job->>'eligible_from_india',p_job->>'employment_type',p_job->>'experience_text',(p_job->>'minimum_experience_years')::numeric,array(select jsonb_array_elements_text(coalesce(p_job->'degree_requirements','[]'))),p_job->>'compensation_text',p_job->>'currency',array(select jsonb_array_elements_text(p_job->'required_skills')),array(select jsonb_array_elements_text(p_job->'preferred_skills')),array(select jsonb_array_elements_text(p_job->'responsibilities')),p_job->>'posting_status',now())
 on conflict(canonical_url) do update set
 apply_url=excluded.apply_url,company=excluded.company,title=excluded.title,description=excluded.description,
 location_text=excluded.location_text,work_mode=excluded.work_mode,eligible_from_india=excluded.eligible_from_india,
 employment_type=excluded.employment_type,experience_text=excluded.experience_text,minimum_experience_years=excluded.minimum_experience_years,
 degree_requirements=excluded.degree_requirements,compensation_text=excluded.compensation_text,currency=excluded.currency,
 required_skills=excluded.required_skills,preferred_skills=excluded.preferred_skills,responsibilities=excluded.responsibilities,
 posting_status=excluded.posting_status,last_seen_at=now(),last_verified_at=now()
 returning id into jid;
 insert into public.job_matches(job_id,profile_version,technical_score,experience_score,role_score,total_score,matching_evidence,missing_requirements,recommendation)
 values(jid,p_profile,(p_match->>'technical_score')::numeric,(p_match->>'experience_score')::numeric,(p_match->>'role_score')::numeric,(p_match->>'total_score')::numeric,p_match->'matching_evidence',array(select jsonb_array_elements_text(p_match->'missing_requirements')),p_match->>'recommendation')
 on conflict(job_id,profile_version) do update set technical_score=excluded.technical_score,experience_score=excluded.experience_score,
 role_score=excluded.role_score,total_score=excluded.total_score,matching_evidence=excluded.matching_evidence,
 missing_requirements=excluded.missing_requirements,recommendation=excluded.recommendation,matched_at=now();
 -- Deliberately never changes application_status, workspace state, match IDs, or first_seen_at.
 return jid;
end $$;
revoke all on function public.collector_reserve_credit(text,integer,integer,integer),public.collector_acquire(uuid),public.collector_ingest(jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.collector_reserve_credit(text,integer,integer,integer),public.collector_acquire(uuid),public.collector_ingest(jsonb,jsonb,text) to service_role;
