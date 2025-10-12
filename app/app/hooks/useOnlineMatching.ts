import { useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, store } from '../store/gameStore';
import {
    setMyPlayerInfo,
    updatePlayerName as updatePlayerNameAction,
    startSearching,
    setGameState,
    setConnected,
    setError,
    clearError,
} from '../store/onlineGameStore';
import {
    generatePlayerId,
    startMatchmaking,
    initializePusherConnection,
} from '../lib/onlineGameFunctions';

/**
 * オンラインマッチング機能を提供するフック
 * プレイヤーの初期化、マッチング開始、Pusher接続の管理を行う
 */
export const useOnlineMatching = () => {
    const dispatch = useDispatch();
    const onlineGame = useSelector((state: RootState) => state.onlineGame);
    const pusherRef = useRef<any>(null);

    /**
     * プレイヤー情報を初期化
     * @param name プレイヤー名
     * @returns 生成されたプレイヤーID
     */
    const initializePlayer = useCallback((name: string) => {
        const playerId = generatePlayerId();
        dispatch(setMyPlayerInfo({ id: playerId, name }));
        return playerId;
    }, [dispatch]);

    /**
     * プレイヤー名を更新
     * @param name 新しいプレイヤー名
     */
    const updatePlayerName = useCallback((name: string) => {
        dispatch(updatePlayerNameAction(name));
    }, [dispatch]);

    /**
     * マッチング開始処理
     * @returns マッチング結果（成功時はgameId、待機中は'waiting'、失敗時はnull）
     */
    const startMatchmakingProcess = useCallback(async () => {
        if (!onlineGame.myPlayerId || !onlineGame.myPlayerName.trim()) {
            dispatch(setError('プレイヤー情報が設定されていません'));
            return null;
        }

        dispatch(startSearching());

        const result = await startMatchmaking(onlineGame.myPlayerId, onlineGame.myPlayerName);

        if (result.success) {
            if (result.status === 'matched' && result.gameId) {
                // マッチング成功 - 状態を即座に更新
                dispatch(setGameState({
                    id: result.game.id,
                    players: result.game.players,
                    board: result.game.board,
                    currentPlayer: result.game.current_player,
                    status: result.game.status,
                    winner: result.game.winner
                }));
                dispatch(setConnected(true));
                return result.gameId;
            } else {
                // 待機中
                dispatch(setError(result.message || 'マッチング中です...'));
                // 待機中は、waiting-playersチャンネルに接続
                return 'waiting';
            }
        } else {
            dispatch(setError(result.message || 'エラーが発生しました'));
        }

        return null;
    }, [onlineGame.myPlayerId, onlineGame.myPlayerName, dispatch]);

    /**
     * ゲーム状態を設定（Pusherイベント受信時）
     * @param gameData ゲームデータ
     */
    const setGameStateProcess = useCallback((gameData: any) => {
        console.log('GameStartイベント受信:', gameData); // デバッグ用
        console.log('自分のプレイヤーID:', onlineGame.myPlayerId);
        console.log('プレイヤー情報:', gameData.players);

        dispatch(setGameState({
            id: gameData.id,
            players: gameData.players,
            board: gameData.board,
            currentPlayer: gameData.current_player,
            status: gameData.status,
            winner: gameData.winner
        }));
        dispatch(setConnected(true));
    }, [dispatch, onlineGame.myPlayerId]);

    /**
     * Pusher接続を初期化（待機中チャンネル用）
     * @param onGameMatchedCallback マッチング成功時のコールバック
     */
    const initializeWaitingPusher = useCallback((onGameMatchedCallback: (gameData: any) => void) => {
        console.log('待機中Pusher接続開始'); // デバッグ用

        const onGameStart = (data: any) => {
            console.log('GameStartイベント受信 (待機チャンネル):', data); // デバッグ用
            setGameStateProcess(data.game);
            onGameMatchedCallback(data.game);
        };

        // 待機中プレイヤー用のPusher接続
        pusherRef.current = initializePusherConnection('waiting-players', onGameStart, () => {}, () => {});

        dispatch(setConnected(true));
    }, [setGameStateProcess, dispatch]);

    /**
     * エラーをクリア
     */
    const clearErrorProcess = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    /**
     * Pusher接続を切断
     */
    const disconnectPusher = useCallback(() => {
        if (pusherRef.current) {
            pusherRef.current.disconnect();
            pusherRef.current = null;
        }
    }, []);

    return {
        onlineGame,
        initializePlayer,
        updatePlayerName,
        startMatchmaking: startMatchmakingProcess,
        initializeWaitingPusher,
        clearError: clearErrorProcess,
        disconnectPusher,
        pusherRef,
    };
};

