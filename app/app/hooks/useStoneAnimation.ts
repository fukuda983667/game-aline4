import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { startStoneAnimation, endStoneAnimation } from '../store/gameStore';
import { useCallback, useRef } from 'react';

export const useStoneAnimation = () => {
    const dispatch = useDispatch();
    const animation = useSelector((state: RootState) => state.game.animation);
    const animationRef = useRef<number | null>(null);

    const animateStoneDrop = useCallback((
        columnIndex: number,
        targetRow: number,
        player: 'red' | 'yellow',
        duration: number = 500
    ) => {
        // ボード全体の高さ（7行 × 64px + gap + padding）
        const boardHeight = 7 * 64 + 6 * 8 + 32; // 7行 × 64px + 6個のgap + padding
        // 石が置かれる行までの高さ
        const targetRowHeight = (7 - targetRow - 1) * 64 + (7 - targetRow - 1) * 8; // 下から数えた行数分の高さ
        // 動的に計算された開始位置（ボード全体の高さから該当行までの差分）
        const startY = -(boardHeight - targetRowHeight);
        const endY = 0; // 最終位置
        const startTime = Date.now();

        // アニメーション開始
        dispatch(startStoneAnimation({
            column: columnIndex,
            row: targetRow,
            player,
            startY,
            endY
        }));

        // アニメーションループ
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out関数でアニメーション
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentY = startY + (endY - startY) * easeOut;

            // アニメーション状態を更新
            dispatch(startStoneAnimation({
                column: columnIndex,
                row: targetRow,
                player,
                startY,
                endY: currentY
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // アニメーション完了
                dispatch(endStoneAnimation());
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [dispatch]);

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