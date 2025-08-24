import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/gameStore';
import {
    setMyPlayerInfo,
    updatePlayerName,
    startSearching,
    stopSearching,
    setGameState,
    updateBoard,
    setConnected,
    setError,
    clearError,
    resetGame,
    playerLeft
} from '../store/onlineGameStore';
import { createPusherInstance, subscribeToGame } from '../lib/pusher';

export const useOnlineGame = () => {
    const dispatch = useDispatch();
    const onlineGame = useSelector((state: RootState) => state.onlineGame);

    const initializePlayer = useCallback((name: string) => {
        const playerId = Math.random().toString(36).substr(2, 9);
        dispatch(setMyPlayerInfo({ id: playerId, name }));
        return playerId;
    }, [dispatch]);

    const startMatchmaking = useCallback(async () => {
        if (!onlineGame.myPlayerId || !onlineGame.myPlayerName) {
            dispatch(setError('プレイヤー情報が設定されていません'));
            return;
        }

        dispatch(startSearching());

        try {
            const response = await fetch('http://localhost:8000/api/game/find-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: onlineGame.myPlayerId,
                    player_name: onlineGame.myPlayerName
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.status === 'matched') {
                    // マッチング成功
                    dispatch(setGameState({
                        id: data.game.id,
                        players: data.game.players,
                        board: data.game.board,
                        currentPlayer: data.game.current_player,
                        status: data.game.status,
                        winner: data.game.winner
                    }));
                    return data.game.id;
                } else {
                    // 待機中
                    dispatch(setError('マッチング中です...'));
                }
            } else {
                dispatch(setError(data.message || 'エラーが発生しました'));
            }
        } catch (err) {
            dispatch(setError('サーバーとの接続に失敗しました'));
        }
    }, [dispatch, onlineGame.myPlayerId, onlineGame.myPlayerName]);

    const makeMove = useCallback(async (columnIndex: number) => {
        if (!onlineGame.id || !onlineGame.myPlayerId || onlineGame.status !== 'playing') {
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/game/make-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: onlineGame.id,
                    player_id: onlineGame.myPlayerId,
                    column: columnIndex
                })
            });

            const data = await response.json();

            if (data.success) {
                dispatch(updateBoard({
                    board: data.game.board,
                    currentPlayer: data.game.current_player,
                    status: data.game.status,
                    winner: data.game.winner
                }));
            } else {
                dispatch(setError(data.message || 'エラーが発生しました'));
            }
        } catch (err) {
            dispatch(setError('サーバーとの接続に失敗しました'));
        }
    }, [dispatch, onlineGame.id, onlineGame.myPlayerId, onlineGame.status]);

    const leaveGame = useCallback(async () => {
        if (onlineGame.id && onlineGame.myPlayerId) {
            try {
                await fetch('http://localhost:8000/api/game/leave', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        game_id: onlineGame.id,
                        player_id: onlineGame.myPlayerId
                    })
                });
            } catch (err) {
                console.error('ゲームを離れる際にエラーが発生しました');
            }
        }

        dispatch(resetGame());
    }, [dispatch, onlineGame.id, onlineGame.myPlayerId]);

    const initializePusher = useCallback((gameId: string) => {
        const pusherInstance = createPusherInstance();
        const gameChannel = subscribeToGame(pusherInstance, gameId);

        gameChannel.bind('game.start', (data: any) => {
            dispatch(setGameState({
                id: data.game.id,
                players: data.game.players,
                board: data.game.board,
                currentPlayer: data.game.current_player,
                status: data.game.status,
                winner: data.game.winner
            }));
        });

        gameChannel.bind('game.move', (data: any) => {
            dispatch(updateBoard({
                board: data.game.board,
                currentPlayer: data.game.current_player,
                status: data.game.status,
                winner: data.game.winner
            }));
        });

        gameChannel.bind('player.left', (data: any) => {
            dispatch(playerLeft());
        });

        dispatch(setConnected(true));
        return pusherInstance;
    }, [dispatch]);

    const getPlayerColor = useCallback(() => {
        if (!onlineGame.myPlayerId) return 'red';
        
        for (const player of Object.values(onlineGame.players)) {
            if (player.id === onlineGame.myPlayerId) {
                return player.color;
            }
        }
        return 'red';
    }, [onlineGame.myPlayerId, onlineGame.players]);

    const isMyTurn = useCallback(() => {
        return onlineGame.currentPlayer === getPlayerColor();
    }, [onlineGame.currentPlayer, getPlayerColor]);

    const getEmptyRow = useCallback((columnIndex: number): number => {
        for (let row = 6; row >= 0; row--) {
            if (onlineGame.board[row][columnIndex] === null) {
                return row;
            }
        }
        return -1;
    }, [onlineGame.board]);

    const handlePlayerNameUpdate = useCallback((name: string) => {
        dispatch(updatePlayerName(name));
    }, [dispatch]);

    return {
        onlineGame,
        initializePlayer,
        updatePlayerName: handlePlayerNameUpdate,
        startMatchmaking,
        makeMove,
        leaveGame,
        initializePusher,
        getPlayerColor,
        isMyTurn,
        getEmptyRow,
        clearError: () => dispatch(clearError()),
    };
};
