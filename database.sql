-- ============================================================
-- Galeria de Prompts – execute no SQL Editor do Supabase
-- ============================================================

create table if not exists categories (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  name       text        not null,
  icon       text        not null default '📁',
  created_at timestamptz default now()
);

create table if not exists subcategories (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  cat_id     uuid        references categories(id) on delete cascade not null,
  name       text        not null,
  created_at timestamptz default now()
);

create table if not exists prompts (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  cat_id     uuid        references categories(id) on delete cascade not null,
  sub_id     uuid        references subcategories(id) on delete set null,
  name       text        not null,
  text       text        not null default '',
  img        text,
  aspect     text        not null default '1:1',
  created_at timestamptz default now()
);

-- Row Level Security
alter table categories    enable row level security;
alter table subcategories enable row level security;
alter table prompts       enable row level security;

create policy "Usuários gerenciam suas categorias"
  on categories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários gerenciam suas subcategorias"
  on subcategories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários gerenciam seus prompts"
  on prompts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
