#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Distance calculation function
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function addBoardIdColumn() {
  console.log('📋 Step 1: Adding board_id column to threads table...');
  
  try {
    // Add board_id column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE threads 
        ADD COLUMN IF NOT EXISTS board_id UUID 
        REFERENCES boards(id) ON DELETE SET NULL;
      `
    });
    
    if (error) {
      console.error('❌ Failed to add board_id column:', error.message);
      return false;
    }
    
    console.log('✅ board_id column added successfully');
    return true;
  } catch (err) {
    console.error('❌ Error adding column:', err.message);
    return false;
  }
}

async function matchThreadsToBoards() {
  console.log('\n🎯 Step 2: Matching existing threads to nearest boards...');
  
  try {
    // Get all threads without board_id
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, is_global')
      .is('board_id', null);
    
    if (threadsError) {
      console.error('❌ Failed to fetch threads:', threadsError.message);
      return false;
    }
    
    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, type, latitude, longitude, access_radius');
    
    if (boardsError) {
      console.error('❌ Failed to fetch boards:', boardsError.message);
      return false;
    }
    
    console.log(`Found ${threads.length} threads to match with ${boards.length} boards`);
    
    let matched = 0;
    let global = 0;
    
    for (const thread of threads) {
      // Skip global threads for now
      if (thread.is_global) {
        global++;
        continue;
      }
      
      // Skip threads without coordinates
      if (!thread.latitude || !thread.longitude) {
        console.log(`⚠️  Skipping thread "${thread.title}" - no coordinates`);
        continue;
      }
      
      // Find nearest board within reasonable distance (5km max)
      let nearestBoard = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      
      for (const board of boards) {
        const distance = calculateDistance(
          thread.latitude,
          thread.longitude,
          Number.parseFloat(board.latitude),
          Number.parseFloat(board.longitude)
        );
        
        // Consider board within 5km as potential match
        if (distance < 5000 && distance < nearestDistance) {
          nearestDistance = distance;
          nearestBoard = board;
        }
      }
      
      if (nearestBoard) {
        // Update thread with board_id
        const { error: updateError } = await supabase
          .from('threads')
          .update({ board_id: nearestBoard.id })
          .eq('id', thread.id);
        
        if (updateError) {
          console.error(`❌ Failed to update thread ${thread.title}:`, updateError.message);
        } else {
          console.log(`✅ "${thread.title}" → ${nearestBoard.name} (${nearestBoard.type}, ${Math.round(nearestDistance)}m)`);
          matched++;
        }
      } else {
        console.log(`⚠️  No nearby board found for "${thread.title}" at (${thread.latitude}, ${thread.longitude})`);
      }
    }
    
    console.log('\n📊 Matching Results:');
    console.log(`   - Matched threads: ${matched}`);
    console.log(`   - Global threads: ${global} (kept as global)`);
    console.log(`   - Unmatched threads: ${threads.length - matched - global}`);
    
    return true;
  } catch (err) {
    console.error('❌ Error matching threads:', err.message);
    return false;
  }
}

async function verifyIntegration() {
  console.log('\n🔍 Step 3: Verifying integration...');
  
  try {
    // Count threads by board
    const { data: threadCounts, error } = await supabase
      .from('threads')
      .select(`
        board_id,
        boards!inner(name, type),
        count
      `)
      .not('board_id', 'is', null)
      .order('count', { ascending: false });
    
    if (error) {
      console.error('❌ Verification error:', error.message);
      return false;
    }
    
    console.log('✅ Threads per board:');
    
    // Get actual counts using a different approach
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, type');
    
    for (const board of boards.slice(0, 10)) { // Show top 10
      const { count } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('board_id', board.id);
      
      if (count > 0) {
        console.log(`   - ${board.name} (${board.type}): ${count} threads`);
      }
    }
    
    // Check global threads
    const { count: globalCount } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_global', true);
    
    const { count: unassignedCount } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .is('board_id', null)
      .eq('is_global', false);
    
    console.log('\n📊 Final Stats:');
    console.log(`   - Threads with boards: ${threadCounts?.length || 0}`);
    console.log(`   - Global threads: ${globalCount}`);
    console.log(`   - Unassigned threads: ${unassignedCount}`);
    
    return true;
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Threads & Boards Integration ===\n');
  
  const step1 = await addBoardIdColumn();
  if (!step1) return;
  
  const step2 = await matchThreadsToBoards();
  if (!step2) return;
  
  const step3 = await verifyIntegration();
  if (!step3) return;
  
  console.log('\n🎉 Integration completed successfully!');
  console.log('   - Existing threads are now linked to appropriate boards');
  console.log('   - Thread display should now work with the new board system');
}

main().catch(console.error);