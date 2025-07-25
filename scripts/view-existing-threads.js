#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function viewExistingThreads() {
  console.log('=== Production Threads Analysis ===\n');
  
  try {
    // Get all threads with their posts
    const { data: threads, error } = await supabase
      .from('threads')
      .select('id, title, latitude, longitude, post_count, is_global, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`✅ Found ${threads.length} threads (showing latest 10):\n`);
    
    for (const thread of threads) {
      console.log(`📝 "${thread.title}"`);
      console.log(`   ID: ${thread.id}`);
      console.log(`   Posts: ${thread.post_count}`);
      console.log(`   Location: ${thread.latitude}, ${thread.longitude}`);
      console.log(`   Global: ${thread.is_global}`);
      console.log(`   Created: ${new Date(thread.created_at).toLocaleString()}`);
      
      // Get some posts for this thread
      const { data: posts } = await supabase
        .from('posts')
        .select('author_name, content, created_at')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (posts && posts.length > 0) {
        console.log('   Recent posts:');
        posts.forEach(post => {
          const preview = post.content.length > 50 
            ? `${post.content.substring(0, 50)}...` 
            : post.content;
          console.log(`     - ${post.author_name}: "${preview}"`);
        });
      }
      console.log('');
    }
    
    // Check global threads
    const { count: globalCount } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_global', true);
    
    console.log('📊 Stats:');
    console.log(`   - Global threads: ${globalCount}`);
    console.log(`   - Location-based threads: ${threads.length - globalCount}`);
    
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function main() {
  await viewExistingThreads();
}

main().catch(console.error);