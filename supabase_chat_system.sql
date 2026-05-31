-- 1. Create robust chat messages table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message_text text,
  file_url text,
  file_name text,
  file_type text,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

-- 2. Create indexes for quick queries
create index if not exists idx_chat_messages_student_id on public.chat_messages(student_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

-- 3. Enable Row-Level Security (RLS)
alter table public.chat_messages enable row level security;

-- 4. RLS Policies
-- Policy 1: Allows admins full access to chat messages
create policy "Admins have full access to chat_messages"
on public.chat_messages for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (community_role = 'admin' or role_title = 'admin')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and (community_role = 'admin' or role_title = 'admin')
  )
);

-- Policy 2: Allows students to select their own messages
create policy "Students can view their own messages"
on public.chat_messages for select
using (
  student_id = auth.uid()
);

-- Policy 3: Allows students to send messages in their own thread
create policy "Students can insert their own messages"
on public.chat_messages for insert
with check (
  student_id = auth.uid() and sender_id = auth.uid()
);

-- 5. Add to Realtime Publication to stream messages instantly
-- Check if the table is already in a publication before adding it to avoid errors
do $$
begin
  if not exists (
    select 1 
    from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
exception
  when others then
    -- Catch exceptions if publication doesn't exist
    raise notice 'Real-time publication step skipped or failed. Ensure publication exists.';
end $$;
