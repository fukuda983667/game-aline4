import React from 'react'
import Link from 'next/link'

interface HeaderProps {
    onReset: () => void;
}

function Header({ onReset }: HeaderProps) {
    return (
        <header className="bg-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <Link
                    href="/"
                    className="text-3xl font-bold text-white hover:text-gray-300 transition-colors"
                    onClick={onReset}
                >
                    Aline4
                </Link>
            </div>
        </header>
    )
}

export default Header