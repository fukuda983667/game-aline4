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

    const handleColumnClick = (columnIndex: number) => {
        if (gameStatus !== 'playing') return;

        const newBoard = board.map(row => [...row]);

        for (let row = newBoard.length - 1; row >= 0; row--) {
            if (newBoard[row][columnIndex] === null) {
                // アニメーション開始
                animateStoneDrop(columnIndex, row, currentPlayer);

                // アニメーション完了後に石を配置
                setTimeout(() => {
                    const finalBoard = board.map(row => [...row]);
                    const newRow = [...finalBoard[row]];
                    newRow[columnIndex] = currentPlayer;
                    finalBoard[row] = newRow;

                    dispatch(setBoard(finalBoard));

                    if (checkWin(finalBoard, currentPlayer)) {
                        dispatch(setGameStatus('won'));
                    } else if (checkDraw(finalBoard)) {
                        dispatch(setGameStatus('draw'));
                    } else {
                        dispatch(setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red'));
                    }
                }, 500); // アニメーション時間と同じ

                break;
            }
        }
    };

    return {
        handleColumnClick
    };
};