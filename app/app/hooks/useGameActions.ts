import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/gameStore';
import { setBoard, setCurrentPlayer, setGameStatus } from '../store/gameStore';
import { useGameLogic } from './useGameLogic';

export const useGameActions = () => {
    const dispatch = useDispatch();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const { checkWin, checkDraw } = useGameLogic();

    const handleColumnClick = (columnIndex: number) => {
        if (gameStatus !== 'playing') return;

        const newBoard = board.map(row => [...row]);

        for (let row = newBoard.length - 1; row >= 0; row--) {
            if (newBoard[row][columnIndex] === null) {
                const newRow = [...newBoard[row]];
                newRow[columnIndex] = currentPlayer;
                newBoard[row] = newRow;

                dispatch(setBoard(newBoard));

                if (checkWin(newBoard, currentPlayer)) {
                    dispatch(setGameStatus('won'));
                } else if (checkDraw(newBoard)) {
                    dispatch(setGameStatus('draw'));
                } else {
                    dispatch(setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red'));
                }
                break;
            }
        }
    };

    return {
        handleColumnClick
    };
};