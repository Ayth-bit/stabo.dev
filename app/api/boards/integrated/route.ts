// 統合された掲示板システム API
// 既存のスレッドシステムと新しい掲示板システムを統合

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 距離計算関数
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number.parseFloat(searchParams.get('lat') || '0');
    const lng = Number.parseFloat(searchParams.get('lng') || '0');
    const filter = searchParams.get('filter') || 'all';

    // Supabase client setup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch boards from database
    const { data: boardsData, error } = await supabase
      .from('boards')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch boards:', error);
      return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
    }

    if (!boardsData || boardsData.length === 0) {
      return NextResponse.json({
        boards: [],
        total: 0,
        byType: { station: 0, ward: 0, park: 0, accessible: 0 },
        allStats: { station: 0, ward: 0, park: 0, accessible: 0, all: 0 },
        userLocation: lat && lng ? { lat, lng } : null,
      });
    }

    // Convert database format to API format and calculate distances
    const hasValidLocation = lat !== 0 && lng !== 0;
    const boardsWithDistance = boardsData.map((board) => {
      const distance = hasValidLocation ? calculateDistance(lat, lng, Number(board.latitude), Number(board.longitude)) : 0;
      const viewRadius = board.view_radius || 1500; // デフォルト1.5km
      const isViewable = hasValidLocation ? distance <= viewRadius : true; // 位置情報がない場合は全て閲覧可能
      const isAccessible = hasValidLocation ? distance <= board.access_radius : false; // 位置情報がない場合は投稿不可
      return {
        id: board.id,
        name: board.name,
        type: board.type,
        lat: Number(board.latitude),
        lng: Number(board.longitude),
        accessRadius: board.access_radius,
        viewRadius: board.view_radius,
        description: board.description,
        createdAt: new Date(board.created_at),
        distance,
        isViewable,
        isAccessible,
      };
    }).sort((a, b) => a.distance - b.distance);

    let filteredBoards: typeof boardsWithDistance;

    // フィルター適用（閲覧可能範囲で最大3件に制限）
    if (filter === 'accessible') {
      // 投稿可能な掲示板のみ（最大3件）
      filteredBoards = boardsWithDistance.filter((board) => board.isAccessible).slice(0, 3);
    } else if (filter === 'station') {
      // 駅は閲覧可能範囲で最大3件
      filteredBoards = boardsWithDistance
        .filter((board) => board.type === 'station' && board.isViewable)
        .slice(0, 3);
    } else if (filter === 'ward') {
      // 区は閲覧可能範囲で最大3件
      filteredBoards = boardsWithDistance
        .filter((board) => board.type === 'ward' && board.isViewable)
        .slice(0, 3);
    } else if (filter === 'park') {
      // 公園は閲覧可能範囲で最大3件
      filteredBoards = boardsWithDistance
        .filter((board) => board.type === 'park' && board.isViewable)
        .slice(0, 3);
    } else {
      // 全て（閲覧可能範囲で最大3件）
      filteredBoards = boardsWithDistance.filter((board) => board.isViewable).slice(0, 3);
    }

    return NextResponse.json({
      boards: filteredBoards,
      total: filteredBoards.length,
      byType: {
        station: filteredBoards.filter((b) => b.type === 'station').length,
        ward: filteredBoards.filter((b) => b.type === 'ward').length,
        park: filteredBoards.filter((b) => b.type === 'park').length,
        accessible: filteredBoards.filter((b) => b.isAccessible).length,
      },
      allStats: {
        station: Math.min(
          3,
          boardsWithDistance.filter((b) => b.type === 'station' && b.isViewable).length
        ),
        ward: Math.min(
          3,
          boardsWithDistance.filter((b) => b.type === 'ward' && b.isViewable).length
        ),
        park: Math.min(
          3,
          boardsWithDistance.filter((b) => b.type === 'park' && b.isViewable).length
        ),
        accessible: Math.min(3, boardsWithDistance.filter((b) => b.isAccessible).length),
        all: Math.min(3, boardsWithDistance.filter((b) => b.isViewable).length),
      },
      userLocation: lat && lng ? { lat, lng } : null,
    });
  } catch (error) {
    console.error('Integrated boards API error:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}
