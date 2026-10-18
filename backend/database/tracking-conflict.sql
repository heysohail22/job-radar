-- Return a non-retryable stale-revision conflict through PostgREST.
create or replace function public.job_radar_update_state(
  p_match_id uuid, p_profile text, p_revision bigint,
  p_is_saved boolean default null, p_status text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare original public.job_matches%rowtype; current_state public.job_workspace_state%rowtype;
begin
  if p_is_saved is null and p_status is null then raise exception 'Empty update' using errcode='22023'; end if;
  if p_status is not null and p_status not in ('new','reviewed','applied','interview','offer','rejected','withdrawn') then
    raise exception 'Invalid status' using errcode='22023';
  end if;
  select * into original from public.job_matches where id=p_match_id and profile_version=p_profile for update;
  if not found then raise exception 'Match not found' using errcode='P0002'; end if;
  select * into current_state from public.job_workspace_state where match_id=p_match_id;
  if coalesce(current_state.revision,0)<>p_revision then
    raise exception 'State changed; refresh and try again' using errcode='PT409';
  end if;
  insert into public.job_workspace_state as s(match_id,is_saved,application_status,revision)
  values (p_match_id,coalesce(p_is_saved,original.application_status='saved'),
    coalesce(p_status,nullif(original.application_status,'saved'),'new'),1)
  on conflict(match_id) do update set
    is_saved=coalesce(p_is_saved,s.is_saved),
    application_status=coalesce(p_status,s.application_status),
    revision=s.revision+1,updated_at=now()
  returning * into current_state;
  return to_jsonb(current_state);
end $$;
