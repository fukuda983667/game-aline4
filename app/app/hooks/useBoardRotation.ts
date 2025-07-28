import { useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import { useSelector } from 'react-redux';
import { setBoard, setCurrentPlayer, setGameStatus } from '../store/gameStore';
import { useGameLogic } from './useGameLogic';

export const useBoardRotation = () => {
    const dispatch = useDispatch();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const { checkWin, checkDraw } = useGameLogic();

    const rotateBoardLeft = () => {
        // 現在のボードを90度左回転
        const rotatedBoard = rotateMatrix90DegreesLeft(board);

        // 浮いている石を落下させる
        const settledBoard = settleStones(rotatedBoard);

        // Reduxストアを更新
        dispatch(setBoard(settledBoard));

        // 勝利判定
        if (checkWin(settledBoard, currentPlayer)) {
            dispatch(setGameStatus('won'));
        } else if (checkDraw(settledBoard)) {
            dispatch(setGameStatus('draw'));
        } else {
            // プレイヤーの一手として扱い、相手の手番に変更
            dispatch(setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red'));
        }
    };

    const rotateBoardRight = () => {
        // 現在のボードを90度右回転
        const rotatedBoard = rotateMatrix90DegreesRight(board);

        // 浮いている石を落下させる
        const settledBoard = settleStones(rotatedBoard);

        // Reduxストアを更新
        dispatch(setBoard(settledBoard));

        // 勝利判定
        if (checkWin(settledBoard, currentPlayer)) {
            dispatch(setGameStatus('won'));
        } else if (checkDraw(settledBoard)) {
            dispatch(setGameStatus('draw'));
        } else {
            // プレイヤーの一手として扱い、相手の手番に変更
            dispatch(setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red'));
        }
    };

    const rotateMatrix90DegreesRight = (matrix: (string | null)[][]) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(null));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }

        return rotated;
    };

    const rotateMatrix90DegreesLeft = (matrix: (string | null)[][]) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(null));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[cols - 1 - j][i] = matrix[i][j];
            }
        }

        return rotated;
    };

    const settleStones = (matrix: (string | null)[][]) => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const settled = matrix.map(row => [...row]);

        // 各列について、下から上に向かって石を落下させる
        for (let col = 0; col < cols; col++) {
            let bottomRow = rows - 1;

            // 下から上に向かって石を移動
            for (let row = rows - 1; row >= 0; row--) {
                if (settled[row][col] !== null) {
                    if (row !== bottomRow) {
                        settled[bottomRow][col] = settled[row][col];
                        settled[row][col] = null;
                    }
                    bottomRow--;
                }
            }
        }

        return settled;
    };

    return { rotateBoardLeft, rotateBoardRight };
};