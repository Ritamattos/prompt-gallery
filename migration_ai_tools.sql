-- Migration: add ai_tools table
-- Execute no SQL Editor do Supabase

create table if not exists ai_tools (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users not null,
  name        text        not null,
  description text        not null default '',
  url         text        not null default '',
  img         text,
  sort_order  integer     not null default 0,
  created_at  timestamptz default now()
);

alter table ai_tools enable row level security;

create policy "Usuários gerenciam suas ferramentas de IA"
  on ai_tools for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);