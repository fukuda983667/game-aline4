"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameActions } from '../hooks/useGameActions';
import { useRouter } from 'next/navigation';

export default function GamePage() {
    const router = useRouter();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const dispatch = useDispatch();
    const { checkWin, checkDraw } = useGameLogic();
    const { handleColumnClick } = useGameActions();
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

    React.useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'draw') {
            router.push('/result');
        }
    }, [gameStatus, router]);

    const getEmptyRow = (columnIndex: number): number => {
        for (let row = 6; row >= 0; row--) {
            if (board[row][columnIndex] === null) {
                return row;
            }
        }
        return -1;
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col items-center justify-center p-8">
                <div className="grid grid-cols-7 gap-2 bg-blue-500 p-4 rounded-lg">
                    {board.map((row, rowIndex) => (
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="w-16 h-16 bg-white rounded-full relative cursor-pointer"
                                onMouseEnter={() => setHoveredColumn(colIndex)}
                                onMouseLeave={() => setHoveredColumn(null)}
                                onClick={() => handleColumnClick(colIndex)}
                            >
                                {cell && (
                                    <div className={`w-14 h-14 rounded-full ${cell === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`} />
                                )}
                                {hoveredColumn === colIndex && getEmptyRow(colIndex) === rowIndex && (
                                    <div className={`w-14 h-14 rounded-full ${currentPlayer === 'red' ? 'bg-red-500/30' : 'bg-yellow-500/30'} border-2 border-dashed ${currentPlayer === 'red' ? 'border-red-500' : 'border-yellow-500'} absolute top-1 left-1`} />
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>
        </div>
    );
} 