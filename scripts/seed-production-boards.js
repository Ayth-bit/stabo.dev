#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tjtgpwpkgezolvydfmwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGdwd3BrZ2V6b2x2eWRmbXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3MjQzOSwiZXhwIjoyMDY0OTQ4NDM5fQ.Lot-0nZgVPubXKfZu2OV9lp38JYSqHjveWZox4G0Jwg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Yamanote Line 30 stations
const stationBoards = [
  { name: '品川駅', description: '品川駅周辺の情報交換', type: 'station', latitude: 35.6284, longitude: 139.7387, access_radius: 300, view_radius: 1500 },
  { name: '大崎駅', description: '大崎駅周辺の情報交換', type: 'station', latitude: 35.6197, longitude: 139.7286, access_radius: 300, view_radius: 1500 },
  { name: '五反田駅', description: '五反田駅周辺の情報交換', type: 'station', latitude: 35.6258, longitude: 139.7238, access_radius: 300, view_radius: 1500 },
  { name: '目黒駅', description: '目黒駅周辺の情報交換', type: 'station', latitude: 35.6332, longitude: 139.7156, access_radius: 300, view_radius: 1500 },
  { name: '恵比寿駅', description: '恵比寿駅周辺の情報交換', type: 'station', latitude: 35.6465, longitude: 139.7102, access_radius: 300, view_radius: 1500 },
  { name: '渋谷駅', description: '渋谷駅周辺の情報交換', type: 'station', latitude: 35.6580, longitude: 139.7016, access_radius: 300, view_radius: 1500 },
  { name: '原宿駅', description: '原宿駅周辺の情報交換', type: 'station', latitude: 35.6702, longitude: 139.7027, access_radius: 300, view_radius: 1500 },
  { name: '代々木駅', description: '代々木駅周辺の情報交換', type: 'station', latitude: 35.6835, longitude: 139.7020, access_radius: 300, view_radius: 1500 },
  { name: '新宿駅', description: '新宿駅周辺の情報交換', type: 'station', latitude: 35.6896, longitude: 139.7006, access_radius: 300, view_radius: 1500 },
  { name: '新大久保駅', description: '新大久保駅周辺の情報交換', type: 'station', latitude: 35.7016, longitude: 139.7005, access_radius: 300, view_radius: 1500 },
  { name: '高田馬場駅', description: '高田馬場駅周辺の情報交換', type: 'station', latitude: 35.7123, longitude: 139.7038, access_radius: 300, view_radius: 1500 },
  { name: '目白駅', description: '目白駅周辺の情報交換', type: 'station', latitude: 35.7214, longitude: 139.7062, access_radius: 300, view_radius: 1500 },
  { name: '池袋駅', description: '池袋駅周辺の情報交換', type: 'station', latitude: 35.7295, longitude: 139.7109, access_radius: 300, view_radius: 1500 },
  { name: '大塚駅', description: '大塚駅周辺の情報交換', type: 'station', latitude: 35.7315, longitude: 139.7285, access_radius: 300, view_radius: 1500 },
  { name: '巣鴨駅', description: '巣鴨駅周辺の情報交換', type: 'station', latitude: 35.7335, longitude: 139.7389, access_radius: 300, view_radius: 1500 },
  { name: '駒込駅', description: '駒込駅周辺の情報交換', type: 'station', latitude: 35.7362, longitude: 139.7468, access_radius: 300, view_radius: 1500 },
  { name: '田端駅', description: '田端駅周辺の情報交換', type: 'station', latitude: 35.7612, longitude: 139.7607, access_radius: 300, view_radius: 1500 },
  { name: '西日暮里駅', description: '西日暮里駅周辺の情報交換', type: 'station', latitude: 35.7320, longitude: 139.7669, access_radius: 300, view_radius: 1500 },
  { name: '日暮里駅', description: '日暮里駅周辺の情報交換', type: 'station', latitude: 35.7279, longitude: 139.7710, access_radius: 300, view_radius: 1500 },
  { name: '鶯谷駅', description: '鶯谷駅周辺の情報交換', type: 'station', latitude: 35.7206, longitude: 139.7786, access_radius: 300, view_radius: 1500 },
  { name: '上野駅', description: '上野駅周辺の情報交換', type: 'station', latitude: 35.7141, longitude: 139.7774, access_radius: 300, view_radius: 1500 },
  { name: '御徒町駅', description: '御徒町駅周辺の情報交換', type: 'station', latitude: 35.7077, longitude: 139.7743, access_radius: 300, view_radius: 1500 },
  { name: '秋葉原駅', description: '秋葉原駅周辺の情報交換', type: 'station', latitude: 35.6984, longitude: 139.7731, access_radius: 300, view_radius: 1500 },
  { name: '神田駅', description: '神田駅周辺の情報交換', type: 'station', latitude: 35.6916, longitude: 139.7708, access_radius: 300, view_radius: 1500 },
  { name: '東京駅', description: '東京駅周辺の情報交換', type: 'station', latitude: 35.6812, longitude: 139.7671, access_radius: 300, view_radius: 1500 },
  { name: '有楽町駅', description: '有楽町駅周辺の情報交換', type: 'station', latitude: 35.6751, longitude: 139.7634, access_radius: 300, view_radius: 1500 },
  { name: '新橋駅', description: '新橋駅周辺の情報交換', type: 'station', latitude: 35.6663, longitude: 139.7583, access_radius: 300, view_radius: 1500 },
  { name: '浜松町駅', description: '浜松町駅周辺の情報交換', type: 'station', latitude: 35.6554, longitude: 139.7570, access_radius: 300, view_radius: 1500 },
  { name: '田町駅', description: '田町駅周辺の情報交換', type: 'station', latitude: 35.6456, longitude: 139.7476, access_radius: 300, view_radius: 1500 },
  { name: '高輪ゲートウェイ駅', description: '高輪ゲートウェイ駅周辺の情報交換', type: 'station', latitude: 35.6356, longitude: 139.7407, access_radius: 300, view_radius: 1500 }
];

// Tokyo 23 wards
const wardBoards = [
  { name: '千代田区', description: '千代田区内の地域情報', type: 'ward', latitude: 35.6941, longitude: 139.7536, access_radius: 300, view_radius: 1500 },
  { name: '中央区', description: '中央区内の地域情報', type: 'ward', latitude: 35.6704, longitude: 139.7704, access_radius: 300, view_radius: 1500 },
  { name: '港区', description: '港区内の地域情報', type: 'ward', latitude: 35.6584, longitude: 139.7519, access_radius: 300, view_radius: 1500 },
  { name: '新宿区', description: '新宿区内の地域情報', type: 'ward', latitude: 35.6938, longitude: 139.7034, access_radius: 300, view_radius: 1500 },
  { name: '文京区', description: '文京区内の地域情報', type: 'ward', latitude: 35.7081, longitude: 139.7516, access_radius: 300, view_radius: 1500 },
  { name: '台東区', description: '台東区内の地域情報', type: 'ward', latitude: 35.7068, longitude: 139.7799, access_radius: 300, view_radius: 1500 },
  { name: '墨田区', description: '墨田区内の地域情報', type: 'ward', latitude: 35.7061, longitude: 139.8001, access_radius: 300, view_radius: 1500 },
  { name: '江東区', description: '江東区内の地域情報', type: 'ward', latitude: 35.6732, longitude: 139.8171, access_radius: 300, view_radius: 1500 },
  { name: '品川区', description: '品川区内の地域情報', type: 'ward', latitude: 35.6092, longitude: 139.7301, access_radius: 300, view_radius: 1500 },
  { name: '目黒区', description: '目黒区内の地域情報', type: 'ward', latitude: 35.6333, longitude: 139.6983, access_radius: 300, view_radius: 1500 },
  { name: '大田区', description: '大田区内の地域情報', type: 'ward', latitude: 35.5617, longitude: 139.7160, access_radius: 300, view_radius: 1500 },
  { name: '世田谷区', description: '世田谷区内の地域情報', type: 'ward', latitude: 35.6464, longitude: 139.6536, access_radius: 300, view_radius: 1500 },
  { name: '渋谷区', description: '渋谷区内の地域情報', type: 'ward', latitude: 35.6633, longitude: 139.6986, access_radius: 300, view_radius: 1500 },
  { name: '中野区', description: '中野区内の地域情報', type: 'ward', latitude: 35.7090, longitude: 139.6649, access_radius: 300, view_radius: 1500 },
  { name: '杉並区', description: '杉並区内の地域情報', type: 'ward', latitude: 35.6995, longitude: 139.6363, access_radius: 300, view_radius: 1500 },
  { name: '豊島区', description: '豊島区内の地域情報', type: 'ward', latitude: 35.7298, longitude: 139.7147, access_radius: 300, view_radius: 1500 },
  { name: '北区', description: '北区内の地域情報', type: 'ward', latitude: 35.7531, longitude: 139.7371, access_radius: 300, view_radius: 1500 },
  { name: '荒川区', description: '荒川区内の地域情報', type: 'ward', latitude: 35.7363, longitude: 139.7830, access_radius: 300, view_radius: 1500 },
  { name: '板橋区', description: '板橋区内の地域情報', type: 'ward', latitude: 35.7516, longitude: 139.7144, access_radius: 300, view_radius: 1500 },
  { name: '練馬区', description: '練馬区内の地域情報', type: 'ward', latitude: 35.7375, longitude: 139.6531, access_radius: 300, view_radius: 1500 },
  { name: '足立区', description: '足立区内の地域情報', type: 'ward', latitude: 35.7750, longitude: 139.8048, access_radius: 300, view_radius: 1500 },
  { name: '葛飾区', description: '葛飾区内の地域情報', type: 'ward', latitude: 35.7437, longitude: 139.8482, access_radius: 300, view_radius: 1500 },
  { name: '江戸川区', description: '江戸川区内の地域情報', type: 'ward', latitude: 35.7068, longitude: 139.8683, access_radius: 300, view_radius: 1500 }
];

// Major parks
const parkBoards = [
  { name: '上野公園', description: '上野公園周辺の情報', type: 'park', latitude: 35.7141, longitude: 139.7734, access_radius: 300, view_radius: 1500 },
  { name: '代々木公園', description: '代々木公園周辺の情報', type: 'park', latitude: 35.6719, longitude: 139.6961, access_radius: 300, view_radius: 1500 },
  { name: '新宿御苑', description: '新宿御苑周辺の情報', type: 'park', latitude: 35.6851, longitude: 139.7107, access_radius: 300, view_radius: 1500 },
  { name: '井の頭恩賜公園', description: '井の頭公園周辺の情報', type: 'park', latitude: 35.7004, longitude: 139.5706, access_radius: 300, view_radius: 1500 },
  { name: '皇居東御苑', description: '皇居東御苑周辺の情報', type: 'park', latitude: 35.6854, longitude: 139.7571, access_radius: 300, view_radius: 1500 },
  { name: '浜離宮恩賜庭園', description: '浜離宮周辺の情報', type: 'park', latitude: 35.6596, longitude: 139.7636, access_radius: 300, view_radius: 1500 },
  { name: '芝公園', description: '芝公園周辺の情報', type: 'park', latitude: 35.6572, longitude: 139.7487, access_radius: 300, view_radius: 1500 },
  { name: '日比谷公園', description: '日比谷公園周辺の情報', type: 'park', latitude: 35.6742, longitude: 139.7595, access_radius: 300, view_radius: 1500 }
];

async function seedBoards() {
  console.log('Seeding boards data to production...');
  
  const allBoards = [...stationBoards, ...wardBoards, ...parkBoards];
  
  console.log(`Total boards to insert: ${allBoards.length}`);
  console.log(`- Stations: ${stationBoards.length}`);
  console.log(`- Wards: ${wardBoards.length}`);
  console.log(`- Parks: ${parkBoards.length}`);
  
  try {
    // Clear existing boards
    const { error: deleteError } = await supabase
      .from('boards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.log('Warning: Could not clear existing boards:', deleteError.message);
    }
    
    // Insert in batches to avoid timeouts
    const batchSize = 10;
    let inserted = 0;
    
    for (let i = 0; i < allBoards.length; i += batchSize) {
      const batch = allBoards.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('boards')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
      } else {
        inserted += data.length;
        console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${data.length} boards inserted`);
      }
    }
    
    console.log(`\n✅ Successfully inserted ${inserted}/${allBoards.length} boards`);
    
    // Verify the result
    const { count } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Final boards count: ${count}`);
    
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
}

async function main() {
  console.log('=== Production Boards Seeding ===\n');
  await seedBoards();
}

main().catch(console.error);