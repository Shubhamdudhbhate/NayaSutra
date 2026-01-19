// Test Supabase Connection
import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if client is initialized
    console.log('✓ Supabase client initialized');

    // Test 2: Try to fetch from profiles table
    console.log('\n📊 Testing profiles table access...');
    const { error: profileError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (profileError) {
      console.error('✗ Error accessing profiles:', profileError.message);
    } else {
      console.log(`✓ Profiles table accessible`);
      console.log(`  Total profiles: ${count}`);
    }

    // Test 3: Try to fetch from cases table
    console.log('\n📋 Testing cases table access...');
    const { data: cases, error: caseError, count: caseCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact' });

    if (caseError) {
      console.error('✗ Error accessing cases:', caseError.message);
    } else {
      console.log(`✓ Cases table accessible`);
      console.log(`  Total cases: ${caseCount}`);
      if (cases && cases.length > 0) {
        console.log(`  Sample cases:`, cases.slice(0, 2).map(c => ({
          id: c.id,
          case_number: c.case_number,
          title: c.title,
          court_name: c.court_name,
        })));
      }
    }

    // Test 4: Try to fetch from firs table
    console.log('\n🚔 Testing FIRs table access...');
    const { error: firError, count: firCount } = await supabase
      .from('firs')
      .select('*', { count: 'exact' });

    if (firError) {
      console.error('✗ Error accessing FIRs:', firError.message);
    } else {
      console.log(`✓ FIRs table accessible`);
      console.log(`  Total FIRs: ${firCount}`);
    }

    // Test 5: Check Auth status
    console.log('\n🔐 Testing Auth status...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log(`✓ User authenticated: ${session.user.email}`);
    } else {
      console.log('ℹ No active session (this is OK for testing)');
    }

    console.log('\n✅ Connection test complete!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Call this in your browser console to test
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testSupabaseConnection;
  console.log('💡 Run testSupabaseConnection() in console to test Supabase connection');
}
