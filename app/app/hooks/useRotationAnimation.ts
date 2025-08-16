import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { startRotationAnimation, endRotationAnimation, setBoard, setCurrentPlayer, setGameStatus } from '../store/gameStore';
import { useCallback, useRef } from 'react';
import { useGameLogic } from './useGameLogic';
import { useStoneDropAnimation } from './useStoneDropAnimation';
import { useGameActions } from './useGameActions';

export const useRotationAnimation = () => {
    const dispatch = useDispatch();
    const animation = useSelector((state: RootState) => state.game.animation);
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { checkWin, checkDraw } = useGameLogic();
    const { animateStoneDrop } = useStoneDropAnimation();
    const { checkGameResult } = useGameActions();
    const animationRef = useRef<number | null>(null);

    // ボードを回転する関数
    const rotateBoard = useCallback((board: (string | null)[][], direction: 'left' | 'right'): (string | null)[][] => {
        const rows = board.length;
        const cols = board[0].length;
        const rotated = Array(rows).fill(null).map(() => Array(cols).fill(null));

        if (direction === 'left') {
            // 左回転（反時計回り）
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    rotated[i][j] = board[j][cols - 1 - i];
                }
            }
        } else {
            // 右回転（時計回り）
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    rotated[i][j] = board[rows - 1 - j][i];
                }
            }
        }

        return rotated;
    }, []);

    // 石を落下させる関数（重力効果）
    const applyGravity = useCallback((board: (string | null)[][]): (string | null)[][] => {
        const rows = board.length;
        const cols = board[0].length;
        const newBoard = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // 各列について下から上に向かって石を落下させる
        for (let col = 0; col < cols; col++) {
            let bottomRow = rows - 1;
            for (let row = rows - 1; row >= 0; row--) {
                if (board[row][col] !== null) {
                    newBoard[bottomRow][col] = board[row][col];
                    bottomRow--;
                }
            }
        }

        return newBoard;
    }, []);

    const animateRotation = useCallback((
        direction: 'left' | 'right',
        duration: number = 1000
    ) => {
        // 現在のボードのスナップショットを取得
        const snapshot = board.map(row => [...row]);
        const startTime = Date.now();

        // 回転アニメーション開始
        dispatch(startRotationAnimation({
            direction,
            snapshot
        }));

        // アニメーションループ
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out関数でアニメーション
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRotation = (direction === 'left' ? -90 : 90) * easeOut;

            // アニメーション状態を更新
            dispatch(startRotationAnimation({
                direction,
                snapshot,
                currentRotation
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // アニメーション完了後に実際の回転を実行
                setTimeout(() => {
                    // 1. ボードを回転（落下は考慮しない）
                    const rotatedBoard = rotateBoard(board, direction);

                    // 2. 回転後の盤面に落下を適用
                    const settledBoard = applyGravity(rotatedBoard);

                    console.log('Rotated board:', rotatedBoard); // デバッグ用
                    console.log('Settled board:', settledBoard); // デバッグ用

                    // 3. 落下アニメーションを実行（回転後の盤面と落下後の盤面の差分）
                    animateStoneDrop(rotatedBoard, settledBoard, () => {
                        // アニメーション完了後の処理
                        // ボードの状態を更新
                        dispatch(setBoard(settledBoard));

                        // 共通の勝利判定処理を使用
                        checkGameResult(settledBoard, currentPlayer);
                    });

                    // 回転アニメーション終了
                    dispatch(endRotationAnimation());
                }, 300); // 300msに延長（より自然なタイミング）
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [dispatch, board, rotateBoard, applyGravity, currentPlayer, checkWin, checkDraw, animateStoneDrop]);

    // クリーンアップ
    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    return {
        animation,
        animateRotation,
        cleanup
    };
};