import { type NextRequest, NextResponse } from 'next/server';
import { ALL_BOARDS } from '../data';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: boardId } = await params;
    const board = ALL_BOARDS.find((b) => b.id === boardId);

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({
      board,
    });
  } catch (error) {
    console.error('Board detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}
