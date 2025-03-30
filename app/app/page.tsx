"use client";

import React, { useState } from 'react';
import Header from './components/layouts/header/Header';
import GameBoard from './components/GameBoard';

export default function Home() {
    const [resetTrigger, setResetTrigger] = useState(0);

    const handleReset = () => {
        setResetTrigger(prev => prev + 1);
    };

    return (
        <main>
            <Header onReset={handleReset} />
            <GameBoard resetTrigger={resetTrigger} />
        </main>
    );
}
