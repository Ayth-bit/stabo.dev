#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Missing .env file');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

const envLines = envContent.split('\n');
for (const line of envLines) {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// SQL template for missing tables
const REQUIRED_TABLES_SQL = `-- Database setup for Stabo.dev
-- Execute this in Supabase Dashboard SQL Editor

-- Connections table for friend relationships
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Chats table for direct message conversations
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users_extended(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user1_id ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2_id ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON direct_messages(receiver_id);

-- Disable RLS for development (enable later with proper policies)
ALTER TABLE connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

async function checkTables() {
  console.log('🔍 Checking remote Supabase tables...');
  console.log(`Project URL: ${supabaseUrl}`);
  
  const tablesToCheck = ['connections', 'chats', 'chat_messages', 'direct_messages'];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404 || response.status === 400) {
        const errorData = await response.json();
        if (errorData.code === '42P01') {
          missingTables.push(table);
          console.log(`❌ ${table} table missing`);
        }
      } else if (response.ok) {
        console.log(`✅ ${table} table exists`);
      }
    } catch (error) {
      console.log(`⚠️  Error checking ${table}:`, error.message);
      missingTables.push(table);
    }
  }

  return missingTables;
}

async function main() {
  const missingTables = await checkTables();
  
  if (missingTables.length === 0) {
    console.log('\n🎉 All required tables exist!');
    console.log('Run: node scripts/test-db.js to verify functionality');
    return;
  }

  console.log(`\n⚠️  Found ${missingTables.length} missing tables: ${missingTables.join(', ')}`);
  console.log('\n📋 Manual setup required:');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL below:');
  console.log('4. Execute the SQL');
  console.log('5. Run this script again to verify: node scripts/db-setup.js');
  console.log('\n🔧 SQL to execute:');
  console.log('─'.repeat(60));
  console.log(REQUIRED_TABLES_SQL);
  console.log('─'.repeat(60));
}

main().catch(console.error);