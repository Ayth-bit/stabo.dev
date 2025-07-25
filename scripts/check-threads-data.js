#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkThreadsData() {
  console.log('=== Threads and Posts Data Analysis ===\n');
  
  try {
    // Check threads
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title, board_id, author_name, post_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (threadsError) {
      console.log('❌ Threads error:', threadsError.message);
      return;
    }
    
    console.log(`✅ Total threads: ${threads.length} (showing latest 10)`);
    console.log('Recent threads:');
    threads.forEach(thread => {
      console.log(`  - "${thread.title}" (board: ${thread.board_id}, posts: ${thread.post_count})`);
    });
    
    // Check if threads have board_id that match our new boards
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name');
    
    const boardIds = boards.map(b => b.id);
    const threadsWithValidBoards = threads.filter(t => boardIds.includes(t.board_id));
    
    console.log(`\n📊 Threads linked to current boards: ${threadsWithValidBoards.length}/${threads.length}`);
    
    // Check posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, thread_id, author_name, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (postsError) {
      console.log('❌ Posts error:', postsError.message);
      return;
    }
    
    console.log('\n✅ Recent posts (5 latest):');
    posts.forEach(post => {
      console.log(`  - "${post.content.substring(0, 50)}..." by ${post.author_name}`);
    });
    
    // Check if threads have null board_id
    const { data: orphanThreads } = await supabase
      .from('threads')
      .select('id, title, board_id')
      .is('board_id', null)
      .limit(5);
    
    console.log(`\n⚠️  Orphan threads (no board_id): ${orphanThreads.length}`);
    orphanThreads.forEach(thread => {
      console.log(`  - "${thread.title}" (id: ${thread.id})`);
    });
    
  } catch (err) {
    console.error('❌ Analysis failed:', err.message);
  }
}

async function main() {
  await checkThreadsData();
}

main().catch(console.error);