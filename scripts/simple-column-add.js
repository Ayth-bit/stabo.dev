#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testColumnAddition() {
  console.log('=== Testing Column Addition ===\n');
  
  // Since we can't modify schema via API, let's provide clear instructions
  console.log('❌ Schema modification via API is not supported');
  console.log('');
  console.log('📋 Manual Steps Required:');
  console.log('');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: tjtgpwpkgezolvydfmwa');
  console.log('3. Go to SQL Editor');
  console.log('4. Execute the following SQL:');
  console.log('');
  console.log('```sql');
  console.log('-- Add board_id column to threads table');
  console.log('ALTER TABLE threads ADD COLUMN board_id UUID REFERENCES boards(id) ON DELETE SET NULL;');
  console.log('');
  console.log('-- Add missing columns for complete schema alignment');
  console.log('ALTER TABLE threads ADD COLUMN author_id UUID REFERENCES users_extended(id);');
  console.log('ALTER TABLE threads ADD COLUMN author_name VARCHAR(20);');
  console.log('ALTER TABLE threads ADD COLUMN content TEXT;');
  console.log('ALTER TABLE threads ADD COLUMN font_family VARCHAR(50) DEFAULT \'Noto Sans JP\';');
  console.log('ALTER TABLE threads ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL \'72 hours\');');
  console.log('ALTER TABLE threads ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;');
  console.log('ALTER TABLE threads ADD COLUMN restored_at TIMESTAMP WITH TIME ZONE;');
  console.log('ALTER TABLE threads ADD COLUMN restore_count INTEGER DEFAULT 0;');
  console.log('ALTER TABLE threads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
  console.log('');
  console.log('-- Add missing columns to posts table');
  console.log('ALTER TABLE posts ADD COLUMN author_id UUID REFERENCES users_extended(id);');
  console.log('ALTER TABLE posts ADD COLUMN latitude DECIMAL(10, 8);');
  console.log('ALTER TABLE posts ADD COLUMN longitude DECIMAL(11, 8);');
  console.log('ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
  console.log('');
  console.log('-- Remove unnecessary columns from posts');
  console.log('ALTER TABLE posts DROP COLUMN IF EXISTS link;');
  console.log('ALTER TABLE posts DROP COLUMN IF EXISTS color;');
  console.log('');
  console.log('-- Create indexes');
  console.log('CREATE INDEX idx_threads_board_id ON threads(board_id);');
  console.log('```');
  console.log('');
  console.log('5. After executing the SQL, run this script again to proceed with data migration');
  
  // Check if board_id already exists
  try {
    const { data: testThread, error } = await supabase
      .from('threads')
      .select('board_id')
      .limit(1);
    
    if (!error && testThread) {
      console.log('');
      console.log('✅ board_id column already exists! Proceeding with data migration...');
      return true;
    }
  } catch (err) {
    console.log('\n⚠️  board_id column not yet added');
  }
  
  return false;
}

async function migrateThreadData() {
  console.log('\n=== Data Migration ===');
  
  try {
    // Get threads without board_id
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, is_global, board_id')
      .is('board_id', null)
      .neq('is_global', true);
    
    if (threadsError) {
      console.log('❌ Failed to fetch threads:', threadsError.message);
      return false;
    }
    
    if (!threads || threads.length === 0) {
      console.log('✅ All location-based threads already have board assignments');
      return true;
    }
    
    console.log(`Found ${threads.length} threads to assign to boards`);
    
    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, type, latitude, longitude');
    
    if (boardsError) {
      console.log('❌ Failed to fetch boards:', boardsError.message);
      return false;
    }
    
    let assigned = 0;
    
    for (const thread of threads) {
      if (!thread.latitude || !thread.longitude) {
        console.log(`⚠️  Skipping "${thread.title}" - no coordinates`);
        continue;
      }
      
      // Find nearest board within 5km
      let nearestBoard = null;
      let minDistance = Number.POSITIVE_INFINITY;
      
      for (const board of boards) {
        const distance = calculateDistance(
          Number.parseFloat(thread.latitude),
          Number.parseFloat(thread.longitude),
          Number.parseFloat(board.latitude),
          Number.parseFloat(board.longitude)
        );
        
        if (distance < 5000 && distance < minDistance) {
          minDistance = distance;
          nearestBoard = board;
        }
      }
      
      if (nearestBoard) {
        const { error: updateError } = await supabase
          .from('threads')
          .update({ board_id: nearestBoard.id })
          .eq('id', thread.id);
        
        if (!updateError) {
          console.log(`✅ "${thread.title}" → ${nearestBoard.name} (${nearestBoard.type}, ${Math.round(minDistance)}m)`);
          assigned++;
        } else {
          console.log(`❌ Failed to update "${thread.title}": ${updateError.message}`);
        }
      } else {
        console.log(`⚠️  No nearby board for "${thread.title}" at (${thread.latitude}, ${thread.longitude})`);
      }
    }
    
    console.log(`\n📊 Successfully assigned ${assigned}/${threads.length} threads to boards`);
    return true;
    
  } catch (err) {
    console.error('❌ Data migration failed:', err.message);
    return false;
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
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

async function main() {
  const hasColumn = await testColumnAddition();
  
  if (hasColumn) {
    await migrateThreadData();
    console.log('\n🎉 Integration completed successfully!');
  } else {
    console.log('\n⏸️  Waiting for manual schema update...');
  }
}

main().catch(console.error);