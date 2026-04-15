-- Migration: add ai_categories table and ai_cat_id to ai_tools
-- Execute no SQL Editor do Supabase

create table if not exists ai_categories (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  name       text        not null,
  icon       text        not null default '🤖',
  sort_order integer     not null default 0,
  created_at timestamptz default now()
);

alter table ai_categories enable row level security;

create policy "Usuários gerenciam suas categorias de IA"
  on ai_categories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table ai_tools
  add column if not exists ai_cat_id uuid references ai_categories(id) on delete set null;