"use client";

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/gameStore';
import { resetGame } from '@/app/store/gameStore';
import { useRouter } from 'next/navigation';

export default function Result() {
    const router = useRouter();
    const dispatch = useDispatch();
    const gameStatus = useSelector((state: RootState) => state.game.gameStatus);
    const currentPlayer = useSelector((state: RootState) => state.game.currentPlayer);
    const gameMode = useSelector((state: RootState) => state.game.gameMode);

    const handleRestart = () => {
        dispatch(resetGame());
        router.push('/game');
    };

    const handleHome = () => {
        dispatch(resetGame());
        router.push('/');
    };

    const getWinnerText = () => {
        if (gameStatus === 'won') {
            if (gameMode === 'cpu') {
                return currentPlayer === 'red' ? 'あなたの勝利！' : 'CPUの勝利！';
            }
            return currentPlayer === 'red' ? 'プレイヤー1の勝利！' : 'プレイヤー2の勝利！';
        }
        return '引き分け！';
    };

    return (
        <div className="mt-16 text-center">
            <h1 className="text-6xl font-bold mb-8 text-gray-800">ゲーム終了</h1>
            <p className="text-4xl mb-12 text-gray-600">{getWinnerText()}</p>
            <div className="space-x-4">
                <button
                    onClick={handleRestart}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
                >
                    再戦する
                </button>
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