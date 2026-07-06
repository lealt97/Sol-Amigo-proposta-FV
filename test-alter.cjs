require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url.replace(/\/rest\/v1\/?$/, ''), key);

async function run() {
  const sql = `
CREATE TABLE IF NOT EXISTS public.pdf_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  svg_content TEXT,
  default_theme JSONB,
  page_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.pdf_user_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id UUID REFERENCES public.pdf_template_presets(id) ON DELETE SET NULL,
  source_model_id UUID REFERENCES public.pdf_user_models(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  theme JSONB,
  logo_url TEXT,
  cover_image_url TEXT,
  logo_transform JSONB,
  cover_image_transform JSONB,
  page_config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pdf_template_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_user_models ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Presets are viewable by all users" ON public.pdf_template_presets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own models" ON public.pdf_user_models FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own models" ON public.pdf_user_models FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own models" ON public.pdf_user_models FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own models" ON public.pdf_user_models FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
`;
  
  // We don't have execute_sql available since previously it failed. Wait, how did we add 'history' to proposals? We didn't, we just added it and then realized we can't alter so we removed it.
  // Actually, I can create these tables in Supabase if the user can execute it, but I don't have the execute_sql function in Supabase.
  // Wait, let's see if the tables already exist or if we can use the existing `pdf_cover_templates` table.
}
run();
