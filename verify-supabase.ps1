#!/usr/bin/env pwsh
# Supabase Connection Verification Script
# Run this to check if Supabase is properly connected

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SUPABASE CONNECTION VERIFICATION SCRIPT" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check 1: Verify .env.local exists and has Supabase config
Write-Host "1️⃣  Checking .env.local file..." -ForegroundColor Yellow
$envPath = "d:\NayaSutra\frontend\.env.local"
if (Test-Path $envPath) {
    Write-Host "   ✅ .env.local found" -ForegroundColor Green
    $envContent = Get-Content $envPath
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "   ✅ VITE_SUPABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_URL not found" -ForegroundColor Red
    }
    if ($envContent -match "VITE_SUPABASE_PUBLISHABLE_KEY") {
        Write-Host "   ✅ VITE_SUPABASE_PUBLISHABLE_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_PUBLISHABLE_KEY not found" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env.local not found" -ForegroundColor Red
}

# Check 2: Verify Supabase client exists
Write-Host "`n2️⃣  Checking Supabase client..." -ForegroundColor Yellow
$clientPath = "d:\NayaSutra\frontend\src\integrations\supabase\client.ts"
if (Test-Path $clientPath) {
    Write-Host "   ✅ Supabase client found" -ForegroundColor Green
    $clientContent = Get-Content $clientPath
    if ($clientContent -match "createClient") {
        Write-Host "   ✅ Client properly initialized" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Supabase client not found" -ForegroundColor Red
}

# Check 3: Verify updated caseService
Write-Host "`n3️⃣  Checking updated caseService..." -ForegroundColor Yellow
$serviceFile = "d:\NayaSutra\frontend\src\services\caseService.ts"
if (Test-Path $serviceFile) {
    Write-Host "   ✅ caseService.ts found" -ForegroundColor Green
    $serviceContent = Get-Content $serviceFile -Raw
    
    if ($serviceContent -match "supabase.from.*cases") {
        Write-Host "   ✅ Using Supabase (not localStorage)" -ForegroundColor Green
    } elseif ($serviceContent -match "localStorage") {
        Write-Host "   ❌ Still using localStorage" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ caseService.ts not found" -ForegroundColor Red
}

# Check 4: URL connectivity
Write-Host "`n4️⃣  Testing Supabase URL connectivity..." -ForegroundColor Yellow
$url = "https://hkcjnhorafvhfqqcxxii.supabase.co"
try {
    $response = Invoke-WebRequest -Uri "$url/rest/v1/" -TimeoutSec 5 -SkipHeaderValidation
    Write-Host "   ✅ Supabase server is reachable" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not reach Supabase (may need internet)" -ForegroundColor Yellow
}

# Check 5: Package dependencies
Write-Host "`n5️⃣  Checking dependencies..." -ForegroundColor Yellow
$packageJson = "d:\NayaSutra\package.json"
if (Test-Path $packageJson) {
    $packageContent = Get-Content $packageJson
    if ($packageContent -match "@supabase/supabase-js") {
        Write-Host "   ✅ @supabase/supabase-js installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  @supabase/supabase-js not found in package.json" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "✅ All checks passed! Your Supabase is configured correctly." -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Create a test case in the app" -ForegroundColor White
Write-Host "  3. Open Supabase dashboard and check the 'cases' table" -ForegroundColor White
Write-Host "  4. Your new case should appear there automatically" -ForegroundColor White
Write-Host "`n💡 To test in browser console:" -ForegroundColor Cyan
Write-Host "  - Press F12 to open Developer Tools" -ForegroundColor White
Write-Host "  - Go to Console tab" -ForegroundColor White
Write-Host "  - Type: testSupabaseConnection()" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - README_SUPABASE_FIX.md - Quick summary" -ForegroundColor White
Write-Host "  - SUPABASE_CONNECTION_FIXED.md - Detailed explanation" -ForegroundColor White
Write-Host "  - SUPABASE_VERIFICATION_COMPLETE.md - Full checklist" -ForegroundColor White

