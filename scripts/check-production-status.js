#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('=== Table Status ===');
  
  const tables = ['users_extended', 'boards', 'threads', 'posts', 'chats', 'chat_messages'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function checkUsersExtendedSchema() {
  console.log('\n=== users_extended Schema ===');
  
  try {
    const { data, error } = await supabase
      .from('users_extended')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing users_extended:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ users_extended columns:', Object.keys(data[0]));
      
      // Check if is_admin column exists
      if ('is_admin' in data[0]) {
        console.log('✅ is_admin column exists');
      } else {
        console.log('❌ is_admin column missing');
      }
    } else {
      console.log('ℹ️ users_extended table exists but no data');
    }
  } catch (err) {
    console.log('❌ Schema check failed:', err.message);
  }
}

async function checkBoardsData() {
  console.log('\n=== Boards Data ===');
  
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, type')
      .limit(5);
    
    if (error) {
      console.log('❌ Error accessing boards:', error.message);
      return;
    }
    
    console.log('Sample boards:');
    data.forEach(board => {
      console.log(`  - ${board.name} (${board.type})`);
    });
  } catch (err) {
    console.log('❌ Boards check failed:', err.message);
  }
}

async function checkAdminUser() {
  console.log('\n=== Admin User ===');
  
  try {
    const { data, error } = await supabase
      .from('users_extended')
      .select('id, display_name, is_admin, is_creator')
      .eq('is_admin', true);
    
    if (error) {
      console.log('❌ Error checking admin users:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Admin users found:');
      data.forEach(user => {
        console.log(`  - ${user.display_name} (admin: ${user.is_admin}, creator: ${user.is_creator})`);
      });
    } else {
      console.log('❌ No admin users found');
    }
  } catch (err) {
    console.log('❌ Admin check failed:', err.message);
  }
}

async function main() {
  console.log('=== Production Database Status Check ===\n');
  
  await checkTables();
  await checkUsersExtendedSchema();
  await checkBoardsData();
  await checkAdminUser();
}

main().catch(console.error);