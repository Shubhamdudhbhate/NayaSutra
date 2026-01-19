import { supabase } from "@/integrations/supabase/client";

/**
 * WALLET VERIFICATION SERVICE
 * Handles backend verification of wallet addresses for role-based authentication
 */

export interface WalletAuthRequest {
  walletAddress: string;
  roleName: string; // 'judiciary', 'lawyer', 'clerk', 'police', 'public_party'
  signature?: string; // Message signature for additional verification
  message?: string; // Original signed message
}

export interface WalletAuthResponse {
  isAuthorized: boolean;
  profileId?: string;
  fullName?: string;
  roleCategory?: string;
  error?: string;
}

/**
 * Verify that a wallet address is authorized for a specific role
 * This is the main security check for wallet-based authentication
 */
export async function verifyWalletAuthorization(
  walletAddress: string,
  roleCategory: string
): Promise<WalletAuthResponse> {
  try {
    // Validate inputs
    if (!walletAddress || !roleCategory) {
      return {
        isAuthorized: false,
        error: "Missing wallet address or role",
      };
    }

    // Query the database to verify wallet exists and matches role
    const { data, error } = await supabase.rpc(
      "verify_wallet_authorization",
      {
        p_wallet_address: walletAddress.toLowerCase(),
        p_role_category: roleCategory,
      }
    );

    if (error) {
      console.error("Wallet verification error:", error);
      return {
        isAuthorized: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        isAuthorized: false,
        error: "Wallet not found or not authorized for this role",
      };
    }

    const result = data[0] as {
      is_authorized: boolean;
      profile_id: string;
      full_name: string;
      role_category: string;
    };

    return {
      isAuthorized: result.is_authorized,
      profileId: result.profile_id,
      fullName: result.full_name,
      roleCategory: result.role_category,
    };
  } catch (error: any) {
    console.error("Wallet verification exception:", error);
    return {
      isAuthorized: false,
      error: error?.message || "Wallet verification failed",
    };
  }
}

/**
 * Get wallet verification status for a profile
 */
export async function getWalletStatus(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role_category, wallet_address, is_wallet_verified")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error fetching wallet status:", error);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error("Exception fetching wallet status:", error);
    return null;
  }
}

/**
 * Log a wallet action (for audit trail)
 * This should only be called from admin/backend context
 */
export async function logWalletAction(
  profileId: string,
  action: "wallet_added" | "wallet_verified" | "wallet_changed" | "role_assigned",
  oldValue?: string,
  newValue?: string
) {
  try {
    const { error } = await supabase
      .from("wallet_audit_log")
      .insert({
        profile_id: profileId,
        action,
        old_value: oldValue || null,
        new_value: newValue || null,
        changed_by: null, // Will be set by trigger if auth context exists
      } as any);

    if (error) {
      console.error("Error logging wallet action:", error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Exception logging wallet action:", error);
    return false;
  }
}

/**
 * Get wallet audit history for a profile
 * Only accessible to admins
 */
export async function getWalletAuditLog(profileId: string) {
  try {
    const { data, error } = await supabase
      .from("wallet_audit_log")
      .select("*, changed_by:profiles(full_name)")
      .eq("profile_id", profileId)
      .order("changed_at", { ascending: false });

    if (error) {
      console.error("Error fetching wallet audit log:", error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error("Exception fetching wallet audit log:", error);
    return [];
  }
}
