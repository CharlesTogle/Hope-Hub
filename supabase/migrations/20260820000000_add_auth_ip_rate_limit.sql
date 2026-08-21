-- Keep auth endpoint attempts in Supabase so the limit is shared by all clients.
create table if not exists public.auth_rate_limit_requests (
  id bigint generated always as identity primary key,
  endpoint text not null check (endpoint in ('login', 'registration')),
  ip_address text not null,
  email_key text,
  requested_at timestamptz not null default now()
);

create index if not exists auth_rate_limit_requests_lookup_idx
  on public.auth_rate_limit_requests (endpoint, ip_address, requested_at);
create index if not exists auth_rate_limit_requests_email_idx
  on public.auth_rate_limit_requests (endpoint, email_key, requested_at)
  where email_key is not null;

create table if not exists public.auth_rate_limit_config (
  endpoint text primary key check (endpoint in ('login', 'registration')),
  max_requests integer not null check (max_requests > 0),
  window_seconds integer not null check (window_seconds > 0)
);

insert into public.auth_rate_limit_config (endpoint, max_requests, window_seconds)
values ('login', 10, 60), ('registration', 10, 60)
on conflict (endpoint) do nothing;

alter table public.auth_rate_limit_requests enable row level security;
alter table public.auth_rate_limit_config enable row level security;

drop function if exists public.check_auth_rate_limit(text, text);

create or replace function public.check_auth_rate_limit(
  p_endpoint text,
  p_ip_address text,
  p_email_key text default null
)
returns table (allowed boolean, request_count integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip_count integer;
  v_email_count integer;
  v_limit integer;
  v_window_seconds integer;
  v_ip_lock_key text;
  v_email_lock_key text;
begin
  select max_requests, window_seconds
    into v_limit, v_window_seconds
  from public.auth_rate_limit_config
  where endpoint = p_endpoint;

  if v_limit is null then
    raise exception 'Unknown auth rate limit endpoint';
  end if;

  v_ip_lock_key := p_endpoint || ':ip:' || p_ip_address;
  v_email_lock_key := p_endpoint || ':email:' || coalesce(p_email_key, '');

  -- Lock both buckets in lexical order so different-IP requests for one email
  -- cannot race and no pair of requests can deadlock.
  if p_email_key is null or v_ip_lock_key < v_email_lock_key then
    perform pg_advisory_xact_lock(hashtext(v_ip_lock_key));
    if p_email_key is not null then
      perform pg_advisory_xact_lock(hashtext(v_email_lock_key));
    end if;
  else
    perform pg_advisory_xact_lock(hashtext(v_email_lock_key));
    perform pg_advisory_xact_lock(hashtext(v_ip_lock_key));
  end if;

  delete from public.auth_rate_limit_requests
  where requested_at < now() - interval '20 minutes';

  select count(*)::integer into v_ip_count
  from public.auth_rate_limit_requests
  where endpoint = p_endpoint
    and ip_address = p_ip_address
    and requested_at >= now() - make_interval(secs => v_window_seconds);

  select count(*)::integer into v_email_count
  from public.auth_rate_limit_requests
  where endpoint = p_endpoint
    and email_key = p_email_key
    and p_email_key is not null
    and requested_at >= now() - make_interval(secs => v_window_seconds);

  if v_ip_count < v_limit and (p_email_key is null or v_email_count < v_limit) then
    insert into public.auth_rate_limit_requests (endpoint, ip_address, email_key)
    values (p_endpoint, p_ip_address, p_email_key);
    return query select true, greatest(v_ip_count, v_email_count) + 1, v_window_seconds;
  else
    return query select false, greatest(v_ip_count, v_email_count), v_window_seconds;
  end if;
end;
$$;

revoke all on table public.auth_rate_limit_requests from anon, authenticated;
revoke all on table public.auth_rate_limit_config from anon, authenticated;
revoke all on function public.check_auth_rate_limit(text, text, text) from public, anon, authenticated;
grant execute on function public.check_auth_rate_limit(text, text, text) to service_role;

-- pg_cron is required for automatic cleanup every five minutes.
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'purge-auth-rate-limit-requests') then
    perform cron.schedule(
      'purge-auth-rate-limit-requests',
      '*/5 * * * *',
      $job$delete from public.auth_rate_limit_requests where requested_at < now() - interval '20 minutes'$job$
    );
  end if;
end;
$$;
