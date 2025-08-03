"use client";

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameActions } from '../hooks/useGameActions';
import { useCpuLogic } from '../hooks/useCpuLogic';
import { useBoardRotation } from '../hooks/useBoardRotation';
import { useStoneAnimation } from '../hooks/useStoneAnimation';
import { useRouter } from 'next/navigation';

export default function GamePage() {
    const router = useRouter();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const gameMode = useSelector((state: RootState) => state.game.gameMode);
    const animation = useSelector((state: RootState) => state.game.animation);
    const dispatch = useDispatch();
    const { checkWin, checkDraw } = useGameLogic();
    const { handleColumnClick } = useGameActions();
    const { makeCpuMove } = useCpuLogic();
    const { rotateBoardLeft, rotateBoardRight } = useBoardRotation();
    const { animateStoneDrop, cleanup } = useStoneAnimation();
    const [hoveredColumn, setHoveredColumn] = React.useState<number | null>(null);

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'draw') {
            router.push('/game/result');
        }
    }, [gameStatus, router]);

    useEffect(() => {
        if (gameMode === 'cpu' && currentPlayer === 'yellow' && gameStatus === 'playing' && !animation.isAnimating) {
            const timer = setTimeout(() => {
                makeCpuMove();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, gameMode, gameStatus, makeCpuMove, animation.isAnimating]);

    // アニメーションのクリーンアップ
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const getEmptyRow = (columnIndex: number): number => {
        for (let row = 6; row >= 0; row--) {
            if (board[row][columnIndex] === null) {
                return row;
            }
        }
        return -1;
    };

    const isAnimatingStone = (rowIndex: number, colIndex: number): boolean => {
        return animation.animatingStone !== null &&
                animation.animatingStone.row === rowIndex &&
                animation.animatingStone.column === colIndex;
    };

    const getStoneAnimationStyle = (rowIndex: number, colIndex: number) => {
        if (!isAnimatingStone(rowIndex, colIndex) || !animation.animatingStone) {
            return {};
        }

        // アニメーション中の石の位置を計算
        const currentY = animation.animatingStone.endY;

        return {
            transform: `translateY(${currentY}px)`,
            transition: 'none' // CSS transitionを無効にして、JavaScriptで制御
        };
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col items-center justify-center p-8">
                <div className="flex items-center gap-24 mb-4">
                    <button
                        onClick={rotateBoardLeft}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度左回転"
                    >
                        <img src="/assets/images/game/icons/left-rotation.png" alt="左回転" className="w-8 h-8" />
                    </button>
                    <button
                        onClick={rotateBoardRight}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度右回転"
                    >
                        <img src="/assets/images/game/icons/right-rotation.png" alt="右回転" className="w-8 h-8" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-2 bg-blue-500 p-4 rounded-lg relative">
                    {board.map((row, rowIndex) => (
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="w-16 h-16 bg-white rounded-full relative cursor-pointer"
                                onMouseEnter={() => setHoveredColumn(colIndex)}
                                onMouseLeave={() => setHoveredColumn(null)}
                                onClick={() => {
                                    if ((gameMode === 'pvp' || currentPlayer === 'red') && !animation.isAnimating) {
                                        handleColumnClick(colIndex);
                                    }
                                }}
                            >
                                {cell && !isAnimatingStone(rowIndex, colIndex) && (
                                    <div className={`w-14 h-14 rounded-full ${cell === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`} />
                                )}
                                {isAnimatingStone(rowIndex, colIndex) && animation.animatingStone && (
                                    <div 
                                        className={`w-14 h-14 rounded-full ${animation.animatingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`}
                                        style={getStoneAnimationStyle(rowIndex, colIndex)}
                                    />
                                )}
                                {hoveredColumn === colIndex && getEmptyRow(colIndex) === rowIndex && !animation.isAnimating && (
                                    <div className={`w-14 h-14 rounded-full ${currentPlayer === 'red' ? 'bg-red-500/30' : 'bg-yellow-500/30'} border-2 border-dashed ${currentPlayer === 'red' ? 'border-red-500' : 'border-yellow-500'} absolute top-1 left-1`} />
                                )}
                            </div>
                        ))
                    ))}
                </div>
                <div className="mt-4 text-xl font-bold">
                    {gameMode === 'cpu' ? (
                        currentPlayer === 'red' ? 'あなたのターン' : 'CPUのターン'
                    ) : (
                        currentPlayer === 'red' ? 'プレイヤー1のターン' : 'プレイヤー2のターン'
                    )}
                </div>
            </div>
        </div>
    );
}