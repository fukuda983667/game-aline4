import { createSlice, configureStore } from '@reduxjs/toolkit';
import onlineGameReducer from './onlineGameStore';

export type GameMode = 'pvp' | 'cpu' | 'online';
type Player = 'red' | 'yellow';
type Cell = Player | null;
type GameStatus = 'playing' | 'won' | 'draw';

interface StonePosition {
    row: number;
    col: number;
    player: string;
    startRow: number;
    endRow: number;
}

interface AnimationState {
    isAnimating: boolean;
    animatingStone: {
        column: number;
        row: number;
        player: Player;
        startY: number;
        endY: number;
    } | null;
    isRotating: boolean;
    rotationSnapshot: Cell[][] | null;
    rotationDirection: 'left' | 'right' | null;
    currentRotation: number;
    isDroppingStones: boolean;
    droppingStones: StonePosition[] | null;
    rotatedBoard: Cell[][] | null; // 回転後の盤面（落下前）
    settledBoard: Cell[][] | null;
    dropProgress: number;
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
        animatingStone: null,
        isRotating: false,
        rotationSnapshot: null,
        rotationDirection: null,
        currentRotation: 0,
        isDroppingStones: false,
        droppingStones: null,
        rotatedBoard: null,
        settledBoard: null,
        dropProgress: 0
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
        startRotationAnimation: (state, action: { payload: { direction: 'left' | 'right'; snapshot: Cell[][]; currentRotation?: number } }) => {
            state.animation.isRotating = true;
            state.animation.rotationSnapshot = action.payload.snapshot;
            state.animation.rotationDirection = action.payload.direction;
            state.animation.currentRotation = action.payload.currentRotation || 0;
        },
        endRotationAnimation: (state) => {
            state.animation.isRotating = false;
            state.animation.rotationSnapshot = null;
            state.animation.rotationDirection = null;
            state.animation.currentRotation = 0;
        },
        startStoneDropAnimation: (state, action: { payload: { floatingStones: StonePosition[]; rotatedBoard: Cell[][]; settledBoard: Cell[][]; progress?: number } }) => {
            state.animation.isDroppingStones = true;
            state.animation.droppingStones = action.payload.floatingStones;
            state.animation.rotatedBoard = action.payload.rotatedBoard;
            state.animation.settledBoard = action.payload.settledBoard;
            state.animation.dropProgress = action.payload.progress || 0;
        },
        endStoneDropAnimation: (state) => {
            state.animation.isDroppingStones = false;
            state.animation.droppingStones = null;
            state.animation.rotatedBoard = null;
            state.animation.settledBoard = null;
            state.animation.dropProgress = 0;
        },
        resetGame: (state) => {
            state.board = Array(7).fill(null).map(() => Array(7).fill(null));
            state.currentPlayer = 'red';
            state.gameStatus = 'playing';
            state.animation = {
                isAnimating: false,
                animatingStone: null,
                isRotating: false,
                rotationSnapshot: null,
                rotationDirection: null,
                currentRotation: 0,
                isDroppingStones: false,
                droppingStones: null,
                rotatedBoard: null,
                settledBoard: null,
                dropProgress: 0
            };
        }
    }
});

export const { setGameMode, setBoard, setCurrentPlayer, setGameStatus, setAnimationState, startStoneAnimation, endStoneAnimation, startRotationAnimation, endRotationAnimation, startStoneDropAnimation, endStoneDropAnimation, resetGame } = gameSlice.actions;

export const store = configureStore({
    reducer: {
        game: gameSlice.reducer,
        onlineGame: onlineGameReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;