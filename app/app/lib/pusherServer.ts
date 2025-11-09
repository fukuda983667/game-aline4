import Pusher from 'pusher';

// サーバーサイド用のPusherインスタンス
let pusherInstance: Pusher | null = null;

export const getPusherInstance = (): Pusher => {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true
    });
  }
  return pusherInstance;
};

// Pusherイベントを発行する関数
export const broadcastEvent = async (
  channel: string,
  event: string,
  data: any
): Promise<void> => {
  try {
    const pusher = getPusherInstance();
    await pusher.trigger(channel, event, data);
    console.log(`Pusherイベント発行: ${channel} - ${event}`, data);
  } catch (error) {
    console.error('Pusherイベント発行エラー:', error);
  }
};

// ゲーム関連のイベント発行関数
export const broadcastGameEvent = {
  // 仮マッチング通知
  tentativeMatch: async (gameId: string, playerId: string, playerName: string) => {
    await broadcastEvent(
      `game.${gameId}`,
      'tentative.match',
      {
        gameId,
        playerId,
        playerName,
        message: 'マッチングの確認をお待ちしています'
      }
    );
  },

  // ゲーム開始通知
  gameStart: async (gameId: string, game: any) => {
    await broadcastEvent(
      `game.${gameId}`,
      'game.start',
      {
        gameId,
        game,
        message: 'ゲームが開始されました'
      }
    );
  },

  // ゲーム移動通知（石を置く）
  gameMove: async (
    gameId: string,
    game: any,
    column: number | null,
    row: number | null,
    color: string,
    playerId: string,
    isRotation: boolean = false,
    direction?: string
  ) => {
    await broadcastEvent(
      `game.${gameId}`,
      'game.move',
      {
        gameId,
        game,
        move: {
          column,
          row,
          color,
          playerId,
          rotated: isRotation,
          direction
        },
        message: isRotation ? 'ボードが回転されました' : '石が配置されました'
      }
    );
  },

  // プレイヤー退出通知
  playerLeft: async (gameId: string, playerId: string) => {
    await broadcastEvent(
      `game.${gameId}`,
      'player.left',
      {
        gameId,
        playerId,
        message: 'プレイヤーがゲームから退出しました'
      }
    );
  }
};






