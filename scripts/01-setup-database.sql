-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create business_profiles table
create table if not exists public.business_profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  industry text,
  company_size text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  tax_id text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quotation_templates table
create table if not exists public.quotation_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  template_name text default 'Default Template',
  primary_color text default '#2563eb',
  secondary_color text default '#64748b',
  layout_style text default 'modern',
  show_company_logo boolean default true,
  show_terms boolean default true,
  show_notes boolean default true,
  show_payment_info boolean default true,
  terms_text text default 'Payment is due within 30 days of invoice date.',
  notes_text text default 'Thank you for your business!',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.business_profiles enable row level security;
alter table public.quotation_templates enable row level security;

-- Create policies for business_profiles
create policy "Users can view their own profile"
  on public.business_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.business_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.business_profiles for insert
  with check (auth.uid() = id);

-- Create policies for quotation_templates
create policy "Users can view their own templates"
  on public.quotation_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on public.quotation_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.quotation_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.quotation_templates for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_updated_at
  before update on public.business_profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.quotation_templates
  for each row
  execute function public.handle_updated_at();
