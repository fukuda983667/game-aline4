import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/app/lib/cache';
import { type Game, type WaitingPlayer } from '@/app/lib/gameUtils';
import { broadcastGameEvent } from '@/app/lib/pusherServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_id, player_id } = body;

    if (!game_id || !player_id) {
      return NextResponse.json(
        { success: false, message: 'game_idとplayer_idが必要です' },
        { status: 400 }
      );
    }

    const activeGames = cache.get<Record<string, Game>>('active_games') || {};
    const waitingPlayers = cache.get<WaitingPlayer[]>('waiting_players') || [];

    if (activeGames[game_id]) {
      const game = activeGames[game_id];

      // 他のプレイヤーに通知
      await broadcastGameEvent.playerLeft(game_id, player_id);

      // ゲームを削除
      delete activeGames[game_id];
      cache.set('active_games', activeGames, 300);

      console.log('プレイヤーがゲームから退出しました', {
        game_id,
        player_id,
        game_status: game.status
      });
    }

    // 待機リストからも削除
    const filteredWaitingPlayers = waitingPlayers.filter(
      player => player.player_id !== player_id
    );
    
    if (filteredWaitingPlayers.length !== waitingPlayers.length) {
      cache.set('waiting_players', filteredWaitingPlayers, 30);
      console.log('プレイヤーを待機リストから削除しました', {
        player_id,
        remaining_waiting: filteredWaitingPlayers.length
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('leaveGameでエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: 'サーバー内部エラーが発生しました' },
      { status: 500 }
    );
  }
}
