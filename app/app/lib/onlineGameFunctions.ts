import { createPusherInstance, subscribeToGame } from './pusher';

export interface OnlinePlayer {
    id: string;
    name: string;
    color: 'red' | 'yellow';
}

export interface OnlineGameState {
    id: string | null;
    players: Record<string, OnlinePlayer>;
    board: (string | null)[][];
    currentPlayer: 'red' | 'yellow';
    status: 'waiting' | 'playing' | 'won' | 'draw';
    winner?: 'red' | 'yellow';
    myPlayerId: string | null;
    myPlayerName: string;
    isSearching: boolean;
    isConnected: boolean;
    error: string | null;
}

// プレイヤーIDを生成
export const generatePlayerId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

// マッチング開始
export const startMatchmaking = async (
    playerId: string,
    playerName: string
): Promise<{ success: boolean; gameId?: string; status?: string; message?: string; game?: any }> => {
    try {
        const response = await fetch('http://localhost:8080/api/game/find-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId,
                player_name: playerName
            })
        });

        const data = await response.json();
        console.log('マッチング結果:', data); // デバッグ用

        if (data.success) {
            if (data.status === 'matched') {
                console.log('マッチング成功:', data.game_id); // デバッグ用
                return { success: true, gameId: data.game_id, status: 'matched', game: data.game };
            } else {
                console.log('マッチング待機中:', data.status); // デバッグ用
                return { success: true, status: 'waiting', message: 'マッチング中です...' };
            }
        } else {
            console.log('マッチングエラー:', data.message); // デバッグ用
            return { success: false, message: data.message || 'エラーが発生しました' };
        }
    } catch (err) {
        return { success: false, message: 'サーバーとの接続に失敗しました' };
    }
};

// 手を打つ
export const makeMove = async (
    gameId: string,
    playerId: string,
    column: number
): Promise<{ success: boolean; game?: any; message?: string }> => {
    try {
        const response = await fetch('http://localhost:8080/api/game/make-move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                player_id: playerId,
                column: column
            })
        });

        const data = await response.json();

        if (data.success) {
            return { success: true, game: data.game };
        } else {
            return { success: false, message: data.message || 'エラーが発生しました' };
        }
    } catch (err) {
        return { success: false, message: 'サーバーとの接続に失敗しました' };
    }
};

// ゲームを離れる
export const leaveGame = async (gameId: string, playerId: string): Promise<boolean> => {
    try {
        await fetch('http://localhost:8080/api/game/leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                player_id: playerId
            })
        });
        return true;
    } catch (err) {
        console.error('ゲームを離れる際にエラーが発生しました');
        return false;
    }
};

// Pusher接続を初期化
export const initializePusherConnection = (
    gameId: string,
    onGameStart: (data: any) => void,
    onGameMove: (data: any) => void,
    onPlayerLeft: (data: any) => void
) => {
    const pusherInstance = createPusherInstance();
    const gameChannel = subscribeToGame(pusherInstance, gameId);

    gameChannel.bind('game.start', onGameStart);
    gameChannel.bind('game.move', onGameMove);
    gameChannel.bind('player.left', onPlayerLeft);

    return pusherInstance;
};

// プレイヤーの色を取得
export const getPlayerColor = (players: Record<string, OnlinePlayer>, myPlayerId: string): 'red' | 'yellow' => {
    for (const player of Object.values(players)) {
        if (player.id === myPlayerId) {
            return player.color;
        }
    }
    return 'red';
};

// 自分のターンかどうかを判定
export const isMyTurn = (currentPlayer: 'red' | 'yellow', myColor: 'red' | 'yellow'): boolean => {
    return currentPlayer === myColor;
};

// 空いている行を取得
export const getEmptyRow = (board: (string | null)[][], columnIndex: number): number => {
    for (let row = 6; row >= 0; row--) {
        if (board[row][columnIndex] === null) {
            return row;
        }
    }
    return -1;
};
