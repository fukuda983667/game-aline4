import { useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, store } from '../store/gameStore';
import {
    updateBoard,
    setConnected,
    setError,
    resetGame,
    playerLeft,
} from '../store/onlineGameStore';
import {
    makeMove,
    leaveGame,
    rotateBoard,
    initializePusherConnection,
    getPlayerColor,
    isMyTurn,
    getEmptyRow,
} from '../lib/onlineGameFunctions';
import { useStoneAnimation } from './useStoneAnimation';
import { useRotationAnimation } from './useRotationAnimation';

type Cell = 'red' | 'yellow' | null;

/**
 * オンラインゲーム中の機能を提供するフック
 * 石を置く、ボードを回転させる、ゲームを離れるなどの機能を提供
 */
export const useOnlineGame = () => {
    const dispatch = useDispatch();
    const onlineGame = useSelector((state: RootState) => state.onlineGame);
    const pusherRef = useRef<any>(null);
    const { animateStoneDrop } = useStoneAnimation();
    const { animateOnlineRotation } = useRotationAnimation();

    /**
     * 石を置く処理
     * @param columnIndex 列のインデックス
     */
    const makeMoveProcess = useCallback(async (columnIndex: number) => {
        if (!onlineGame.id || !onlineGame.myPlayerId || onlineGame.status !== 'playing') {
            return;
        }

        const result = await makeMove(onlineGame.id, onlineGame.myPlayerId, columnIndex);

        if (result.success) {
            console.log('makeMove成功:', result.game); // デバッグ用
            // 自分の手の場合は即座にボードを更新しない
            // WebSocketのGameMoveイベントを受信してからアニメーションを実行する
            console.log('makeMove完了、WebSocketイベント待機中...'); // デバッグ用
        } else {
            dispatch(setError(result.message || 'エラーが発生しました'));
        }
    }, [onlineGame.id, onlineGame.myPlayerId, onlineGame.status, dispatch]);

    /**
     * ボードを回転させる処理
     * @param direction 回転方向（'left' | 'right'）
     */
    const rotateBoardProcess = useCallback(async (direction: 'left' | 'right') => {
        if (!onlineGame.id || !onlineGame.myPlayerId || onlineGame.status !== 'playing') {
            return;
        }

        const result = await rotateBoard(onlineGame.id, onlineGame.myPlayerId, direction);

        if (result.success) {
            console.log('rotateBoard成功:', result.game); // デバッグ用
            // 自分の回転の場合は即座にボードを更新しない
            // WebSocketのGameMoveイベントを受信してからアニメーションを実行する
            console.log('rotateBoard完了、WebSocketイベント待機中...'); // デバッグ用
        } else {
            dispatch(setError(result.message || 'エラーが発生しました'));
        }
    }, [onlineGame.id, onlineGame.myPlayerId, onlineGame.status, dispatch]);

    /**
     * Pusher接続を初期化（ゲームチャンネル用）
     * @param gameId ゲームID
     */
    const initializePusher = useCallback((gameId: string) => {
        console.log('Pusher接続開始:', gameId); // デバッグ用

        const onGameStart = (data: any) => {
            console.log('GameStartイベント受信 (ゲームチャンネル):', data); // デバッグ用
            dispatch(updateBoard({
                board: data.game.board,
                currentPlayer: data.game.current_player,
                status: data.game.status,
                winner: data.game.winner
            }));
        };

        const onGameMove = (data: any) => {
            console.log('GameMoveイベント受信:', data); // デバッグ用
            const currentOnlineGame = store.getState().onlineGame;
            console.log('最新のonlineGame状態:', currentOnlineGame);

            // 自分と相手の手を区別
            const isMyMove = data.move && data.move.playerId === onlineGame.myPlayerId;
            console.log('自分の手かどうか:', isMyMove, 'playerId:', data.move?.playerId, 'myPlayerId:', onlineGame.myPlayerId);

            if (data.game && data.game.board) {
                const moveData = data.move;

                // 回転イベントの処理
                if (moveData && moveData.rotated) {
                    const direction = moveData.direction || 'left';
                    console.log(`${isMyMove ? '自分' : '相手'}がボードを回転しました。方向: ${direction}`);

                    // 回転アニメーションを実行（自分と相手共通）
                    animateOnlineRotation(direction, store.getState().onlineGame.board as Cell[][], () => {
                        // アニメーション完了後に盤面更新を実行
                        dispatch(updateBoard({
                            board: data.game.board,
                            currentPlayer: data.game.current_player,
                            status: data.game.status,
                            winner: data.game.winner
                        }));
                        console.log(`${isMyMove ? '自分の' : '相手の'}回転アニメーション完了、盤面更新完了`);
                    });
                    return;
                }

                // 石を置いたイベントの処理
                if (moveData && moveData.column !== undefined && moveData.row !== undefined && moveData.color) {
                    console.log(`${isMyMove ? '自分' : '相手'}が打った石の情報:`, moveData);

                    // 石の落下アニメーションを実行（自分と相手共通）
                    console.log(`${isMyMove ? '自分の' : '相手の'}石 - 列 ${moveData.column}, 行 ${moveData.row} でアニメーション開始: ${moveData.color}`);
                    animateStoneDrop(moveData.column, moveData.row, moveData.color).then(() => {
                        console.log(`${isMyMove ? '自分の' : '相手の'}石のアニメーション完了、盤面更新を実行`);
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

            // アニメーションが実行されない場合（その他の状態更新）は即座に盤面更新
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
    }, [dispatch, onlineGame.myPlayerId, animateStoneDrop, animateOnlineRotation]);

    /**
     * ゲームを離れる処理
     */
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

    /**
     * プレイヤーの色を取得
     * @returns プレイヤーの色（'red' | 'yellow'）
     */
    const getMyPlayerColor = useCallback((): 'red' | 'yellow' => {
        return getPlayerColor(onlineGame.players, onlineGame.myPlayerId || '');
    }, [onlineGame.players, onlineGame.myPlayerId]);

    /**
     * 自分のターンかどうかを判定
     * @returns 自分のターンの場合true
     */
    const isMyTurnProcess = useCallback((): boolean => {
        return isMyTurn(onlineGame.currentPlayer, getMyPlayerColor());
    }, [onlineGame.currentPlayer, getMyPlayerColor]);

    /**
     * 空いている行を取得
     * @param columnIndex 列のインデックス
     * @returns 空いている行のインデックス（空きがない場合は-1）
     */
    const getEmptyRowProcess = useCallback((columnIndex: number): number => {
        return getEmptyRow(onlineGame.board, columnIndex);
    }, [onlineGame.board]);

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
        makeMove: makeMoveProcess,
        rotateBoard: rotateBoardProcess,
        leaveGame: leaveGameProcess,
        initializePusher,
        getPlayerColor: getMyPlayerColor,
        isMyTurn: isMyTurnProcess,
        getEmptyRow: getEmptyRowProcess,
        disconnectPusher,
        pusherRef,
        animateStoneDrop,
        animateOnlineRotation,
    };
};
