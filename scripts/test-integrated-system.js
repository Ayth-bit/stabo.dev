#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIntegratedSystem() {
  console.log('=== Testing Integrated Threads & Boards System ===\n');
  
  try {
    // Find boards with threads
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select(`
        id, 
        name, 
        type,
        threads!inner(count)
      `)
      .limit(10);
    
    if (boardsError) {
      console.log('❌ Error fetching boards:', boardsError.message);
      return;
    }
    
    // Get actual thread counts for each board
    console.log('🎯 Boards with Threads:');
    for (const board of boards.slice(0, 8)) {
      const { count } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('board_id', board.id);
      
      if (count > 0) {
        console.log(`  📋 ${board.name} (${board.type}): ${count} threads`);
        
        // Get sample threads for this board
        const { data: threads } = await supabase
          .from('threads')
          .select('id, title, post_count, created_at')
          .eq('board_id', board.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (threads) {
          threads.forEach(thread => {
            console.log(`    - "${thread.title}" (${thread.post_count} posts)`);
          });
        }
        console.log('');
      }
    }
    
    // Test API endpoint
    console.log('🔗 Testing API Endpoints:');
    
    // Find a board with threads for API test
    const { data: nakanoBoard } = await supabase
      .from('boards')
      .select('id, name')
      .eq('name', '中野区')
      .single();
    
    if (nakanoBoard) {
      console.log(`Testing threads API for ${nakanoBoard.name}...`);
      
      const response = await fetch(`http://localhost:3001/api/boards/${nakanoBoard.id}/threads`);
      const threadsData = await response.json();
      
      console.log(`✅ API Response: ${threadsData.total} threads found`);
      if (threadsData.threads && threadsData.threads.length > 0) {
        console.log(`Sample thread: "${threadsData.threads[0].title || 'No title'}"`);
      }
    }
    
    // Overall stats
    const { count: totalThreads } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true });
    
    const { count: assignedThreads } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .not('board_id', 'is', null);
    
    const { count: globalThreads } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_global', true);
    
    console.log('\n📊 Integration Statistics:');
    console.log(`  - Total threads: ${totalThreads}`);
    console.log(`  - Assigned to boards: ${assignedThreads}`);
    console.log(`  - Global threads: ${globalThreads}`);
    console.log(`  - Unassigned: ${totalThreads - assignedThreads - globalThreads}`);
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

async function main() {
  await testIntegratedSystem();
}

main().catch(console.error);