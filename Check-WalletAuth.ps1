#!/usr/bin/env pwsh

# ============================================================================
# WALLET AUTHORIZATION DIAGNOSTIC SCRIPT
# Checks all connections and configurations for wallet-based authentication
# ============================================================================

Write-Host "`n🔍 WALLET AUTHENTICATION DIAGNOSTIC REPORT`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================================
# PART 1: Check Environment Variables
# ============================================================================

Write-Host "`n📝 PART 1: Environment Variables" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$envFiles = @(
  "D:\NayaSutra\frontend\.env.local",
  "D:\NayaSutra\frontend\.env",
  "D:\NayaSutra\admin-panel\.env.local"
)

foreach ($envFile in $envFiles) {
  Write-Host "`nChecking: $envFile" -ForegroundColor Cyan
    
  if (Test-Path $envFile) {
    Write-Host "   ✅ File exists" -ForegroundColor Green
        
    $content = Get-Content $envFile -Raw
        
    if ($content -match "VITE_SUPABASE_URL") {
      Write-Host "   ✅ VITE_SUPABASE_URL found" -ForegroundColor Green
      $url = ($content -match "VITE_SUPABASE_URL=(.+)" | ForEach-Object { $matches[1] })
      Write-Host "      Value: $($url.Split("`n")[0])" -ForegroundColor Gray
    }
    else {
      Write-Host "   ❌ VITE_SUPABASE_URL NOT found" -ForegroundColor Red
    }
        
    if ($content -match "VITE_SUPABASE_PUBLISHABLE_KEY") {
      Write-Host "   ✅ VITE_SUPABASE_PUBLISHABLE_KEY found" -ForegroundColor Green
    }
    else {
      Write-Host "   ❌ VITE_SUPABASE_PUBLISHABLE_KEY NOT found" -ForegroundColor Red
    }
  }
  else {
    Write-Host "   ❌ File not found" -ForegroundColor Red
  }
}

# ============================================================================
# PART 2: Check Supabase Connection
# ============================================================================

Write-Host "`n📡 PART 2: Supabase Connection" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$supabaseUrl = "https://hkcjnhorafvhfqqcxxii.supabase.co"
Write-Host "`nTesting connection to: $supabaseUrl" -ForegroundColor Cyan

try {
  $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method OPTIONS -TimeoutSec 5 -ErrorAction Stop
  Write-Host "   ✅ Supabase REST API is accessible" -ForegroundColor Green
  Write-Host "      Status Code: $($response.StatusCode)" -ForegroundColor Gray
}
catch {
  Write-Host "   ❌ Cannot reach Supabase REST API" -ForegroundColor Red
  Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# ============================================================================
# PART 3: Check Database Files
# ============================================================================

Write-Host "`n🗄️  PART 3: Database Migration Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$migrationFiles = @(
  @{Name = "MAIN.sql"; Path = "D:\NayaSutra\backend\supabase\migrations\MAIN.sql" },
  @{Name = "ADD_WALLET_VERIFICATION.sql"; Path = "D:\NayaSutra\backend\supabase\migrations\ADD_WALLET_VERIFICATION.sql" },
  @{Name = "CLEANUP_UNUSED_TABLES.sql"; Path = "D:\NayaSutra\backend\supabase\migrations\CLEANUP_UNUSED_TABLES.sql" }
)

foreach ($file in $migrationFiles) {
  if (Test-Path $file.Path) {
    Write-Host "   ✅ $($file.Name)" -ForegroundColor Green
        
    $content = Get-Content $file.Path -Raw
        
    # Check for key components
    if ($file.Name -eq "ADD_WALLET_VERIFICATION.sql") {
      if ($content -match "verify_wallet_authorization") {
        Write-Host "      ✅ Contains verify_wallet_authorization function" -ForegroundColor Green
      }
      else {
        Write-Host "      ❌ Missing verify_wallet_authorization function" -ForegroundColor Red
      }
            
      if ($content -match "wallet_address") {
        Write-Host "      ✅ Contains wallet_address column" -ForegroundColor Green
      }
      else {
        Write-Host "      ❌ Missing wallet_address column" -ForegroundColor Red
      }
            
      if ($content -match "is_wallet_verified") {
        Write-Host "      ✅ Contains is_wallet_verified column" -ForegroundColor Green
      }
      else {
        Write-Host "      ❌ Missing is_wallet_verified column" -ForegroundColor Red
      }
    }
  }
  else {
    Write-Host "   ❌ $($file.Name) - NOT FOUND" -ForegroundColor Red
  }
}

# ============================================================================
# PART 4: Check Frontend Service Files
# ============================================================================

Write-Host "`n🎨 PART 4: Frontend Authentication Services" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$serviceFiles = @(
  @{Name = "walletVerificationService"; Path = "D:\NayaSutra\frontend\src\services\walletVerificationService.ts" },
  @{Name = "Auth.tsx"; Path = "D:\NayaSutra\frontend\src\pages\Auth.tsx" },
  @{Name = "AuthContext"; Path = "D:\NayaSutra\frontend\src\contexts\AuthContext.tsx" },
  @{Name = "Web3Context"; Path = "D:\NayaSutra\frontend\src\contexts\Web3Context.tsx" }
)

foreach ($file in $serviceFiles) {
  if (Test-Path $file.Path) {
    Write-Host "   ✅ $($file.Name)" -ForegroundColor Green
        
    $content = Get-Content $file.Path -Raw
        
    if ($file.Name -eq "walletVerificationService") {
      if ($content -match "verifyWalletAuthorization") {
        Write-Host "      ✅ Contains verifyWalletAuthorization function" -ForegroundColor Green
      }
      if ($content -match "verify_wallet_authorization") {
        Write-Host "      ✅ Calls database RPC function" -ForegroundColor Green
      }
      else {
        Write-Host "      ❌ Does not call RPC function" -ForegroundColor Red
      }
    }
        
    if ($file.Name -eq "Auth.tsx") {
      if ($content -match "verifyWalletAuthorization") {
        Write-Host "      ✅ Calls wallet verification" -ForegroundColor Green
      }
    }
  }
  else {
    Write-Host "   ❌ $($file.Name) - NOT FOUND" -ForegroundColor Red
  }
}

# ============================================================================
# PART 5: Check Admin Panel
# ============================================================================

Write-Host "`n🛠️  PART 5: Admin Panel Setup" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$adminFiles = @(
  @{Name = "App.tsx"; Path = "D:\NayaSutra\admin-panel\src\App.tsx" },
  @{Name = "supabase client"; Path = "D:\NayaSutra\admin-panel\src\lib\supabase.ts" }
)

foreach ($file in $adminFiles) {
  if (Test-Path $file.Path) {
    Write-Host "   ✅ $($file.Name)" -ForegroundColor Green
  }
  else {
    Write-Host "   ❌ $($file.Name) - NOT FOUND" -ForegroundColor Red
  }
}

# ============================================================================
# PART 6: Recommended SQL Queries
# ============================================================================

Write-Host "`n🔧 PART 6: Database Verification Queries" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`nRun these in Supabase SQL Editor to verify data:" -ForegroundColor Cyan

Write-Host "`n1️⃣  Check if wallet exists for judiciary role:" -ForegroundColor White
Write-Host @"
   SELECT 
     wallet_address,
     full_name,
     role_category,
     is_wallet_verified,
     created_at
   FROM public.profiles
   WHERE role_category = 'judiciary'
   ORDER BY created_at DESC;
"@ -ForegroundColor Gray

Write-Host "`n2️⃣  Check specific wallet authorization:" -ForegroundColor White
Write-Host @"
   SELECT * FROM public.verify_wallet_authorization(
     '0xYourWalletAddress',
     'judiciary'
   );
"@ -ForegroundColor Gray

Write-Host "`n3️⃣  List all wallets by role:" -ForegroundColor White
Write-Host @"
   SELECT 
     role_category,
     COUNT(*) as total_users,
     COUNT(CASE WHEN is_wallet_verified THEN 1 END) as verified,
     COUNT(CASE WHEN NOT is_wallet_verified THEN 1 END) as unverified
   FROM public.profiles
   GROUP BY role_category;
"@ -ForegroundColor Gray

Write-Host "`n4️⃣  Test RPC function exists:" -ForegroundColor White
Write-Host @"
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'verify_wallet_authorization';
"@ -ForegroundColor Gray

# ============================================================================
# PART 7: Summary and Next Steps
# ============================================================================

Write-Host "`n✅ SUMMARY & NEXT STEPS" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host @"
If you're seeing "Your wallet is not authorized for the judiciary role":

1. **Verify Wallet Exists:**
   - Run Query #1 above in Supabase SQL Editor
   - Make sure your wallet appears in the results

2. **If Wallet Not Found:**
   - Go to Admin Panel (http://localhost:5173/admin-panel)
   - Add the wallet with "judiciary" role
   - Click the lock icon to verify it

3. **If Wallet is Unverified:**
   - Go to Admin Panel
   - Find your wallet in the list
   - Click the lock icon (🔒) to toggle verification

4. **Test the RPC Function:**
   - Run Query #4 to confirm function exists
   - Run Query #2 with your wallet address

5. **Check Browser Console:**
   - Press F12 → Console tab
   - Try to login and look for error messages
   - Check Network tab for RPC calls to Supabase

6. **Check Supabase Logs:**
   - Go to Supabase Console
   - Check the Edge Function logs
   - Look for RPC function errors

For detailed diagnostics, see: WALLET_AUTH_DIAGNOSTICS.md
"@ -ForegroundColor White

Write-Host "`n" + "=" * 70 -ForegroundColor Gray
Write-Host "✨ Diagnostic report complete!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray + "`n"

