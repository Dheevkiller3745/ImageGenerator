# STATICs — Production Setup & SQL Walkthrough

This guide details the steps required to transition your local/preview workspace into a production-grade, scalable SaaS platform. It includes the complete SQL schema, security policies (RLS), CDN configurations, and SaaS/SEO checklists.

---

## 1. Supabase Database Setup (SQL Console)
Run the following SQL script inside the **Supabase SQL Editor** to create the necessary tables, triggers, and Row-Level Security (RLS) rules.

### Schema Script
```sql
-- ========================================================
-- 1. PROFILES TABLE (Auto-synced from Supabase Auth Users)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========================================================
-- 2. USER SESSIONS TABLE (Device session tracking)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    device_info TEXT NOT NULL,
    ip_address TEXT DEFAULT 'Unknown' NOT NULL,
    logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for Sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log their own sessions" 
ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ========================================================
-- 3. GENERATIONS LOG (Telemetry for image prompts)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.generations_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    seed TEXT DEFAULT '-1' NOT NULL,
    engine TEXT NOT NULL,
    aspect_ratio TEXT DEFAULT 'square' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.generations_log ENABLE ROW LEVEL SECURITY;

-- Policies for Generations
CREATE POLICY "Users can select their own generation logs" 
ON public.generations_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation logs" 
ON public.generations_log FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ========================================================
-- 4. LEADS LOG (WhatsApp refinement conversions)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.leads_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    target_prompt TEXT NOT NULL,
    whatsapp_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads_log ENABLE ROW LEVEL SECURITY;

-- Policies for Leads (Public insert enabled so leads can register, restrict reads to admins)
CREATE POLICY "Anyone can submit a lead" 
ON public.leads_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view lead lists" 
ON public.leads_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email LIKE '%@statics.agency'
    )
);
```

---

## 2. Google OAuth Integration Checklists
Ensure the callback URLs are aligned across Google and Supabase to maintain login session persistence.

### Google Cloud Console (OAuth Client ID)
*   **Application Type**: Web Application
*   **Name**: AetherImage Workspace
*   **Authorised JavaScript origins**:
    *   `http://localhost:3000` *(Local Dev)*
    *   `https://image-generator-git-main-soumyadeep-biswas-projects-024eec7c.vercel.app` *(Production Vercel Domain)*
*   **Authorised redirect URIs**:
    *   `https://sgwzalergcnkeqvzwefq.supabase.co/auth/v1/callback` *(Your Supabase Project Link)*

### Supabase Settings Configuration
1.  Navigate to **Authentication** -> **Sign In / Providers** -> **Google**.
2.  Enable Google login, and copy-paste the **Client ID** and **Client Secret** provided by Google.
3.  Go to **Authentication** -> **URL Configuration**:
    *   **Site URL**: Update to `https://image-generator-git-main-soumyadeep-biswas-projects-024eec7c.vercel.app`.
    *   **Redirect URLs**: Add `https://image-generator-git-main-soumyadeep-biswas-projects-024eec7c.vercel.app/auth/callback`.

---

## 3. CDN & Storage Bucket Setup
For scaling image storage and upscaling processes, set up a Supabase Storage bucket for storing assets:
1.  Go to the **Storage** tab in Supabase.
2.  Click **New Bucket** and name it `generations`.
3.  Set the bucket to **Public** so generated images can be served directly from Supabase's Cloudflare CDN.
4.  Configure an RLS policy for the bucket to only allow authenticated users to upload:
    ```sql
    -- Allow authenticated users to upload to generations bucket
    CREATE POLICY "Allow authenticated uploads" 
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'generations');
    ```

---

## 4. SaaS Refinement & Lead Routing
The leads pipeline routes generated prompts and seed values to a WhatsApp agency target link:
*   The WhatsApp dispatch link formats the message as follows:
    ```
    wa.me/+1234567890?text=Hello!...My+name+is+...
    ```
*   When a user clicks "Refine on WhatsApp", their contact metadata logs inside `leads_log` for agency tracking, enabling you to upsell vectorization, layout design, or custom upscale services.

---

## 5. SEO Best Practices
This codebase automatically enforces SEO guidelines for Next.js App Router:
*   **Descriptive Titles & Meta**: Defined in the static layout and metadata hooks inside `src/app/layout.tsx`.
*   **Semantic Structure**: Single `<h1>` per view, hierarchical headings (`<h2>` and `<h3>` nested sequentially).
*   **Interactive Identifiers**: Descriptive, unique `id` selectors added to all input elements (e.g., `#promptInput`, `#rememberStyleToggle`) to simplify automation scripts.
