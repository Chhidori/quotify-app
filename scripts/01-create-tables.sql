-- Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  tax_id TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation_templates table
CREATE TABLE IF NOT EXISTS public.quotation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL DEFAULT 'Default Template',
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  secondary_color TEXT NOT NULL DEFAULT '#64748b',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  layout TEXT NOT NULL DEFAULT 'modern',
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_company_details BOOLEAN NOT NULL DEFAULT true,
  show_line_items BOOLEAN NOT NULL DEFAULT true,
  show_terms BOOLEAN NOT NULL DEFAULT true,
  show_notes BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for business_profiles
CREATE POLICY "Users can view own business profile"
  ON public.business_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own business profile"
  ON public.business_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own business profile"
  ON public.business_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for quotation_templates
CREATE POLICY "Users can view own templates"
  ON public.quotation_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.quotation_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.quotation_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_id ON public.business_profiles(id);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_user_id ON public.quotation_templates(user_id);
