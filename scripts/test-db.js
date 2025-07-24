#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables directly from .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

// Try with anon key first
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also create admin client for privileged operations
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function testDatabase() {
  console.log('\n📊 Testing database connectivity...');

  try {
    // Test 1: Check if we can connect and get basic info
    console.log('\n1. Testing basic connection...');
    // Try a simple query first to test connectivity
    const { data, error } = await supabase.from('boards').select('id').limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Connected successfully');
    console.log('📋 Found', data.length, 'records in boards table');

    // Test 2: Check specific tables
    console.log('\n2. Checking for required tables...');
    const requiredTables = ['users_extended', 'boards', 'threads', 'posts'];

    for (const tableName of requiredTables) {
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (tableError) {
        console.log(`❌ ${tableName}: ${tableError.message}`);
      } else {
        console.log(`✅ ${tableName}: exists`);
      }
    }

    // Test 3: Check boards data
    console.log('\n3. Checking boards data...');
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, type')
      .limit(5);

    if (boardsError) {
      console.log('❌ Boards query failed:', boardsError.message);
    } else {
      console.log(`✅ Found ${boards.length} boards:`);
      boards.forEach((board) => {
        console.log(`  - ${board.name} (${board.type})`);
      });
    }

    // Test 4: Check admin user
    console.log('\n4. Checking for admin user...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users_extended')
      .select('id, display_name, is_admin')
      .eq('is_admin', true);

    if (adminError) {
      console.log('❌ Admin user check failed:', adminError.message);
    } else {
      console.log(`✅ Found ${adminUsers.length} admin users:`);
      adminUsers.forEach((user) => {
        console.log(`  - ${user.display_name} (${user.id})`);
      });
    }

    // Test 5: Check auth users
    console.log('\n5. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);

    if (authError) {
      console.log('❌ Auth users check failed:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.length} auth users:`);
      authUsers.forEach((user) => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }

  console.log('\n🎉 Database test completed');
}

testDatabase().catch(console.error);
