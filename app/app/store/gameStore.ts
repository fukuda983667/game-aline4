import { createSlice, configureStore } from '@reduxjs/toolkit';

export type GameMode = 'pvp' | 'cpu';
type Player = 'red' | 'yellow';
type Cell = Player | null;
type GameStatus = 'playing' | 'won' | 'draw';

interface GameState {
    board: Cell[][];
    currentPlayer: Player;
    gameStatus: GameStatus;
    gameMode: GameMode;
}

const initialState: GameState = {
    board: Array(7).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 'red',
    gameStatus: 'playing',
    gameMode: 'pvp'
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameMode: (state, action: { payload: GameMode }) => {
            state.gameMode = action.payload;
        },
        setBoard: (state, action) => {
            state.board = action.payload;
        },
        setCurrentPlayer: (state, action) => {
            state.currentPlayer = action.payload;
        },
        setGameStatus: (state, action) => {
            state.gameStatus = action.payload;
        },
        resetGame: (state) => {
            state.board = Array(7).fill(null).map(() => Array(7).fill(null));
            state.currentPlayer = 'red';
            state.gameStatus = 'playing';
        }
    }
});

export const { setGameMode, setBoard, setCurrentPlayer, setGameStatus, resetGame } = gameSlice.actions;

export const store = configureStore({
    reducer: {
        game: gameSlice.reducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;