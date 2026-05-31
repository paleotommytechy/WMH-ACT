-- 1. Create the database table to store student-formed groups ("Circles")
create table if not exists public.chat_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 2. Create membership register linking users with groups
create table if not exists public.chat_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.chat_groups(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  unique (group_id, profile_id)
);

-- 3. Create messages table for conversational records within groups
create table if not exists public.chat_group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.chat_groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text not null,
  message_text text,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz default now() not null
);

-- 4. Set indexes to make communication querying extremely responsive
create index if not exists idx_chat_group_members_profile_id on public.chat_group_members(profile_id);
create index if not exists idx_chat_group_messages_group_id on public.chat_group_messages(group_id);
create index if not exists idx_chat_group_messages_created_at on public.chat_group_messages(created_at);

-- 5. Enable Row-Level Security (RLS)
alter table public.chat_groups enable row level security;
alter table public.chat_group_members enable row level security;
alter table public.chat_group_messages enable row level security;

-- 6. DDL Row-Level Security Policies

-- Policies for chat_groups
create policy "Anyone authenticated can view chat groups"
  on public.chat_groups for select
  using (auth.uid() is not null);

create policy "Users can instantiate chat groups"
  on public.chat_groups for insert
  with check (auth.uid() = created_by);

-- Policies for chat_group_members
create policy "Members are viewable by anyone in the fellowship"
  on public.chat_group_members for select
  using (auth.uid() is not null);

create policy "Users can join chats or add recruits"
  on public.chat_group_members for insert
  with check (auth.uid() is not null);

-- Policies for chat_group_messages
create policy "Group members can preview messages"
  on public.chat_group_messages for select
  using (
    exists (
      select 1 from public.chat_group_members
      where group_id = chat_group_messages.group_id
      and profile_id = auth.uid()
    )
  );

create policy "Group members can send messages"
  on public.chat_group_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_group_members
      where group_id = chat_group_messages.group_id
      and profile_id = auth.uid()
    )
  );

-- 7. Add tables to Supabase Realtime publication to enable instant UI streaming updates
do $$
begin
  if not exists (
    select 1 
    from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'chat_group_messages'
  ) then
    alter publication supabase_realtime add table public.chat_group_messages;
  end if;
  
  if not exists (
    select 1 
    from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'chat_groups'
  ) then
    alter publication supabase_realtime add table public.chat_groups;
  end if;
exception
  when others then
    raise notice 'Realtime replication setup skipped. Ensure the database supports it.';
end $$;
