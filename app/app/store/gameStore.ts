import { createSlice, configureStore } from '@reduxjs/toolkit';

export type GameMode = 'pvp' | 'cpu';
type Player = 'red' | 'yellow';
type Cell = Player | null;
type GameStatus = 'playing' | 'won' | 'draw';

interface AnimationState {
    isAnimating: boolean;
    animatingStone: {
        column: number;
        row: number;
        player: Player;
        startY: number;
        endY: number;
    } | null;
}

interface GameState {
    board: Cell[][];
    currentPlayer: Player;
    gameStatus: GameStatus;
    gameMode: GameMode;
    animation: AnimationState;
}

const initialState: GameState = {
    board: Array(7).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 'red',
    gameStatus: 'playing',
    gameMode: 'pvp',
    animation: {
        isAnimating: false,
        animatingStone: null
    }
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
        setAnimationState: (state, action: { payload: AnimationState }) => {
            state.animation = action.payload;
        },
        startStoneAnimation: (state, action: { payload: { column: number; row: number; player: Player; startY: number; endY: number } }) => {
            state.animation.isAnimating = true;
            state.animation.animatingStone = action.payload;
        },
        endStoneAnimation: (state) => {
            state.animation.isAnimating = false;
            state.animation.animatingStone = null;
        },
        resetGame: (state) => {
            state.board = Array(7).fill(null).map(() => Array(7).fill(null));
            state.currentPlayer = 'red';
            state.gameStatus = 'playing';
            state.animation = {
                isAnimating: false,
                animatingStone: null
            };
        }
    }
});

export const { setGameMode, setBoard, setCurrentPlayer, setGameStatus, setAnimationState, startStoneAnimation, endStoneAnimation, resetGame } = gameSlice.actions;

export const store = configureStore({
    reducer: {
        game: gameSlice.reducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;