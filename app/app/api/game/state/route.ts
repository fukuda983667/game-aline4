import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/app/lib/cache';
import { type Game } from '@/app/lib/gameUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    if (!game_id) {
      return NextResponse.json(
        { success: false, message: 'game_idが必要です' },
        { status: 400 }
      );
    }

    const activeGames = cache.get<Record<string, Game>>('active_games') || {};

    if (!activeGames[game_id]) {
      return NextResponse.json(
        { success: false, message: 'ゲームが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game: activeGames[game_id]
    });
  } catch (error) {
    console.error('getGameStateでエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: 'サーバー内部エラーが発生しました' },
      { status: 500 }
    );
  }
}






