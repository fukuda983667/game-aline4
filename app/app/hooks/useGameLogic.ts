import { useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';

export const useGameLogic = () => {
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);

    const checkWin = (board: (string | null)[][], player: string) => {
        // 横方向のチェック
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length - 3; col++) {
                if (
                    board[row][col] === player &&
                    board[row][col + 1] === player &&
                    board[row][col + 2] === player &&
                    board[row][col + 3] === player
                ) {
                    return true;
                }
            }
        }

        // 縦方向のチェック
        for (let col = 0; col < board[0].length; col++) {
            for (let row = 0; row < board.length - 3; row++) {
                if (
                    board[row][col] === player &&
                    board[row + 1][col] === player &&
                    board[row + 2][col] === player &&
                    board[row + 3][col] === player
                ) {
                    return true;
                }
            }
        }

        // 斜め方向（左上→右下）のチェック
        for (let row = 0; row < board.length - 3; row++) {
            for (let col = 0; col < board[row].length - 3; col++) {
                if (
                    board[row][col] === player &&
                    board[row + 1][col + 1] === player &&
                    board[row + 2][col + 2] === player &&
                    board[row + 3][col + 3] === player
                ) {
                    return true;
                }
            }
        }

        // 斜め方向（左下→右上）のチェック
        for (let row = 3; row < board.length; row++) {
            for (let col = 0; col < board[row].length - 3; col++) {
                if (
                    board[row][col] === player &&
                    board[row - 1][col + 1] === player &&
                    board[row - 2][col + 2] === player &&
                    board[row - 3][col + 3] === player
                ) {
                    return true;
                }
            }
        }

        return false;
    };

    const checkDraw = (board: (string | null)[][]) => {
        return board.every(row => row.every(cell => cell !== null));
    };

    return {
        checkWin,
        checkDraw
    };
};