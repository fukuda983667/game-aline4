// 共通のボード回転処理ユーティリティ

// ボードを回転する関数
export const rotateBoardMatrix = (board: (string | null)[][], direction: 'left' | 'right'): (string | null)[][] => {
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
};

// 石を落下させる関数（重力効果）
export const applyGravity = (board: (string | null)[][]): (string | null)[][] => {
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
};

// 回転と落下を組み合わせた処理
export const rotateAndSettleBoard = (board: (string | null)[][], direction: 'left' | 'right'): {
    rotatedBoard: (string | null)[][];
    settledBoard: (string | null)[][];
} => {
    const rotatedBoard = rotateBoardMatrix(board, direction);
    const settledBoard = applyGravity(rotatedBoard);

    return { rotatedBoard, settledBoard };
};
