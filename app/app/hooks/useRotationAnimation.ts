import { useDispatch, useSelector } from 'react-redux';
import { RootState, startRotationAnimation, endRotationAnimation, setBoard, updateRotationProgress,store } from '../store/gameStore';
import { useGameLogic } from './useGameLogic';
import { useStoneDropAnimation } from './useStoneDropAnimation';
import { useGameActions } from './useGameActions';
import { useCallback, useRef } from 'react';
import { rotateBoardMatrix, applyGravity } from '../lib/boardRotationUtils';

// Cell型をgameStoreから取得
type Cell = 'red' | 'yellow' | null;

export const useRotationAnimation = () => {
    const dispatch = useDispatch();
    const animation = useSelector((state: RootState) => state.game.animation);
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { checkWin, checkDraw } = useGameLogic();
    const { animateStoneDrop } = useStoneDropAnimation();
    const { checkGameResult } = useGameActions();
    const animationRef = useRef<number | null>(null);

    // ボードを回転する関数（共通処理を使用）
    const rotateBoard = useCallback((board: (string | null)[][], direction: 'left' | 'right'): (string | null)[][] => {
        return rotateBoardMatrix(board, direction);
    }, []);

    // 石を落下させる関数（共通処理を使用）
    const applyGravityToBoard = useCallback((board: (string | null)[][]): (string | null)[][] => {
        return applyGravity(board);
    }, []);

    // オフライン対戦用の回転アニメーション
    const animateRotation = useCallback((
        direction: 'left' | 'right',
        duration: number = 1000
    ) => {
        // 現在のボードのスナップショットを取得（回転前の状態）
        const snapshot = board.map(row => [...row]);

        const startTime = Date.now();

        // 回転アニメーション開始（回転前のボードを保持）
        dispatch(startRotationAnimation({
            direction,
            rotatedBoard: snapshot
        }));

        // アニメーションループ
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out関数でアニメーション
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRotation = (direction === 'left' ? -90 : 90) * easeOut;

            // アニメーション状態を更新（currentRotationのみ）
            dispatch(updateRotationProgress({
                currentRotation
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // アニメーション完了後に実際の回転を実行
                setTimeout(() => {
                    // 1. ボードを回転（落下は考慮しない）
                    const rotatedBoard = rotateBoard(snapshot, direction) as Cell[][];
                    console.log('rotatedBoard', rotatedBoard);

                    // 2. 回転後の盤面に落下を適用
                    const settledBoard = applyGravityToBoard(rotatedBoard);
                    console.log('settledBoard', settledBoard);

                    // 回転アニメーション終了
                    dispatch(endRotationAnimation());

                    // 3. 落下アニメーションを実行（回転後の盤面と落下後の盤面の差分）
                    animateStoneDrop(rotatedBoard, settledBoard, () => {
                        // アニメーション完了後の処理
                        // ボードの状態を更新（落下アニメーション完了後）
                        dispatch(setBoard(settledBoard));

                        // 共通の勝利判定処理を使用
                        checkGameResult(settledBoard, currentPlayer);
                    });
                }, 300); // 300msに延長（より自然なタイミング）
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [dispatch, board, rotateBoard, applyGravityToBoard, currentPlayer, checkWin, checkDraw, animateStoneDrop]);

    // オンライン対戦用の回転アニメーション
    const animateOnlineRotation = useCallback((
        direction: 'left' | 'right',
        currentBoard: Cell[][],
        onComplete?: () => void,
        duration: number = 1000
    ) => {
        // 引数として渡されたボードのスナップショットを取得
        const snapshot = currentBoard.map(row => [...row]);
        console.log('snapshot', snapshot);

        const startTime = Date.now();

        // 回転アニメーション開始（回転前のボードを保持）
        dispatch(startRotationAnimation({
            direction,
            rotatedBoard: snapshot
        }));

        // アニメーションループ
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out関数でアニメーション
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRotation = (direction === 'left' ? -90 : 90) * easeOut;

            // アニメーション状態を更新（currentRotationのみ）
            dispatch(updateRotationProgress({
                currentRotation
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // アニメーション完了後に実際の回転を実行
                setTimeout(() => {
                    // 1. ボードを回転（落下は考慮しない）
                    const rotatedBoard = rotateBoard(snapshot, direction) as Cell[][];
                    console.log('rotatedBoard', rotatedBoard);

                    // 2. 回転後の盤面に落下を適用
                    const settledBoard = applyGravityToBoard(rotatedBoard);
                    console.log('settledBoard', settledBoard);

                    // 回転アニメーション終了
                    dispatch(endRotationAnimation());

                    // 3. 落下アニメーションを実行（回転後の盤面と落下後の盤面の差分）
                    animateStoneDrop(rotatedBoard, settledBoard, () => {
                        // アニメーション完了後の処理
                        // オンライン対戦では新しい盤面を直接設定（落下アニメーション完了後）
                        dispatch(setBoard(settledBoard));

                        // コールバックが指定されている場合は実行
                        if (onComplete) {
                            onComplete();
                        }


                    });
                }, 300); // 300msに延長（より自然なタイミング）
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [dispatch, rotateBoard, applyGravityToBoard, animateStoneDrop]);



    // クリーンアップ
    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    return {
        animation,
        animateRotation,
        animateOnlineRotation,
        cleanup
    };
};