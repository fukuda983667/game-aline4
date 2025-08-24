import Pusher from 'pusher-js';

// Pusherの設定
export const pusherConfig = {
    key: 'pusher-app-key', // Laravel WebSocketsのデフォルトキー
    cluster: 'ap1',
    wsHost: 'localhost',
    wsPort: 6001,
    forceTLS: false,
    disableStats: true,
};

// Pusherインスタンスを作成する関数
export const createPusherInstance = () => {
    return new Pusher(pusherConfig.key, {
        cluster: pusherConfig.cluster,
        wsHost: pusherConfig.wsHost,
        wsPort: pusherConfig.wsPort,
        forceTLS: pusherConfig.forceTLS,
        disableStats: pusherConfig.disableStats,
    });
};

// ゲームチャンネルにサブスクライブする関数
export const subscribeToGame = (pusher: Pusher, gameId: string) => {
    return pusher.subscribe(`game.${gameId}`);
};
