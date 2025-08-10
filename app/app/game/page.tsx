"use client";

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameActions } from '../hooks/useGameActions';
import { useCpuLogic } from '../hooks/useCpuLogic';
import { useStoneAnimation } from '../hooks/useStoneAnimation';
import { useRotationAnimation } from '../hooks/useRotationAnimation';
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
    const { animateStoneDrop, cleanup } = useStoneAnimation();
    const { animateRotation, cleanup: cleanupRotation } = useRotationAnimation();
    const [hoveredColumn, setHoveredColumn] = React.useState<number | null>(null);

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'draw') {
            router.push('/game/result');
        }
    }, [gameStatus, router]);

    useEffect(() => {
        if (gameMode === 'cpu' && currentPlayer === 'yellow' && gameStatus === 'playing' && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones) {
            const timer = setTimeout(() => {
                makeCpuMove();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, gameMode, gameStatus, makeCpuMove, animation.isAnimating, animation.isRotating, animation.isDroppingStones]);

    // アニメーションのクリーンアップ
    useEffect(() => {
        return () => {
            cleanup();
            cleanupRotation();
        };
    }, [cleanup, cleanupRotation]);

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

    // 落下アニメーション中の石の位置を計算
    const getDroppingStonePosition = (rowIndex: number, colIndex: number) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return null;
        }

        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (!droppingStone) {
            return null;
        }

        const progress = animation.dropProgress;
        // セルの高さ（64px）+ マージン（8px）= 72px
        const cellHeight = 64;
        const cellGap = 8;
        const totalCellHeight = cellHeight + cellGap;

        // 現在のセル位置を基準とした相対的な移動距離を計算
        const relativeStartY = (droppingStone.startRow - rowIndex) * totalCellHeight;
        const relativeEndY = (droppingStone.endRow - rowIndex) * totalCellHeight;
        const currentRelativeY = relativeStartY + (relativeEndY - relativeStartY) * progress;

        return {
            transform: `translateY(${currentRelativeY}px)`,
            transition: 'none'
        };
    };

    // 表示するボードを決定
    const displayBoard = animation.isDroppingStones && animation.settledBoard
        ? animation.settledBoard
        : board;

    // 落下アニメーション中に石を表示するかどうかを判定
    const shouldShowStone = (rowIndex: number, colIndex: number, cell: string | null) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return cell !== null;
        }

        // 落下アニメーション中は、回転後の盤面（rotatedBoard）を基準にする
        if (animation.rotatedBoard) {
            // 回転後の盤面で石がある場合は表示
            return animation.rotatedBoard[rowIndex][colIndex] !== null;
        }

        // 回転後の盤面がない場合は、落下中の石の開始位置を基準にする
        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (droppingStone) {
            return true; // 落下中の石を表示
        }

        // 落下後の盤面で石がある場合は表示
        return cell !== null;
    };

    const getStoneColor = (rowIndex: number, colIndex: number, cell: string | null) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return cell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
        }

        // 落下アニメーション中は、回転後の盤面（rotatedBoard）を基準にする
        if (animation.rotatedBoard) {
            const rotatedCell = animation.rotatedBoard[rowIndex][colIndex];
            if (rotatedCell !== null) {
                return rotatedCell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
            }
        }

        // 回転後の盤面がない場合は、落下中の石のplayerプロパティを使用
        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (droppingStone) {
            // 落下中の石は、droppingStoneのplayerプロパティを使用
            return droppingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500';
        }

        return cell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col items-center justify-center p-8">
                <div className="flex items-center gap-24 mb-4">
                    <button
                        onClick={() => animateRotation('left')}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度左回転"
                        disabled={animation.isRotating || animation.isDroppingStones}
                    >
                        <img src="/assets/images/game/icons/left-rotation.png" alt="左回転" className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => animateRotation('right')}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度右回転"
                        disabled={animation.isRotating || animation.isDroppingStones}
                    >
                        <img src="/assets/images/game/icons/right-rotation.png" alt="右回転" className="w-8 h-8" />
                    </button>
                </div>
                <div className="relative" style={{
                    width: 'fit-content',
                    height: 'fit-content',
                    minWidth: '500px',
                    minHeight: '500px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div
                        className="grid grid-cols-7 gap-2 bg-blue-500 p-4 rounded-lg"
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            minWidth: '500px',
                            minHeight: '500px',
                            // 回転アニメーション中は回転を適用
                            transform: animation.isRotating ? `rotate(${animation.currentRotation}deg)` : 'rotate(0deg)',
                            transition: animation.isRotating ? 'transform 0.1s ease-out' : 'none',
                            transformOrigin: 'center center'
                        }}
                    >
                        {(animation.isRotating && animation.rotationSnapshot ? animation.rotationSnapshot : displayBoard).map((row, rowIndex) => (
                            row.map((cell, colIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="bg-white rounded-full relative cursor-pointer"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        minWidth: '64px',
                                        minHeight: '64px'
                                    }}
                                    onMouseEnter={() => !animation.isRotating && !animation.isDroppingStones && setHoveredColumn(colIndex)}
                                    onMouseLeave={() => !animation.isRotating && !animation.isDroppingStones && setHoveredColumn(null)}
                                    onClick={() => {
                                        if ((gameMode === 'pvp' || currentPlayer === 'red') && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones) {
                                            handleColumnClick(colIndex);
                                        }
                                    }}
                                >
                                    {shouldShowStone(rowIndex, colIndex, cell) && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${getStoneColor(rowIndex, colIndex, cell)} absolute top-1 left-1`}
                                            style={{
                                                ...getDroppingStonePosition(rowIndex, colIndex),
                                                zIndex: 10
                                            }}
                                        />
                                    )}
                                    {isAnimatingStone(rowIndex, colIndex) && animation.animatingStone && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${animation.animatingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`}
                                            style={{
                                                ...getStoneAnimationStyle(rowIndex, colIndex),
                                                zIndex: 10
                                            }}
                                        />
                                    )}
                                    {hoveredColumn === colIndex && getEmptyRow(colIndex) === rowIndex && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${currentPlayer === 'red' ? 'bg-red-500/30' : 'bg-yellow-500/30'} border-2 border-dashed ${currentPlayer === 'red' ? 'border-red-500' : 'border-yellow-500'} absolute top-1 left-1`}
                                            style={{ zIndex: 10 }}
                                        />
                                    )}
                                </div>
                            ))
                        ))}
                    </div>
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