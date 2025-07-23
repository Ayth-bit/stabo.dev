import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const supabase = createClientComponentClient();
    
    // 1. Supabase接続テスト
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    // 2. users_extendedテーブルの存在確認
    const { error: usersError, count: usersCount } = await supabase
      .from('users_extended')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    // 3. 掲示板データの存在確認（統合API経由）
    let boardsStatus = 'Unknown';
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/boards?select=count()&limit=1`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      });
      boardsStatus = response.ok ? 'Available' : 'Error';
    } catch {
      boardsStatus = 'Not accessible';
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        auth: {
          connected: !authError,
          error: authError?.message || null,
          user: authData?.user?.email || null
        },
        database: {
          users_extended: {
            accessible: !usersError,
            error: usersError?.message || null,
            count: usersCount || 0
          },
          boards: {
            status: boardsStatus
          }
        }
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        connected: false
      }
    }, { status: 500 });
  }
}