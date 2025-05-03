import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useGameActions } from '../hooks/useGameActions';

export const GameBoard: React.FC = () => {
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { handleColumnClick, rotateBoard } = useGameActions();

    return (
        <div className="game-board">
            <div className="board">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <div
                                key={colIndex}
                                className={`cell ${cell || 'empty'}`}
                                onClick={() => handleColumnClick(colIndex)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};