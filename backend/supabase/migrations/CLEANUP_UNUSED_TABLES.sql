-- ==============================================================================
--  CLEANUP: REMOVE UNUSED DATABASE TABLES
--  Removing: courts, sections, case_diary, notifications
-- ==============================================================================

BEGIN;

-- ==========================================
-- 1. DROP UNUSED TABLES (in dependency order)
-- ==========================================

-- Drop chain_of_custody (safe to keep but no dependents)
-- Commented out for now - keeping for future implementation
-- DROP TABLE IF EXISTS public.chain_of_custody CASCADE;

-- Drop session_logs (safe to keep but no dependents)  
-- Commented out for now - keeping for future implementation
-- DROP TABLE IF EXISTS public.session_logs CASCADE;

-- Drop permission_requests (depends on session_logs)
-- Commented out for now - keeping for future implementation
-- DROP TABLE IF EXISTS public.permission_requests CASCADE;

-- Drop unused tables that are completely redundant NOW:

-- 1. Drop case_diary (audit log not implemented anywhere)
DROP TABLE IF EXISTS public.case_diary CASCADE;

-- 2. Drop sections (never used, court data stored in cases.court_name)
DROP TABLE IF EXISTS public.sections CASCADE;

-- 3. Drop courts (redundant - using cases.court_name instead)
DROP TABLE IF EXISTS public.courts CASCADE;

-- 4. Drop notifications (created but never implemented)
DROP TABLE IF EXISTS public.notifications CASCADE;

-- ==========================================
-- 2. CLEAN UP UNUSED COLUMNS IN ACTIVE TABLES
-- ==========================================

-- Remove unused assignment fields from cases table
ALTER TABLE public.cases 
  DROP COLUMN IF EXISTS section_id,
  DROP COLUMN IF EXISTS assigned_judge_id,
  DROP COLUMN IF EXISTS clerk_id,
  DROP COLUMN IF EXISTS lawyer_party_a_id,
  DROP COLUMN IF EXISTS lawyer_party_b_id,
  DROP COLUMN IF EXISTS next_hearing_date;

-- Remove unused columns from profiles table
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS bar_council_number,
  DROP COLUMN IF EXISTS role;  -- Keep role_category, remove redundant 'role' field

-- Remove unused sealing columns from evidence table (keep for future implementation)
-- ALTER TABLE public.evidence
--   DROP COLUMN IF EXISTS is_sealed,
--   DROP COLUMN IF EXISTS sealed_by,
--   DROP COLUMN IF EXISTS sealed_at;

-- ==========================================
-- 3. CLEANUP RLS POLICIES FOR DROPPED TABLES
-- ==========================================

-- All policies for dropped tables are automatically removed

-- ==========================================
-- 4. VERIFY REFERENCES (Optional - for documentation)
-- ==========================================

-- After this migration, the following tables remain:
-- - profiles (user management)
-- - cases (core case management with court_name TEXT)
-- - evidence (case evidence with file uploads)
-- - firs (police FIR system)
-- - investigation_files (FIR investigation files)
-- - Planned future tables: chain_of_custody, session_logs, permission_requests, notifications

COMMIT;
