-- Allow the explicitly seeded owner to claim their verified Google identity.
-- Existing memberships and roles remain unchanged; no account is auto-invited.
create or replace function public.archive_claim_invitation() returns text
language plpgsql security definer set search_path = '' as $$
declare verified_email text; bound jsonb;
begin
 select lower(i.identity_data->>'email') into verified_email from auth.identities i
 join auth.users u on u.id = i.user_id
 where i.user_id = auth.uid() and i.provider = 'google'
 and i.identity_data->>'email_verified' = 'true' and u.email_confirmed_at is not null limit 1;
 if verified_email is not null then
  update public.archive_members set user_id = auth.uid()
   where email = verified_email and active and user_id is null
   and role in ('owner','editor') returning to_jsonb(archive_members.*) into bound;
  if bound is not null then
   insert into public.archive_revisions(entity,entity_id,action,actor,after_data)
    values('members',bound->>'id','invitation_claim',auth.uid(),bound);
  end if;
 end if;
 return public.archive_role();
end $$;
revoke all on function public.archive_claim_invitation() from public,anon;
grant execute on function public.archive_claim_invitation() to authenticated;
