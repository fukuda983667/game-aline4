import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { cache } from '@/app/lib/cache';
import { cleanupOldWaitingPlayers, type WaitingPlayer } from '@/app/lib/gameUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player_id, player_name = 'Player' } = body;

    if (!player_id) {
      return NextResponse.json(
        { success: false, message: 'player_idが必要です' },
        { status: 400 }
      );
    }

    // 古い待機プレイヤーをクリーンアップ
    const waitingPlayers = cache.get<WaitingPlayer[]>('waiting_players') || [];
    const cleanedPlayers = cleanupOldWaitingPlayers(waitingPlayers);
    cache.set('waiting_players', cleanedPlayers, 30);

    console.log('マッチング要求', {
      player_id,
      player_name,
      waiting_players_count: cleanedPlayers.length,
      waiting_players: cleanedPlayers
    });

    // 既に待機中のプレイヤーがいるかチェック
    if (cleanedPlayers.length > 0) {
      const opponent = cleanedPlayers.shift()!;
      cache.set('waiting_players', cleanedPlayers, 30);

      // 相手のゲームIDを使用
      const gameId = opponent.game_id;

      console.log('仮マッチング成功', {
        game_id: gameId,
        player1: opponent,
        player2: { player_id, player_name }
      });

      return NextResponse.json({
        success: true,
        game_id: gameId,
        status: 'tentative',
        player_id,
        opponent_id: opponent.player_id,
        opponent_name: opponent.player_name
      });
    }

    // ゲームIDを生成（待機用）
    const gameId = uuidv4();

    // 待機リストに追加（game_idも含める）
    const newWaitingPlayer: WaitingPlayer = {
      player_id,
      player_name,
      game_id: gameId,
      joined_at: new Date().toISOString()
    };

    cleanedPlayers.push(newWaitingPlayer);
    cache.set('waiting_players', cleanedPlayers, 30);

    console.log('プレイヤーを待機リストに追加', {
      player_id,
      player_name,
      game_id: gameId,
      total_waiting: cleanedPlayers.length
    });

    return NextResponse.json({
      success: true,
      game_id: gameId,
      player_id,
      status: 'waiting',
      message: 'マッチング中です...'
    });
  } catch (error) {
    console.error('findMatchでエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: 'サーバー内部エラーが発生しました' },
      { status: 500 }
    );
  }
}






