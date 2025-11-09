"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import RankingModal from '../../RankingModal';

export default function Header() {
    const pathname = usePathname();
    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

    return (
        <header className="bg-white shadow">
            <nav className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-gray-800">
                        Conect4-R
                    </Link>
                    <div className="flex space-x-8">
                        <Link
                            href="/"
                            className="w-12 h-12 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                        >
                            <Image
                                src="/assets/images/game/icons/home.svg"
                                alt="ホーム"
                                width={30}
                                height={30}
                                className="w-10 h-10"
                            />
                        </Link>
                        <button
                            onClick={() => setIsRankingModalOpen(true)}
                            className="w-12 h-12 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                        >
                            <Image
                                src="/assets/images/game/icons/crown.svg"
                                alt="ランキング"
                                width={30}
                                height={30}
                                className="w-8 h-8"
                            />
                        </button>
                    </div>
                </div>
            </nav>
            <RankingModal
                isOpen={isRankingModalOpen}
                onClose={() => setIsRankingModalOpen(false)}
            />
        </header>
    );
}