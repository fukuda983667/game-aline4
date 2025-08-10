import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { startStoneDropAnimation, endStoneDropAnimation, setBoard, setCurrentPlayer, setGameStatus } from '../store/gameStore';
import { useCallback, useRef } from 'react';
import { useGameLogic } from './useGameLogic';

// 型定義
type Cell = 'red' | 'yellow' | null;

interface StonePosition {
    row: number;
    col: number;
    player: string;
    startRow: number;
    endRow: number;
}

export const useStoneDropAnimation = () => {
    const dispatch = useDispatch();
    const animation = useSelector((state: RootState) => state.game.animation);
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { checkWin, checkDraw } = useGameLogic();
    const animationRef = useRef<number | null>(null);

    // 石の落下アニメーションを実行する関数
    const animateStoneDrop = useCallback((
        rotatedBoard: (string | null)[][], // 回転後の盤面（落下なし）
        settledBoard: (string | null)[][], // 落下後の盤面
        onComplete?: () => void
    ) => {
        // 浮いている石の位置を計算
        const floatingStones: StonePosition[] = [];

        // 各列ごとに石の移動を追跡
        for (let col = 0; col < rotatedBoard[0].length; col++) {
            // ①回転後（落下前）の座標を保持
            const rotatedStones: { row: number; player: string }[] = [];
            for (let row = 0; row < rotatedBoard.length; row++) {
                if (rotatedBoard[row][col] !== null) {
                    rotatedStones.push({
                        row,
                        player: rotatedBoard[row][col]!
                    });
                }
            }

            // ②回転後（落下後）の座標を計算（重力効果をシミュレート）
            const gravitySimulation = simulateGravity(rotatedStones, col, rotatedBoard);

            // ③落下時の距離を計算
            for (let i = 0; i < rotatedStones.length; i++) {
                const originalStone = rotatedStones[i];
                const finalStone = gravitySimulation[i];

                // 実際に移動する石のみを記録（移動距離が0より大きい場合のみ）
                if (originalStone.row !== finalStone.row && finalStone.row >= 0 && finalStone.row < 7) {
                    floatingStones.push({
                        row: originalStone.row, // 開始位置
                        col,
                        player: originalStone.player,
                        startRow: originalStone.row, // 開始位置
                        endRow: finalStone.row // 終了位置
                    });
                }
            }
        }

        console.log('Floating stones:', floatingStones); // デバッグ用

        if (floatingStones.length === 0) {
            // 浮いている石がない場合は即座に完了
            dispatch(setBoard(settledBoard as Cell[][]));
            if (onComplete) onComplete();
            return;
        }

        // 落下アニメーション開始
        dispatch(startStoneDropAnimation({
            floatingStones,
            rotatedBoard: rotatedBoard as Cell[][],
            settledBoard: settledBoard as Cell[][]
        }));

        // アニメーションループ
        const startTime = Date.now();
        const duration = 1500; // 1.5秒で落下（より自然な速度）

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out関数でアニメーション
            const easeOut = 1 - Math.pow(1 - progress, 3);

            // アニメーション状態を更新
            dispatch(startStoneDropAnimation({
                floatingStones,
                rotatedBoard: rotatedBoard as Cell[][],
                settledBoard: settledBoard as Cell[][],
                progress: easeOut
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // アニメーション完了
                dispatch(setBoard(settledBoard as Cell[][]));
                dispatch(endStoneDropAnimation());
                if (onComplete) onComplete();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [dispatch, checkWin, checkDraw]);

    // 重力効果をシミュレートする関数
    const simulateGravity = (stones: { row: number; player: string }[], col: number, board: (string | null)[][]): { row: number; player: string }[] => {
        const result: { row: number; player: string }[] = [];

        // 各石について、その下の空きマスの数を計算
        for (let i = 0; i < stones.length; i++) {
            const stone = stones[i];

            // この石の下にある空きマスの数を計算
            let emptySpacesBelow = 0;
            for (let r = stone.row + 1; r < board.length; r++) {
                if (board[r][col] === null) {
                    emptySpacesBelow++;
                }
            }

            // 落下後の座標を計算（ボードの範囲内に制限）
            const finalRow = Math.min(stone.row + emptySpacesBelow, board.length - 1);

            console.log(`Stone at row ${stone.row}: emptySpacesBelow=${emptySpacesBelow}, finalRow=${finalRow}`); // デバッグ用

            result.push({
                row: finalRow,
                player: stone.player
            });
        }

        return result;
    };

    // クリーンアップ
    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    return {
        animation,
        animateStoneDrop,
        cleanup
    };
};