// 統合された掲示板API - 統合版APIにリダイレクト
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 統合版APIにリダイレクト
  const { searchParams } = new URL(request.url);
  const baseUrl = new URL('/api/boards/integrated', request.url);

  // 既存のクエリパラメータを転送
  searchParams.forEach((value, key) => {
    baseUrl.searchParams.append(key, value);
  });

  try {
    const response = await fetch(baseUrl.toString());
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Boards API redirect error:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}
