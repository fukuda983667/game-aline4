import Pusher from 'pusher-js';

// Pusherインスタンスを作成する関数
export const createPusherInstance = () => {
    // デバッグログを有効化
    Pusher.logToConsole = true;

    return new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string
    });
};

// ゲームチャンネルにサブスクライブする関数
export const subscribeToGame = (pusher: Pusher, gameId: string) => {
    return pusher.subscribe(`game.${gameId}`);
};
