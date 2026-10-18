-- Keep tracked jobs visible even when refreshed matching falls below the shortlist threshold.
create or replace function public.job_radar_feed(
  p_profile text, p_search text default '', p_mode text default 'all',
  p_location text default '', p_min_score numeric default 0,
  p_posting text default 'all', p_view text default 'discover',
  p_stage text default 'all', p_sort text default 'best',
  p_limit integer default 20, p_offset integer default 0,
  p_job_id uuid default null
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if length(p_search)>200 or length(p_location)>100 or p_limit<1 or p_limit>100 or p_offset<0
    or p_mode not in ('all','remote','onsite','hybrid','unknown')
    or p_posting not in ('all','open','closed','uncertain')
    or p_view not in ('discover','saved','applications')
    or p_stage not in ('all','applied','interview','offer','rejected','withdrawn')
    or p_sort not in ('best','company','recent') or p_min_score<0 or p_min_score>100 then
    raise exception 'Invalid filter' using errcode='22023';
  end if;
  with base as (
    select j.*, m.id as match_id, m.total_score, m.recommendation, m.missing_requirements,
      m.matching_evidence, m.technical_score, m.project_score, m.experience_score,
      m.geography_score, m.role_score,
      coalesce(s.is_saved,m.application_status='saved',false) as is_saved,
      coalesce(s.application_status,nullif(m.application_status,'saved'),'new') as application_status,
      coalesce(s.revision,0) as revision
    from public.jobs j
    left join public.job_matches m on m.job_id=j.id and m.profile_version=p_profile
    left join public.job_workspace_state s on s.match_id=m.id
  ), filtered as (
    select * from base b where (p_job_id is null or b.id=p_job_id)
    and (p_mode='all' or b.work_mode=p_mode)
    and (p_posting='all' or b.posting_status=p_posting)
    and (p_min_score=0 or b.total_score>=p_min_score)
    and (p_location='' or position(lower(p_location) in lower(coalesce(b.location_text,'')))>0)
    and (p_search='' or position(lower(p_search) in lower(concat_ws(' ',b.company,b.title,b.location_text,array_to_string(b.required_skills,' '))))>0)
    and (p_view<>'discover' or (b.total_score>=60 and b.eligible_from_india='yes' and b.posting_status<>'closed') or b.is_saved or b.application_status in ('applied','interview','offer','rejected','withdrawn'))
    and (p_view<>'saved' or b.is_saved)
    and (p_view<>'applications' or b.application_status in ('applied','interview','offer','rejected','withdrawn'))
    and (p_stage='all' or b.application_status=p_stage)
  ), paged as (
    select * from filtered order by
      case when p_sort='best' then total_score end desc nulls last,
      case when p_sort='company' then lower(company) end asc,
      case when p_sort='recent' then first_seen_at end desc,
      id asc limit p_limit offset p_offset
  )
  select jsonb_build_object(
    'jobs',(select coalesce(jsonb_agg(to_jsonb(p)-'raw_source'),'[]'::jsonb) from paged p),
    'total',(select count(*) from filtered),
    'summary',(select jsonb_build_object(
      'total',count(*),'remote',count(*) filter(where work_mode='remote'),
      'saved',count(*) filter(where is_saved),
      'applied',count(*) filter(where application_status='applied'),
      'interview',count(*) filter(where application_status='interview'),
      'offer',count(*) filter(where application_status='offer'),
      'tracked',count(*) filter(where application_status in ('applied','interview','offer','rejected','withdrawn')),
      'last_seen',max(last_seen_at)) from base)
  ) into result;
  return result;
end $$;

