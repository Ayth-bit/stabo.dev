#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
const path = require('node:path');

// Production Supabase configuration
const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMigrationStatus() {
  console.log('Checking migration status...');
  
  try {
    const { data, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .order('version');
    
    if (error) {
      console.log('Migrations table not accessible:', error.message);
      return [];
    }
    
    console.log('Applied migrations:', data.map(m => m.version));
    return data.map(m => m.version);
  } catch (err) {
    console.log('Could not check migrations:', err.message);
    return [];
  }
}

async function checkTableStructure() {
  console.log('Checking users_extended table structure...');
  
  try {
    const { data, error } = await supabase
      .from('users_extended')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('users_extended table issue:', error.message);
      return false;
    }
    
    console.log('users_extended table exists and accessible');
    return true;
  } catch (err) {
    console.log('Table check failed:', err.message);
    return false;
  }
}

async function checkBoardsData() {
  console.log('Checking boards data...');
  
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.log('Boards table error:', error.message);
      return 0;
    }
    
    console.log(`Boards count: ${data.length}`);
    return data.length;
  } catch (err) {
    console.log('Boards check failed:', err.message);
    return 0;
  }
}

async function applySchemaFix() {
  console.log('Applying schema fix for is_admin column...');
  
  try {
    // Check if is_admin column exists
    const { data: columns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users_extended' 
        AND column_name = 'is_admin'
      `
    });
    
    if (!columns || columns.length === 0) {
      console.log('Adding is_admin column...');
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users_extended ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;'
      });
      console.log('is_admin column added successfully');
    } else {
      console.log('is_admin column already exists');
    }
    
    return true;
  } catch (err) {
    console.error('Schema fix failed:', err.message);
    return false;
  }
}

async function applySeedData() {
  console.log('Applying seed data...');
  
  try {
    // Read and apply seed data
    const seedFile = path.join(__dirname, '../supabase/seed.sql');
    if (fs.existsSync(seedFile)) {
      const seedData = fs.readFileSync(seedFile, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = seedData.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql: `${statement.trim()};` });
          } catch (err) {
            // Ignore duplicate key errors for seed data
            if (!err.message.includes('duplicate key') && !err.message.includes('already exists')) {
              console.warn('Seed statement failed:', `${statement.substring(0, 100)}...`, err.message);
            }
          }
        }
      }
      
      console.log('Seed data applied successfully');
      return true;
    }
      console.log('No seed file found');
      return false;
  } catch (err) {
    console.error('Seed data application failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== Production Migration Script ===');
  
  // Check current status
  const migrations = await checkMigrationStatus();
  const tableOk = await checkTableStructure();
  const boardsCount = await checkBoardsData();
  
  console.log('\n=== Current Status ===');
  console.log(`Applied migrations: ${migrations.length}`);
  console.log(`users_extended table accessible: ${tableOk}`);
  console.log(`Boards count: ${boardsCount}`);
  
  // Apply fixes
  console.log('\n=== Applying Fixes ===');
  
  if (!tableOk) {
    const schemaFixed = await applySchemaFix();
    if (!schemaFixed) {
      console.error('Failed to fix schema');
      process.exit(1);
    }
  }
  
  if (boardsCount === 0) {
    const seedApplied = await applySeedData();
    if (!seedApplied) {
      console.error('Failed to apply seed data');
      process.exit(1);
    }
  }
  
  // Final verification
  console.log('\n=== Final Verification ===');
  await checkTableStructure();
  await checkBoardsData();
  
  console.log('Production migration completed!');
}

main().catch(console.error);