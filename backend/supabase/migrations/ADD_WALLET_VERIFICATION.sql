-- ==============================================================================
-- MIGRATION: ADD WALLET ADDRESS & VERIFICATION TO PROFILES
-- Purpose: Enable wallet-based authentication with role verification
-- ==============================================================================

BEGIN;

-- ==========================================
-- 1. ADD WALLET COLUMNS TO PROFILES
-- ==========================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_wallet_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_verified ON public.profiles(is_wallet_verified);

-- ==========================================
-- 2. CREATE AUDIT TABLE FOR WALLET CHANGES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.wallet_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'wallet_added', 'wallet_verified', 'wallet_changed', 'role_assigned'
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_wallet_audit_profile_id ON public.wallet_audit_log(profile_id);

-- ==========================================
-- 3. CREATE VERIFICATION FUNCTION
-- ==========================================

-- Function to verify wallet address matches during login
CREATE OR REPLACE FUNCTION public.verify_wallet_authorization(
  p_wallet_address TEXT,
  p_role_category TEXT
)
RETURNS TABLE (
  is_authorized BOOLEAN,
  profile_id UUID,
  full_name TEXT,
  role_category public.user_role_category
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p_wallet_address = profiles.wallet_address AND profiles.role_category::TEXT = p_role_category AND profiles.is_wallet_verified) AS is_authorized,
    profiles.id,
    profiles.full_name,
    profiles.role_category
  FROM public.profiles
  WHERE profiles.wallet_address ILIKE p_wallet_address
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. UPDATE RLS POLICIES FOR WALLET CHECKS
-- ==========================================

-- Ensure wallet address can only be updated by admins/system
DROP POLICY IF EXISTS "wallet_address_immutable" ON public.profiles;
CREATE POLICY "wallet_address_immutable" ON public.profiles 
FOR UPDATE USING (false) -- Prevent user updates to wallet_address
WITH CHECK (false);

-- ==========================================
-- 5. CREATE FUNCTION TO LOG WALLET CHANGES
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_wallet_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.wallet_address IS DISTINCT FROM NEW.wallet_address) THEN
    INSERT INTO public.wallet_audit_log (profile_id, action, old_value, new_value, changed_by)
    VALUES (NEW.id, 'wallet_changed', OLD.wallet_address, NEW.wallet_address, auth.uid());
  END IF;
  
  IF (OLD.is_wallet_verified IS DISTINCT FROM NEW.is_wallet_verified) THEN
    INSERT INTO public.wallet_audit_log (profile_id, action, old_value, new_value, changed_by)
    VALUES (NEW.id, CASE WHEN NEW.is_wallet_verified THEN 'wallet_verified' ELSE 'wallet_unverified' END, OLD.is_wallet_verified::TEXT, NEW.is_wallet_verified::TEXT, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log wallet changes
DROP TRIGGER IF EXISTS log_wallet_changes_trigger ON public.profiles;
CREATE TRIGGER log_wallet_changes_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_wallet_change();

-- ==========================================
-- 6. ENABLE RLS ON AUDIT TABLE
-- ==========================================

ALTER TABLE public.wallet_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins/system can view audit logs
DROP POLICY IF EXISTS "admin_view_wallet_audit" ON public.wallet_audit_log;
CREATE POLICY "admin_view_wallet_audit" ON public.wallet_audit_log
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role_category = 'admin')
);

COMMIT;
