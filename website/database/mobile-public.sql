-- Authorized 16 October 2026: public, read-only listing discovery, without login.
-- Collector/service_role grants and all listing/matching rows are preserved.
begin;
alter table public.jobs enable row level security;
revoke all on public.jobs from anon;
grant select (id,company,title,canonical_url,apply_url,location_text,work_mode,
  eligible_from_india,compensation_text,description,required_skills,preferred_skills,
  responsibilities,posting_status,first_seen_at,last_seen_at,last_verified_at)
  on public.jobs to anon;
drop policy if exists mobile_public_job_read on public.jobs;
create policy mobile_public_job_read on public.jobs for select to anon using (true);
-- Personal matches/tracking remain unavailable to anonymous clients.
revoke all on public.job_matches, public.job_workspace_state from anon;

create or replace function public.job_radar_public_feed(
  p_search text default '', p_mode text default 'all', p_location text default '',
  p_posting text default 'all', p_sort text default 'recent',
  p_limit integer default 20, p_offset integer default 0, p_job_id uuid default null
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if p_search is null or p_mode is null or p_location is null or p_posting is null
    or p_sort is null or p_limit is null or p_offset is null
    or length(p_search)>200 or length(p_location)>100 or p_limit<1 or p_limit>20 or p_offset<0
    or p_mode not in ('all','remote','onsite','hybrid','unknown')
    or p_posting not in ('all','open','closed','uncertain')
    or p_sort not in ('recent','company') then
    raise exception 'Invalid filter' using errcode='22023';
  end if;
  with base as (
    select id,company,title,canonical_url,apply_url,location_text,work_mode,
      eligible_from_india,compensation_text,description,required_skills,preferred_skills,
      responsibilities,posting_status,first_seen_at,last_seen_at,last_verified_at
    from public.jobs
  ), filtered as (
    select * from base b where (p_job_id is null or b.id=p_job_id)
    and (p_mode='all' or b.work_mode=p_mode)
    and (p_posting='all' or b.posting_status=p_posting)
    and (p_location='' or position(lower(p_location) in lower(coalesce(b.location_text,'')))>0)
    and (p_search='' or position(lower(p_search) in lower(concat_ws(' ',b.company,b.title,b.location_text,array_to_string(b.required_skills,' '))))>0)
  ), paged as (
    select * from filtered order by
      case when p_sort='company' then lower(company) end asc,
      first_seen_at desc nulls last, id asc limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'jobs',(select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from paged p),
    'total',(select count(*) from filtered),
    'summary',(select jsonb_build_object('total',count(*),
      'remote',count(*) filter(where work_mode='remote'),'last_seen',max(last_seen_at)) from base)
  ) into result;
  return result;
end $$;
revoke all on function public.job_radar_public_feed(text,text,text,text,text,integer,integer,uuid) from public,authenticated;
grant execute on function public.job_radar_public_feed(text,text,text,text,text,integer,integer,uuid) to anon,service_role;
notify pgrst, 'reload schema';
commit;
-- Rollback public access: drop policy mobile_public_job_read on public.jobs;
-- revoke all on public.jobs from anon;
-- drop function public.job_radar_public_feed(text,text,text,text,text,integer,integer,uuid);
