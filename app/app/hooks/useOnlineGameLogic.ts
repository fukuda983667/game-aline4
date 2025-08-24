import { useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import { 
    generatePlayerId, 
    startMatchmaking, 
    makeMove, 
    leaveGame, 
    initializePusherConnection,
    getPlayerColor,
    isMyTurn,
    getEmptyRow,
    type OnlinePlayer
} from '../lib/onlineGameFunctions';
import { useStoneAnimation } from './useStoneAnimation';
import {
    setMyPlayerInfo,
    updatePlayerName as updatePlayerNameAction,
    startSearching,
    stopSearching,
    setGameState,
    updateBoard,
    setConnected,
    setError,
    clearError,
    resetGame,
    playerLeft
} from '../store/onlineGameStore';

export const useOnlineGameLogic = () => {
    const dispatch = useDispatch();
    const onlineGame = useSelector((state: RootState) => state.onlineGame);
    const pusherRef = useRef<any>(null);
    const { animateStoneDrop } = useStoneAnimation();

    // プレイヤーを初期化
    const initializePlayer = useCallback((name: string) => {
        const playerId = generatePlayerId();
        dispatch(setMyPlayerInfo({ id: playerId, name }));
        return playerId;
    }, [dispatch]);

    // プレイヤー名を更新
    const updatePlayerName = useCallback((name: string) => {
        dispatch(updatePlayerNameAction(name));
    }, [dispatch]);

    // マッチング開始
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

    // ゲーム状態を設定
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

    // 手を打つ
    const makeMoveProcess = useCallback(async (columnIndex: number) => {
        if (!onlineGame.id || !onlineGame.myPlayerId || onlineGame.status !== 'playing') {
            return;
        }

        const result = await makeMove(onlineGame.id, onlineGame.myPlayerId, columnIndex);

        if (result.success && result.game) {
            console.log('makeMove成功:', result.game); // デバッグ用
            // ゲームの状態を完全に更新（勝利判定後の状態も含む）
            dispatch(updateBoard({
                board: result.game.board,
                currentPlayer: result.game.current_player,
                status: result.game.status,
                winner: result.game.winner
            }));
            console.log('makeMove後の状態更新完了'); // デバッグ用
        } else {
            dispatch(setError(result.message || 'エラーが発生しました'));
        }
    }, [onlineGame.id, onlineGame.myPlayerId, onlineGame.status, dispatch]);

    // Pusher接続を初期化
    const initializePusher = useCallback((gameId: string) => {
        console.log('Pusher接続開始:', gameId); // デバッグ用

        const onGameStart = (data: any) => {
            console.log('GameStartイベント受信 (ゲームチャンネル):', data); // デバッグ用
            setGameStateProcess(data.game);
        };

        const onGameMove = (data: any) => {
            console.log('GameMoveイベント受信:', data); // デバッグ用

            // アニメーションの実行と盤面の更新をするかしないかの判定
            // 自分の手番になっているということは、相手が手を打ったということ
            // ただし、自分が手を打った場合はアニメーションを実行しない
            const isMyMove = data.move && data.move.playerId === onlineGame.myPlayerId;

            // 現在のプレイヤーが自分かどうかを判定
            const currentPlayerId = Object.keys(data.game.players).find(
                playerId => data.game.players[playerId].color === data.game.current_player
            );
            const isCurrentlyMyTurn = currentPlayerId === onlineGame.myPlayerId;

            const shouldAnimateAndUpdate = !isMyMove; // 相手が手を打った場合にアニメーション実行

            console.log('myPlayerId:', onlineGame.myPlayerId);
            console.log('currentPlayerId:', currentPlayerId);
            console.log('isCurrentlyMyTurn:', isCurrentlyMyTurn);
            console.log('isMyMove:' + isMyMove, 'isCurrentlyMyTurn:' + isCurrentlyMyTurn, 'shouldAnimateAndUpdate:' + shouldAnimateAndUpdate);

            if (shouldAnimateAndUpdate && data.game && data.game.board) {
                // 相手が打った石の情報を直接取得
                const moveData = data.move;
                if (moveData && moveData.column !== undefined && moveData.row !== undefined && moveData.color) {
                    console.log('相手が打った石の情報:', moveData);

                    // 相手が打った石の落下アニメーションを実行
                    console.log(`列 ${moveData.column}, 行 ${moveData.row} でアニメーション開始: ${moveData.color}`);

                    // アニメーション完了後に盤面更新を実行
                    animateStoneDrop(moveData.column, moveData.row, moveData.color).then(() => {
                        console.log('アニメーション完了、盤面更新を実行');
                        dispatch(updateBoard({
                            board: data.game.board,
                            currentPlayer: data.game.current_player,
                            status: data.game.status,
                            winner: data.game.winner
                        }));
                    });

                    // アニメーション実行中は早期リターン
                    return;
                } else {
                    console.log('moveDataが不完全です:', moveData);
                }
            }

            // アニメーションが実行されない場合（相手の手番の場合）は即座に盤面更新
            dispatch(updateBoard({
                board: data.game.board,
                currentPlayer: data.game.current_player,
                status: data.game.status,
                winner: data.game.winner
            }));
            console.log('GameMove後の状態更新完了'); // デバッグ用
        };

        const onPlayerLeft = (data: any) => {
            dispatch(playerLeft());
        };

        pusherRef.current = initializePusherConnection(gameId, onGameStart, onGameMove, onPlayerLeft);

        dispatch(setConnected(true));
    }, [setGameStateProcess, dispatch]);

    // ゲームを離れる
    const leaveGameProcess = useCallback(async () => {
        if (onlineGame.id && onlineGame.myPlayerId) {
            await leaveGame(onlineGame.id, onlineGame.myPlayerId);
        }

        if (pusherRef.current) {
            pusherRef.current.disconnect();
            pusherRef.current = null;
        }

        dispatch(resetGame());
    }, [onlineGame.id, onlineGame.myPlayerId, dispatch]);

    // エラーをクリア
    const clearErrorProcess = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    // プレイヤーの色を取得
    const getMyPlayerColor = useCallback((): 'red' | 'yellow' => {
        return getPlayerColor(onlineGame.players, onlineGame.myPlayerId || '');
    }, [onlineGame.players, onlineGame.myPlayerId]);

    // 自分のターンかどうかを判定
    const isMyTurnProcess = useCallback((): boolean => {
        return isMyTurn(onlineGame.currentPlayer, getMyPlayerColor());
    }, [onlineGame.currentPlayer, getMyPlayerColor]);

    // 空いている行を取得
    const getEmptyRowProcess = useCallback((columnIndex: number): number => {
        return getEmptyRow(onlineGame.board, columnIndex);
    }, [onlineGame.board]);

    return {
        onlineGame,
        initializePlayer,
        updatePlayerName,
        startMatchmaking: startMatchmakingProcess,
        makeMove: makeMoveProcess,
        leaveGame: leaveGameProcess,
        initializePusher,
        getPlayerColor: getMyPlayerColor,
        isMyTurn: isMyTurnProcess,
        getEmptyRow: getEmptyRowProcess,
        clearError: clearErrorProcess,
        pusherRef,
        animateStoneDrop
    };
};
