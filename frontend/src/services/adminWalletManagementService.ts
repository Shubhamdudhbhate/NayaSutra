/**
 * ADMIN WALLET MANAGEMENT SERVICE
 * Backend-only operations for managing wallet addresses and roles
 * 
 * This should only be accessible from an admin dashboard/backend
 * NOT exposed to regular frontend users
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserRegistration {
  email: string;
  fullName: string;
  walletAddress: string;
  roleCategory: "judiciary" | "lawyer" | "clerk" | "police" | "public_party";
  phone?: string;
}

export interface WalletUpdateRequest {
  profileId: string;
  newWalletAddress: string;
  reason: string;
}

/**
 * ADMIN: Register a new user with wallet address and role
 * This is the ONLY way users should be created - manually by admins
 * Returns the created profile or error
 */
export async function adminRegisterUserWithWallet(
  registration: UserRegistration
): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}> {
  try {
    // Validate admin access
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    if (!currentAuthUser?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role_category")
      .eq("user_id", currentAuthUser.id)
      .maybeSingle();

    if (adminProfile?.role_category !== "admin" && adminProfile?.role_category !== "judiciary") {
      return {
        success: false,
        error: "Unauthorized: Only admins can register users",
      };
    }

    // Normalize wallet address
    const normalizedWallet = registration.walletAddress.toLowerCase();

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", normalizedWallet)
      .maybeSingle();

    if (existingWallet) {
      return {
        success: false,
        error: "This wallet address is already registered",
      };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", registration.email)
      .maybeSingle();

    if (existingEmail) {
      return {
        success: false,
        error: "This email is already registered",
      };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: registration.email,
      password: `ns_temp_${Math.random().toString(36).substring(7)}`, // Random temp password
      email_confirm: true,
      user_metadata: {
        full_name: registration.fullName,
        role_category: registration.roleCategory,
        wallet_address: normalizedWallet,
      },
    });

    if (authError) {
      return {
        success: false,
        error: `Failed to create auth user: ${authError.message}`,
      };
    }

    // Create profile with wallet address
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email: registration.email,
        full_name: registration.fullName,
        role_category: registration.roleCategory,
        phone: registration.phone || null,
        wallet_address: normalizedWallet,
        is_wallet_verified: true, // Admin verified
        wallet_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    // Log the action
    await supabase.from("wallet_audit_log").insert({
      profile_id: profile.id,
      action: "wallet_added",
      new_value: normalizedWallet,
      changed_by: currentAuthUser.id,
    } as any);

    return {
      success: true,
      profileId: profile.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to register user with wallet",
    };
  }
}

/**
 * ADMIN: Update a user's wallet address
 * Creates an audit trail of the change
 */
export async function adminUpdateUserWallet(
  request: WalletUpdateRequest
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate admin access
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    if (!currentAuthUser?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role_category")
      .eq("user_id", currentAuthUser.id)
      .maybeSingle();

    if (adminProfile?.role_category !== "admin" && adminProfile?.role_category !== "judiciary") {
      return {
        success: false,
        error: "Unauthorized: Only admins can update wallets",
      };
    }

    const normalizedWallet = request.newWalletAddress.toLowerCase();

    // Get current wallet for audit
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", request.profileId)
      .maybeSingle();

    if (!profile) {
      return {
        success: false,
        error: "Profile not found",
      };
    }

    // Check if new wallet is already in use
    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", normalizedWallet)
      .neq("id", request.profileId)
      .maybeSingle();

    if (existingWallet) {
      return {
        success: false,
        error: "New wallet address is already in use",
      };
    }

    // Update wallet address
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        wallet_address: normalizedWallet,
        is_wallet_verified: true,
        wallet_verified_at: new Date().toISOString(),
      })
      .eq("id", request.profileId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update wallet: ${updateError.message}`,
      };
    }

    // Log the change
    await supabase.from("wallet_audit_log").insert({
      profile_id: request.profileId,
      action: "wallet_changed",
      old_value: (profile as any)?.wallet_address || null,
      new_value: normalizedWallet,
      changed_by: currentAuthUser.id,
    } as any);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update wallet",
    };
  }
}

/**
 * ADMIN: Get all users with their wallet status
 * For admin dashboard
 */
export async function adminGetAllUsersWithWallets() {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role_category, wallet_address, is_wallet_verified, wallet_verified_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }

    return users || [];
  } catch (error: any) {
    console.error("Exception fetching users:", error);
    return [];
  }
}

/**
 * ADMIN: Search user by wallet address
 */
export async function adminSearchUserByWallet(walletAddress: string) {
  try {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role_category, wallet_address, is_wallet_verified")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error searching user:", error);
      return null;
    }

    return user;
  } catch (error: any) {
    console.error("Exception searching user:", error);
    return null;
  }
}

/**
 * ADMIN: Verify or unverify a wallet
 */
export async function adminVerifyWallet(
  profileId: string,
  verify: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_wallet_verified: verify,
        wallet_verified_at: verify ? new Date().toISOString() : null,
      })
      .eq("id", profileId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update wallet verification",
    };
  }
}
