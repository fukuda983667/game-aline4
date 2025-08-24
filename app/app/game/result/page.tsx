"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/gameStore';
import { resetGame } from '@/app/store/gameStore';
import { useRouter } from 'next/navigation';
import { useOnlineGameLogic } from '@/app/hooks/useOnlineGameLogic';

export default function Result() {
    const router = useRouter();
    const dispatch = useDispatch();
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameMode = useSelector((state: RootState) => state.game.gameMode);

    // オンライン対戦用のロジック
    const { onlineGame, leaveGame } = useOnlineGameLogic();

    // デバッグ用：オンライン対戦の状態を確認
    console.log('Result画面 - onlineGame状態:', onlineGame);
    console.log('Result画面 - gameMode:', gameMode);

    const handleRestart = () => {
        if (gameMode === 'online') {
            // オンライン対戦の場合はゲームを離れてホームに戻る
            leaveGame();
            router.push('/');
        } else {
            // 通常のゲームの場合は再戦
            dispatch(resetGame());
            router.push('/game');
        }
    };

    const handleHome = () => {
        if (gameMode === 'online') {
            // オンライン対戦の場合はゲームを離れる
            leaveGame();
        } else {
            // 通常のゲームの場合はリセット
            dispatch(resetGame());
        }
        router.push('/');
    };

    const getWinnerText = () => {
        if (gameMode === 'online') {
            // オンライン対戦の場合
            if (onlineGame.winner) {
                const winnerPlayer = Object.values(onlineGame.players).find((p: any) => p.color === onlineGame.winner);
                const myPlayer = Object.values(onlineGame.players).find((p: any) => p.id === onlineGame.myPlayerId);

                if (winnerPlayer && myPlayer) {
                    if (winnerPlayer.id === myPlayer.id) {
                        return 'あなたの勝利！';
                    } else {
                        return `${winnerPlayer.name}の勝利！`;
                    }
                }
                return 'ゲーム終了';
            }
            return '引き分け！';
        } else {
            // 通常のゲームの場合
            if (gameStatus === 'won') {
                if (gameMode === 'cpu') {
                    return currentPlayer === 'red' ? 'あなたの勝利！' : 'CPUの勝利！';
                }
                return currentPlayer === 'red' ? 'プレイヤー1の勝利！' : 'プレイヤー2の勝利！';
            }
            return '引き分け！';
        }
    };

    const getGameTitle = () => {
        return '対戦終了';
    };

    const getGameSummary = () => {
        if (gameMode === 'online' && onlineGame.players && onlineGame.myPlayerId) {
            const myPlayer = onlineGame.players[onlineGame.myPlayerId];
            const opponent = Object.values(onlineGame.players).find((p: any) => p.id !== onlineGame.myPlayerId);

            if (myPlayer && opponent) {
                return `${myPlayer.name} vs ${opponent.name}`;
            }
        }
        return null;
    };

    return (
        <div className="mt-16 text-center">
            <h1 className="text-6xl font-bold mb-8 text-gray-800">{getGameTitle()}</h1>
            {getGameSummary() && (
                <p className="text-2xl mb-4 text-gray-600">{getGameSummary()}</p>
            )}
            <p className="text-4xl mb-12 text-gray-600">{getWinnerText()}</p>
            <div className="space-x-4">
                {gameMode !== 'online' && (
                    <button
                        onClick={handleRestart}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
                    >
                        再戦する
                    </button>
                )}
                <button
                    onClick={handleHome}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
                >
                    ホームに戻る
                </button>
            </div>
        </div>
    );
}