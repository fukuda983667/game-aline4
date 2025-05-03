import { useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useGameActions } from './useGameActions';

export function useCpuLogic() {
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { handleColumnClick } = useGameActions();

    // 空いている列を取得
    const getAvailableColumns = (): number[] => {
        return board[0]
            .map((_, colIndex) => colIndex)
            .filter(colIndex => board[0][colIndex] === null);
    };

    // 列の空いている最下段を取得
    const getEmptyRow = (board: (string | null)[][], columnIndex: number): number => {
        for (let row = 6; row >= 0; row--) {
            if (board[row][columnIndex] === null) {
                return row;
            }
        }
        return -1;
    };

    // 4つ並びを探す
    const findFourInARow = (player: 'red' | 'yellow'): number | null => {
        const availableColumns = getAvailableColumns();

        for (const col of availableColumns) {
            // ボードのディープコピーを作成
            const boardCopy = board.map(row => [...row]);
            const row = getEmptyRow(boardCopy, col);
            if (row === -1) continue;

            // 仮想的に石を置く
            boardCopy[row][col] = player;

            // 水平方向のチェック
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 4; c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r][c + 1] === player &&
                        boardCopy[r][c + 2] === player &&
                        boardCopy[r][c + 3] === player
                    ) {
                        return col;
                    }
                }
            }

            // 垂直方向のチェック
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 7; c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r + 1][c] === player &&
                        boardCopy[r + 2][c] === player &&
                        boardCopy[r + 3][c] === player
                    ) {
                        return col;
                    }
                }
            }

            // 斜め方向のチェック
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r + 1][c + 1] === player &&
                        boardCopy[r + 2][c + 2] === player &&
                        boardCopy[r + 3][c + 3] === player
                    ) {
                        return col;
                    }
                }
            }

            for (let r = 3; r < 7; r++) {
                for (let c = 0; c < 4; c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r - 1][c + 1] === player &&
                        boardCopy[r - 2][c + 2] === player &&
                        boardCopy[r - 3][c + 3] === player
                    ) {
                        return col;
                    }
                }
            }
        }
        return null;
    };

    // 3つ並びを探す
    const findThreeInARow = (player: 'red' | 'yellow'): number | null => {
        const availableColumns = getAvailableColumns();

        for (const col of availableColumns) {
            // ボードのディープコピーを作成
            const boardCopy = board.map(row => [...row]);
            const row = getEmptyRow(boardCopy, col);
            if (row === -1) continue;

            // 仮想的に石を置く
            boardCopy[row][col] = player;

            // 水平方向のチェック（左から右）
            for (let c = Math.max(0, col - 3); c <= Math.min(3, col); c++) {
                if (
                    boardCopy[row][c] === player &&
                    boardCopy[row][c + 1] === player &&
                    boardCopy[row][c + 2] === player &&
                    boardCopy[row][c + 3] === null
                ) {
                    return col;
                }
            }

            // 水平方向のチェック（右から左）
            for (let c = Math.max(3, col); c <= Math.min(6, col + 3); c++) {
                if (
                    boardCopy[row][c] === player &&
                    boardCopy[row][c - 1] === player &&
                    boardCopy[row][c - 2] === player &&
                    boardCopy[row][c - 3] === null
                ) {
                    return col;
                }
            }

            // 垂直方向のチェック（下から上）
            if (row >= 3) {
                if (
                    boardCopy[row - 1][col] === player &&
                    boardCopy[row - 2][col] === player &&
                    boardCopy[row - 3][col] === player
                ) {
                    return col;
                }
            }

            // 斜め方向のチェック（右下がり）
            for (let r = Math.max(3, row); r <= Math.min(6, row + 3); r++) {
                for (let c = Math.max(3, col); c <= Math.min(6, col + 3); c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r - 1][c - 1] === player &&
                        boardCopy[r - 2][c - 2] === player &&
                        boardCopy[r - 3][c - 3] === null
                    ) {
                        return col;
                    }
                }
            }

            // 斜め方向のチェック（右上がり）
            for (let r = Math.max(3, row); r <= Math.min(6, row + 3); r++) {
                for (let c = Math.max(0, col - 3); c <= Math.min(3, col); c++) {
                    if (
                        boardCopy[r][c] === player &&
                        boardCopy[r - 1][c + 1] === player &&
                        boardCopy[r - 2][c + 2] === player &&
                        boardCopy[r - 3][c + 3] === null
                    ) {
                        return col;
                    }
                }
            }
        }
        return null;
    };

    // CPUの手を決定
    const makeCpuMove = () => {
        // 1. 4つ並びで勝利できる手があるかチェック
        const fourWinningMove = findFourInARow(currentPlayer);
        if (fourWinningMove !== null) {
            handleColumnClick(fourWinningMove);
            return;
        }

        // 2. 相手の4つ並びを防ぐ手をチェック
        const opponent = currentPlayer === 'red' ? 'yellow' : 'red';
        const fourBlockingMove = findFourInARow(opponent);
        if (fourBlockingMove !== null) {
            handleColumnClick(fourBlockingMove);
            return;
        }

        // 4. 相手の3つ並びを防ぐ手をチェック
        const threeBlockingMove = findThreeInARow(opponent);
        if (threeBlockingMove !== null) {
            console.log('防ぐ三つ並び')
            handleColumnClick(threeBlockingMove);
            return;
        }

        // 3. 3つ並びで有利な手があるかチェック
        const threeWinningMove = findThreeInARow(currentPlayer);
        if (threeWinningMove !== null) {
            handleColumnClick(threeWinningMove);
            return;
        }

        // 5. 中央列を優先（下から4段目まで）
        const availableColumns = getAvailableColumns();
        if (availableColumns.includes(3)) {
            const row = getEmptyRow(board, 3);
            if (row >= 3) {
                handleColumnClick(3);
                return;
            }
        }

        // 6. ランダムな手を選択
        const randomIndex = Math.floor(Math.random() * availableColumns.length);
        handleColumnClick(availableColumns[randomIndex]);
    };

    return {
        makeCpuMove
    };
}