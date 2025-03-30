"use client";

import React from 'react';
import { useState, useEffect } from 'react';


interface Cell {
    value: number | null;
}

interface GameBoardProps {
    resetTrigger: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ resetTrigger }) => {
    // 7行7列の盤面を初期化
    const [board, setBoard] = useState<Cell[][]>(
        Array(7).fill(null).map(() =>
            Array(7).fill(null).map(() => ({ value: null }))
        )
    );
    const [currentPlayer, setCurrentPlayer] = useState<number>(1);
    const [isGameSet, setIsGameSet] = useState<boolean>(false);
    const [winnerMessage, setWinnerMessage] = useState("");

    // リセット処理を監視するuseEffect
    useEffect(() => {
        setBoard(Array(7).fill(null).map(() =>
            Array(7).fill(null).map(() => ({ value: null }))
        ));
        setCurrentPlayer(1);
        setIsGameSet(false);
        setWinnerMessage("");
    }, [resetTrigger]);

    const checkWin = (newBoard: Cell[][], currentPlayer: number) => {
        // 横方向のチェック
        for (let row = 0; row < newBoard.length; row++) {
            for (let col = 0; col < newBoard[row].length - 3; col++) {
                if (
                    newBoard[row][col].value === currentPlayer &&
                    newBoard[row][col + 1].value === currentPlayer &&
                    newBoard[row][col + 2].value === currentPlayer &&
                    newBoard[row][col + 3].value === currentPlayer
                ) {
                    return true;
                }
            }
        }

        // 縦方向のチェック
        for (let col = 0; col < newBoard[0].length; col++) {
            for (let row = 0; row < newBoard.length - 3; row++) {
                if (
                    newBoard[row][col].value === currentPlayer &&
                    newBoard[row + 1][col].value === currentPlayer &&
                    newBoard[row + 2][col].value === currentPlayer &&
                    newBoard[row + 3][col].value === currentPlayer
                ) {
                    return true;
                }
            }
        }

        // 斜め方向（左上→右下）のチェック
        // 左端を起点に四回繰り返す。
        for (let row = 0; row < newBoard.length - 3; row++) {
            // 上を起点に三回繰り返す。
            for (let col = 0; col < newBoard[row].length - 3; col++) {
                if (
                    newBoard[row][col].value === currentPlayer &&
                    newBoard[row + 1][col + 1].value === currentPlayer &&
                    newBoard[row + 2][col + 2].value === currentPlayer &&
                    newBoard[row + 3][col + 3].value === currentPlayer
                ) {
                    return true;
                }
            }
        }

        // 斜め方向（左下→右上）のチェック
        for (let row = 3; row < newBoard.length; row++) {
            for (let col = 0; col < newBoard[row].length - 3; col++) {
                if (
                    newBoard[row][col].value === currentPlayer &&
                    newBoard[row - 1][col + 1].value === currentPlayer &&
                    newBoard[row - 2][col + 2].value === currentPlayer &&
                    newBoard[row - 3][col + 3].value === currentPlayer
                ) {
                    return true;
                }
            }
        }

        // 勝利がなければ false を返す
        return false;
    };

    useEffect(() => {
        // ゲームが終了していないときに勝利判定する。
        if (!isGameSet) {
            const winner = checkWin(board, currentPlayer === 1 ? 2 : 1);
            if (winner) {
                setIsGameSet(true);
                setWinnerMessage(`${currentPlayer === 1 ? "Yellow" : "Red"}の勝利です！`); // ✅ メッセージ更新
            }
        }
    }, [board, currentPlayer, isGameSet]);

    // 列をクリックしたときの処理
    const handleColumnClick = (columnIndex: number) => {
        if (isGameSet) return; // ゲーム終了後は操作を無効化

        const newBoard = [...board];
        // 下から順に空いているマスを探す
        for (let row = newBoard.length - 1; row >= 0; row--) {
            if (!newBoard[row][columnIndex].value) {
                newBoard[row][columnIndex].value = currentPlayer;
                setBoard(newBoard);
                setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
                break;
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="mb-4 text-xl font-bold text-gray-800">
                {winnerMessage || `プレイヤー${currentPlayer}の番です`}
            </div>

            {/* ゲームボード */}
            <div className="bg-blue-500 p-4 rounded-lg shadow-lg">
                <div className="grid grid-cols-7 gap-2">
                    {board.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            {row.map((cell, colIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200"
                                    onClick={() => handleColumnClick(colIndex)}
                                >
                                    {cell.value && (
                                        <div className={`w-14 h-14 rounded-full ${
                                            cell.value === 1 ? 'bg-red-500' : 'bg-yellow-500'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameBoard;