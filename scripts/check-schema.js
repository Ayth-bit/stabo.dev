#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('=== Database Schema Check ===\n');
  
  try {
    // Check threads table structure
    const { data: threads, error } = await supabase
      .from('threads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Threads table error:', error.message);
      return;
    }
    
    if (threads && threads.length > 0) {
      console.log('✅ threads table columns:', Object.keys(threads[0]));
    } else {
      console.log('ℹ️ threads table exists but no data');
    }
    
    // Check posts table structure
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (postsError) {
      console.log('❌ Posts table error:', postsError.message);
    } else if (posts && posts.length > 0) {
      console.log('✅ posts table columns:', Object.keys(posts[0]));
    } else {
      console.log('ℹ️ posts table exists but no data');
    }
    
    // Check boards table structure
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .limit(1);
    
    if (boardsError) {
      console.log('❌ Boards table error:', boardsError.message);
    } else if (boards && boards.length > 0) {
      console.log('✅ boards table columns:', Object.keys(boards[0]));
    } else {
      console.log('ℹ️ boards table exists but no data');
    }
    
    // Get counts
    const { count: threadsCount } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true });
    
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    const { count: boardsCount } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 Data counts:');
    console.log(`  - Threads: ${threadsCount}`);
    console.log(`  - Posts: ${postsCount}`);
    console.log(`  - Boards: ${boardsCount}`);
    
  } catch (err) {
    console.error('❌ Schema check failed:', err.message);
  }
}

async function main() {
  await checkSchema();
}

main().catch(console.error);