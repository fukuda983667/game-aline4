"use client";

import React from 'react';
import Header from './components/layouts/header/Header';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 pt-4 pb-20 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                    {children}
                </div>
            </main>
        </div>
    );
}