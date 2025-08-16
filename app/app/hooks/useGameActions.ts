import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { setBoard, setCurrentPlayer, setGameStatus } from '../store/gameStore';
import { useGameLogic } from './useGameLogic';
import { useStoneAnimation } from './useStoneAnimation';

export const useGameActions = () => {
    const dispatch = useDispatch();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const { checkWin, checkDraw } = useGameLogic();
    const { animateStoneDrop } = useStoneAnimation();

    // 勝利判定の共通処理
    const checkGameResult = (finalBoard: (string | null)[][], player: string) => {
        // 現在のプレイヤーの勝利判定
        if (checkWin(finalBoard, player)) {
            dispatch(setGameStatus('won'));
            return;
        }

        // 相手の勝利判定
        const opponent = player === 'red' ? 'yellow' : 'red';
        if (checkWin(finalBoard, opponent)) {
            dispatch(setGameStatus('won'));
            dispatch(setCurrentPlayer(opponent));
            return;
        }

        // 引き分け判定
        if (checkDraw(finalBoard)) {
            dispatch(setGameStatus('draw'));
            return;
        }

        // 次の手番に変更
        dispatch(setCurrentPlayer(opponent));
    };

    const handleColumnClick = (columnIndex: number) => {
        if (gameStatus !== 'playing') return;

        const newBoard = board.map(row => [...row]);

        for (let row = newBoard.length - 1; row >= 0; row--) {
            if (newBoard[row][columnIndex] === null) {
                // アニメーション開始
                animateStoneDrop(columnIndex, row, currentPlayer);

                // アニメーション完了後に石を配置
                setTimeout(() => {
                    const finalBoard = newBoard.map(row => [...row]);
                    const newRow = [...finalBoard[row]];
                    newRow[columnIndex] = currentPlayer;
                    finalBoard[row] = newRow;

                    dispatch(setBoard(finalBoard));

                    // 共通の勝利判定処理を使用
                    checkGameResult(finalBoard, currentPlayer);
                }, 500); // アニメーション時間と同じ

                break;
            }
        }
    };

    return {
        handleColumnClick,
        checkGameResult // 他のファイルでも使用できるようにexport
    };
};