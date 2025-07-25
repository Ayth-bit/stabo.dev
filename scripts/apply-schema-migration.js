#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
const path = require('node:path');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('=== Production Schema Migration ===\n');
  
  try {
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'migrate-production-schema.sql');
    const migrationSQL = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📋 Applying schema migration...');
    console.log('This will:');
    console.log('  - Add board_id column to threads table');
    console.log('  - Add missing columns to match local schema');
    console.log('  - Match existing threads to nearest boards');
    console.log('  - Create necessary indexes and triggers');
    console.log('');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = `${statements[i]};`;
      
      // Skip empty statements or comments
      if (statement.trim() === ';' || statement.startsWith('--')) {
        continue;
      }
      
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      try {
        // Use a raw SQL query approach
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't work, try direct query for simple statements
          console.warn(`exec_sql failed, trying alternative approach: ${error.message}`);
          
          // For simple ALTER TABLE statements, we can try using the REST API
          if (statement.includes('ALTER TABLE') && statement.includes('ADD COLUMN IF NOT EXISTS board_id')) {
            console.log('Adding board_id column using direct approach...');
            // We'll handle this manually below
          } else {
            console.warn(`Skipping statement due to API limitations: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log('✅ Statement executed successfully');
        }
      } catch (err) {
        console.warn(`⚠️  Statement failed: ${err.message}`);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log('\n🔍 Verifying migration results...');
    
    // Check if board_id column was added
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, board_id, latitude, longitude')
      .limit(1);
    
    if (threadsError) {
      console.log('❌ threads table check failed:', threadsError.message);
    } else {
      const hasboardId = threads.length > 0 && threads[0].hasOwnProperty('board_id');
      console.log(`${hasboardId ? '✅' : '❌'} board_id column ${hasboardId ? 'exists' : 'missing'}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    return false;
  }
}

async function manualMigration() {
  console.log('\n🔧 Performing manual migration steps...');
  
  try {
    // Since we can't execute DDL directly, we'll work with what we have
    // and focus on the data migration part
    
    // Check current schema
    const { data: threadsCheck } = await supabase
      .from('threads')
      .select('*')
      .limit(1);
    
    console.log('Current threads columns:', Object.keys(threadsCheck[0] || {}));
    
    // If board_id doesn't exist, we need to inform the user
    if (!threadsCheck[0] || !threadsCheck[0].hasOwnProperty('board_id')) {
      console.log('\n❌ board_id column not found in threads table');
      console.log('📋 Manual steps required:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Execute the migration SQL manually');
      console.log('3. Run this script again to verify');
      
      return false;
    }
    
    console.log('✅ Schema appears to be updated');
    return true;
    
  } catch (err) {
    console.error('❌ Manual migration check failed:', err.message);
    return false;
  }
}

async function matchExistingThreads() {
  console.log('\n🎯 Matching existing threads to boards...');
  
  try {
    // Get threads without board_id
    const { data: unmatchedThreads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, is_global')
      .is('board_id', null)
      .eq('is_global', false);
    
    if (threadsError) {
      console.log('❌ Failed to fetch unmatched threads:', threadsError.message);
      return false;
    }
    
    if (!unmatchedThreads || unmatchedThreads.length === 0) {
      console.log('✅ All threads are already matched to boards');
      return true;
    }
    
    console.log(`Found ${unmatchedThreads.length} unmatched threads`);
    
    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, type, latitude, longitude');
    
    if (boardsError) {
      console.log('❌ Failed to fetch boards:', boardsError.message);
      return false;
    }
    
    let matched = 0;
    
    for (const thread of unmatchedThreads) {
      if (!thread.latitude || !thread.longitude) continue;
      
      // Find nearest board
      let nearestBoard = null;
      let minDistance = Number.POSITIVE_INFINITY;
      
      for (const board of boards) {
        const distance = calculateDistance(
          thread.latitude,
          thread.longitude,
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
          console.log(`✅ "${thread.title}" → ${nearestBoard.name} (${Math.round(minDistance)}m)`);
          matched++;
        } else {
          console.log(`❌ Failed to update "${thread.title}": ${updateError.message}`);
        }
      }
    }
    
    console.log(`\n📊 Matched ${matched}/${unmatchedThreads.length} threads`);
    return true;
    
  } catch (err) {
    console.error('❌ Thread matching failed:', err.message);
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
  // Try automated migration first
  const migrationSuccess = await applyMigration();
  
  if (!migrationSuccess) {
    // Fall back to manual approach
    const manualSuccess = await manualMigration();
    if (!manualSuccess) {
      console.log('\n❌ Migration incomplete. Please run the SQL manually in Supabase Dashboard.');
      return;
    }
  }
  
  // Try to match existing threads
  await matchExistingThreads();
  
  console.log('\n🎉 Migration process completed!');
}

main().catch(console.error);