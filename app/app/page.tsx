"use client";

import React from 'react';
import { useDispatch } from 'react-redux';
import { resetGame } from './store/gameStore';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const dispatch = useDispatch();

    const handleStart = () => {
        dispatch(resetGame());
        router.push('/game');
    };

    return (
        <div className="text-center">
            <h1 className="text-6xl font-bold mb-8 text-gray-800">Aline4</h1>
            <p className="text-xl mb-12 text-gray-600">4つの石を並べて勝利を目指せ！</p>
            <button
                onClick={handleStart}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
            >
                ゲームスタート
            </button>
        </div>
    );
}