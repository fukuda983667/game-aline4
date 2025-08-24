"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setGameMode } from '../store/gameStore';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameActions } from '../hooks/useGameActions';
import { useCpuLogic } from '../hooks/useCpuLogic';
import { useStoneAnimation } from '../hooks/useStoneAnimation';
import { useRotationAnimation } from '../hooks/useRotationAnimation';
import { useOnlineGameLogic } from '../hooks/useOnlineGameLogic';
import { createPusherInstance } from '../lib/pusher';
import { useRouter } from 'next/navigation';

export default function GamePage() {
    const router = useRouter();
    const board = useSelector((state: RootState) => state.game.board);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const gameMode = useSelector((state: RootState) => state.game.gameMode);
    const animation = useSelector((state: RootState) => state.game.animation);
    const dispatch = useDispatch();
    const { checkWin, checkDraw } = useGameLogic();
    const { handleColumnClick } = useGameActions();
    const { makeCpuMove } = useCpuLogic();
    const { animateStoneDrop, cleanup } = useStoneAnimation();
    const { animateRotation, cleanup: cleanupRotation } = useRotationAnimation();

    const [hoveredColumn, setHoveredColumn] = React.useState<number | null>(null);

    // オンライン対戦用のロジック
    const {
        onlineGame,
        initializePlayer,
        updatePlayerName,
        startMatchmaking,
        makeMove,
        leaveGame,
        initializePusher,
        getPlayerColor,
        isMyTurn,
        getEmptyRow: getOnlineEmptyRow,
        clearError,
        pusherRef
    } = useOnlineGameLogic();

    // ゲーム状態を設定する関数を取得
    const setGameState = useCallback((gameData: any) => {
        // Reduxストアにゲーム状態を設定
        dispatch({
            type: 'onlineGame/setGameState',
            payload: {
                id: gameData.id,
                players: gameData.players,
                board: gameData.board,
                currentPlayer: gameData.current_player,
                status: gameData.status,
                winner: gameData.winner
            }
        });
    }, [dispatch]);

    // オンライン対戦モードの状態
    const [showOnlineSetup, setShowOnlineSetup] = useState(false);

    useEffect(() => {
        if (gameStatus === 'won' || gameStatus === 'draw') {
            router.push('/game/result');
        }
    }, [gameStatus, router]);

    // オンライン対戦のゲーム終了時の遷移
    useEffect(() => {
        if (gameMode === 'online' && (onlineGame.status === 'won' || onlineGame.status === 'draw')) {
            console.log('オンライン対戦終了検知:', { status: onlineGame.status, winner: onlineGame.winner }); // デバッグ用
            router.push('/game/result');
        }
    }, [gameMode, onlineGame.status, router]);

    // オンライン対戦の初期化
    useEffect(() => {
        if (gameMode === 'online' && !onlineGame.myPlayerId) {
            initializePlayer('Player');
            setShowOnlineSetup(true);
        }
    }, [gameMode, onlineGame.myPlayerId, initializePlayer]);

    // 待機状態のWebSocket接続管理
    useEffect(() => {
        if (gameMode === 'online' && onlineGame.status === 'waiting' && !onlineGame.isConnected) {
            // 待機状態になった時にwaiting-playersチャンネルに接続
            const pusherInstance = createPusherInstance();
            const waitingChannel = pusherInstance.subscribe('waiting-players');

            waitingChannel.bind('game.start', (data: any) => {
                console.log('GameStartイベント受信 (待機チャンネル):', data); // デバッグ用
                // マッチング完了時の処理
                if (data.game && onlineGame.myPlayerId && data.game.players[onlineGame.myPlayerId]) {
                    console.log('このプレイヤーが参加するゲームが開始されました'); // デバッグ用

                    // ゲームの状態を完全に更新
                    setGameState(data.game);

                    // ゲームチャンネルに接続
                    pusherRef.current = initializePusher(data.game.id);
                    waitingChannel.unsubscribe();
                    pusherInstance.disconnect();

                    // セットアップ画面を非表示
                    setShowOnlineSetup(false);
                }
            });

            // クリーンアップ関数を修正 - 接続を維持
            return () => {
                // 待機状態の間は接続を維持
                if (onlineGame.status !== 'waiting') {
                    waitingChannel.unsubscribe();
                    pusherInstance.disconnect();
                }
            };
        }
    }, [gameMode, onlineGame.status, onlineGame.isConnected, onlineGame.myPlayerId, initializePusher, setGameState]);



    useEffect(() => {
        if (gameMode === 'cpu' && currentPlayer === 'yellow' && gameStatus === 'playing' && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones) {
            const timer = setTimeout(() => {
                makeCpuMove();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, gameMode, gameStatus, makeCpuMove, animation.isAnimating, animation.isRotating, animation.isDroppingStones]);

    // アニメーションのクリーンアップ
    useEffect(() => {
        return () => {
            cleanup();
            cleanupRotation();
        };
    }, [cleanup, cleanupRotation]);

    const getEmptyRow = (columnIndex: number): number => {
        for (let row = 6; row >= 0; row--) {
            if (board[row][columnIndex] === null) {
                return row;
            }
        }
        return -1;
    };

    const isAnimatingStone = (rowIndex: number, colIndex: number): boolean => {
        return animation.animatingStone !== null &&
                animation.animatingStone.row === rowIndex &&
                animation.animatingStone.column === colIndex;
    };

    const getStoneAnimationStyle = (rowIndex: number, colIndex: number) => {
        if (!isAnimatingStone(rowIndex, colIndex) || !animation.animatingStone) {
            return {};
        }

        // アニメーション中の石の位置を計算
        const currentY = animation.animatingStone.endY;

        return {
            transform: `translateY(${currentY}px)`,
            transition: 'none' // CSS transitionを無効にして、JavaScriptで制御
        };
    };

    // 落下アニメーション中の石の位置を計算
    const getDroppingStonePosition = (rowIndex: number, colIndex: number) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return null;
        }

        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (!droppingStone) {
            return null;
        }

        const progress = animation.dropProgress;
        // セルの高さ（64px）+ マージン（8px）= 72px
        const cellHeight = 64;
        const cellGap = 8;
        const totalCellHeight = cellHeight + cellGap;

        // 現在のセル位置を基準とした相対的な移動距離を計算
        const relativeStartY = (droppingStone.startRow - rowIndex) * totalCellHeight;
        const relativeEndY = (droppingStone.endRow - rowIndex) * totalCellHeight;
        const currentRelativeY = relativeStartY + (relativeEndY - relativeStartY) * progress;

        return {
            transform: `translateY(${currentRelativeY}px)`,
            transition: 'none'
        };
    };

    // 表示するボードを決定
    const displayBoard = animation.isDroppingStones && animation.settledBoard
        ? animation.settledBoard
        : board;

    // 落下アニメーション中に石を表示するかどうかを判定
    const shouldShowStone = (rowIndex: number, colIndex: number, cell: string | null) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return cell !== null;
        }

        // 落下アニメーション中は、回転後の盤面（rotatedBoard）を基準にする
        if (animation.rotatedBoard) {
            // 回転後の盤面で石がある場合は表示
            return animation.rotatedBoard[rowIndex][colIndex] !== null;
        }

        // 回転後の盤面がない場合は、落下中の石の開始位置を基準にする
        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (droppingStone) {
            return true; // 落下中の石を表示
        }

        // 落下後の盤面で石がある場合は表示
        return cell !== null;
    };

    const getStoneColor = (rowIndex: number, colIndex: number, cell: string | null) => {
        if (!animation.isDroppingStones || !animation.droppingStones) {
            return cell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
        }

        // 落下アニメーション中は、回転後の盤面（rotatedBoard）を基準にする
        if (animation.rotatedBoard) {
            const rotatedCell = animation.rotatedBoard[rowIndex][colIndex];
            if (rotatedCell !== null) {
                return rotatedCell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
            }
        }

        // 回転後の盤面がない場合は、落下中の石のplayerプロパティを使用
        const droppingStone = animation.droppingStones.find(
            stone => stone.startRow === rowIndex && stone.col === colIndex
        );

        if (droppingStone) {
            // 落下中の石は、droppingStoneのplayerプロパティを使用
            return droppingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500';
        }

        return cell === 'red' ? 'bg-red-500' : 'bg-yellow-500';
    };

    // オンライン対戦のセットアップ画面
    if (gameMode === 'online' && (showOnlineSetup || onlineGame.status === 'waiting')) {
        console.log('セットアップ画面表示:', { showOnlineSetup, status: onlineGame.status, id: onlineGame.id }); // デバッグ用
        return (
            <div className="container mx-auto py-8">
                <div className="flex flex-col items-center justify-center p-8">
                    <h1 className="text-4xl font-bold mb-8 text-gray-800">オンライン対戦</h1>

                    {onlineGame.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {onlineGame.error}
                            <button
                                onClick={clearError}
                                className="ml-2 text-red-700 hover:text-red-900"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                        <div className="mb-4">
                            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                                プレイヤー名
                            </label>
                            <input
                                type="text"
                                id="playerName"
                                value={onlineGame.myPlayerName}
                                onChange={(e) => updatePlayerName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="プレイヤー名を入力"
                                disabled={onlineGame.isSearching}
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={async () => {
                                    const gameId = await startMatchmaking();
                                    if (gameId) {
                                        pusherRef.current = initializePusher(gameId);
                                        setShowOnlineSetup(false);
                                    }
                                }}
                                disabled={onlineGame.isSearching || !onlineGame.myPlayerName.trim()}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                                {onlineGame.isSearching ? '検索中...' : '対戦相手を探す'}
                            </button>

                            <button
                                onClick={() => {
                                    dispatch(setGameMode('pvp'));
                                    setShowOnlineSetup(false);
                                }}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded transition-colors"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // 統一されたゲーム画面
    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col items-center justify-center p-8">
                {/* ゲームモードに応じたヘッダー */}
                <div className="mb-4 text-center">
                    {gameMode === 'online' && onlineGame.status === 'playing' && onlineGame.id && Object.keys(onlineGame.players).length > 0 ? (
                        <h2 className="text-2xl font-bold mb-2">
                            {(() => {
                                const playerEntries = Object.entries(onlineGame.players);
                                if (playerEntries.length >= 2) {
                                    const myPlayer = playerEntries.find(([id]) => id === onlineGame.myPlayerId);
                                    const opponent = playerEntries.find(([id]) => id !== onlineGame.myPlayerId);

                                    if (myPlayer && opponent) {
                                        const [, myPlayerData] = myPlayer;
                                        const [, opponentData] = opponent;
                                        return `${myPlayerData.name} VS ${opponentData.name}`;
                                    }
                                }
                                return 'オンライン対戦';
                            })()}
                        </h2>
                    ) : (
                        <h2 className="text-2xl font-bold mb-2">
                            {gameMode === 'cpu' ? 'CPU対戦' : 'オフライン対戦'}
                        </h2>
                    )}
                </div>



                {/* 回転ボタン（標準機能） */}
                <div className="flex items-center gap-24 mb-4">
                    <button
                        onClick={() => animateRotation('left')}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度左回転"
                        disabled={animation.isRotating || animation.isDroppingStones}
                    >
                        <img src="/assets/images/game/icons/left-rotation.png" alt="左回転" className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => animateRotation('right')}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title="ボードを90度右回転"
                        disabled={animation.isRotating || animation.isDroppingStones}
                    >
                        <img src="/assets/images/game/icons/right-rotation.png" alt="右回転" className="w-8 h-8" />
                    </button>
                </div>

                {/* ゲームボード */}
                <div className="relative" style={{
                    width: 'fit-content',
                    height: 'fit-content',
                    minWidth: '500px',
                    minHeight: '500px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div
                        className="grid grid-cols-7 gap-2 bg-blue-500 p-4 rounded-lg"
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            minWidth: '500px',
                            minHeight: '500px',
                            // 回転アニメーション中は回転を適用
                            transform: animation.isRotating ? `rotate(${animation.currentRotation}deg)` : 'rotate(0deg)',
                            transition: animation.isRotating ? 'transform 0.1s ease-out' : 'none',
                            transformOrigin: 'center center'
                        }}
                    >
                        {/* ゲームモードとアニメーション状態に応じてボードデータを選択 */}
                        {(gameMode === 'online' && onlineGame.status === 'playing' ?
                        (animation.isRotating && animation.rotationSnapshot ? animation.rotationSnapshot : onlineGame.board) :
                        (animation.isRotating && animation.rotationSnapshot ? animation.rotationSnapshot : displayBoard)).map((row, rowIndex) => (
                            row.map((cell, colIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="bg-white rounded-full relative cursor-pointer"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        minWidth: '64px',
                                        minHeight: '64px'
                                    }}
                                    onMouseEnter={() => {
                                        if (!animation.isRotating && !animation.isDroppingStones) {
                                            if (gameMode === 'online') {
                                                // オンライン対戦中は自分のターンの時のみホバー効果を有効
                                                if (isMyTurn()) {
                                                    setHoveredColumn(colIndex);
                                                }
                                            } else {
                                                // 通常のゲームモード
                                                setHoveredColumn(colIndex);
                                            }
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (!animation.isRotating && !animation.isDroppingStones) {
                                            setHoveredColumn(null);
                                        }
                                    }}
                                    onClick={() => {
                                        if (gameMode === 'online' && onlineGame.status === 'playing') {
                                            // オンライン対戦のクリック処理
                                            if (isMyTurn()) {
                                                // 石の落下アニメーションを開始
                                                const emptyRow = getOnlineEmptyRow(colIndex);
                                                if (emptyRow !== -1) {
                                                    // アニメーション完了後にmakeMoveを実行
                                                    animateStoneDrop(colIndex, emptyRow, getPlayerColor()).then(() => {
                                                        // オンラインの手を実行
                                                        makeMove(colIndex);
                                                    });
                                                }
                                            }
                                        } else if ((gameMode === 'pvp' || currentPlayer === 'red') && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones) {
                                            // 通常のゲームのクリック処理
                                            handleColumnClick(colIndex);
                                        }
                                    }}
                                >
                                    {/* 石の表示 */}
                                    {shouldShowStone(rowIndex, colIndex, cell) && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${getStoneColor(rowIndex, colIndex, cell)} absolute top-1 left-1`}
                                            style={{
                                                ...getDroppingStonePosition(rowIndex, colIndex),
                                                zIndex: 10
                                            }}
                                        />
                                    )}

                                    {/* アニメーション中の石 */}
                                    {isAnimatingStone(rowIndex, colIndex) && animation.animatingStone && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${animation.animatingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`}
                                            style={{
                                                ...getStoneAnimationStyle(rowIndex, colIndex),
                                                zIndex: 10
                                            }}
                                        />
                                    )}

                                    {/* オンライン対戦中の落下アニメーション中の石 */}
                                    {gameMode === 'online' && onlineGame.status === 'playing' && isAnimatingStone(rowIndex, colIndex) && animation.animatingStone && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${animation.animatingStone.player === 'red' ? 'bg-red-500' : 'bg-yellow-500'} absolute top-1 left-1`}
                                            style={{
                                                ...getStoneAnimationStyle(rowIndex, colIndex),
                                                zIndex: 10
                                            }}
                                        />
                                    )}

                                    {/* ホバー時のプレビュー（オンライン対戦以外） */}
                                    {gameMode !== 'online' && hoveredColumn === colIndex && getEmptyRow(colIndex) === rowIndex && !animation.isAnimating && !animation.isRotating && !animation.isDroppingStones && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${currentPlayer === 'red' ? 'bg-red-500/30' : 'bg-yellow-500/30'} border-2 border-dashed ${currentPlayer === 'red' ? 'border-red-500' : 'border-yellow-500'} absolute top-1 left-1`}
                                            style={{ zIndex: 10 }}
                                        />
                                    )}

                                    {/* オンライン対戦のプレビュー */}
                                    {gameMode === 'online' && onlineGame.status === 'playing' && getOnlineEmptyRow(colIndex) === rowIndex && isMyTurn() && hoveredColumn === colIndex && (
                                        <div
                                            className={`w-14 h-14 rounded-full ${getPlayerColor() === 'red' ? 'bg-red-500/30' : 'bg-yellow-500/30'} border-2 border-dashed ${getPlayerColor() === 'red' ? 'border-red-500' : 'border-yellow-500'} absolute top-1 left-1`}
                                            style={{ zIndex: 10 }}
                                        />
                                    )}
                                </div>
                            ))
                        ))}
                    </div>
                </div>

                {/* ゲームモードに応じたターン表示 */}
                <div className="mt-4 text-xl font-bold">
                    {gameMode === 'online' && onlineGame.status === 'playing' ? (
                        isMyTurn() ? 'あなたのターン' : '相手のターン'
                    ) : gameMode === 'cpu' ? (
                        currentPlayer === 'red' ? 'あなたのターン' : 'CPUのターン'
                    ) : (
                        currentPlayer === 'red' ? 'プレイヤー1のターン' : 'プレイヤー2のターン'
                    )}
                </div>
            </div>
        </div>
    );
}