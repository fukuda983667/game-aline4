"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface RankingData {
    player_name: string;
    wins: number;
    year_month: string;
}

interface RankingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RankingModal({ isOpen, onClose }: RankingModalProps) {
    const [rankings, setRankings] = useState<RankingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);

    const fetchRankings = async (targetYearMonth?: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = targetYearMonth
                ? `/api/ranking/monthly?year_month=${targetYearMonth}`
                : `/api/ranking/monthly`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            // レスポンスがJSONかどうかチェック
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('非JSONレスポンス:', text);
                throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setRankings(data.rankings);
                setYearMonth(data.year_month);
            } else {
                setError(data.message || 'ランキングの取得に失敗しました');
            }
        } catch (err) {
            console.error('ランキング取得エラー:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('ネットワークエラーが発生しました');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableMonths = async () => {
        try {
            const response = await fetch(`/api/ranking/available-months`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAvailableMonths(data.available_months || []);
                }
            }
        } catch (err) {
            console.error('利用可能な月の取得エラー:', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRankings();
            fetchAvailableMonths();
        }
    }, [isOpen]);

    const handleYearMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMonth = e.target.value;
        setYearMonth(selectedMonth);
        fetchRankings(selectedMonth);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getRankedData = () => {
        if (rankings.length === 0) return [];

        // 勝数でソート
        const sortedRankings = [...rankings].sort((a, b) => b.wins - a.wins);

        // 同率順位を計算
        const rankedData = [];

        for (let i = 0; i < sortedRankings.length; i++) {
            const ranking = sortedRankings[i];
            let rank = i + 1;

            // 前のプレイヤーと同じ勝数の場合は同じ順位
            if (i > 0 && sortedRankings[i - 1].wins === ranking.wins) {
                // 前のプレイヤーの順位を取得
                const prevRank = rankedData[i - 1]?.rank || i;
                rank = prevRank;
            }

            rankedData.push({
                ...ranking,
                rank
            });
        }

        return rankedData;
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return (
                    <Image
                        src="/assets/images/game/icons/rank1.svg"
                        alt="1位"
                        width={32}
                        height={32}
                        className="w-12 h-12"
                    />
                );
            case 2:
                return (
                    <Image
                        src="/assets/images/game/icons/rank2.svg"
                        alt="2位"
                        width={32}
                        height={32}
                        className="w-12 h-12"
                    />
                );
            case 3:
                return (
                    <Image
                        src="/assets/images/game/icons/rank3.svg"
                        alt="3位"
                        width={32}
                        height={32}
                        className="w-12 h-12"
                    />
                );
            default:
                return (
                    <span className="text-2xl font-bold text-gray-700 w-8 h-8 flex items-center justify-center">
                        {rank}
                    </span>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center space-x-3">
                        <Image
                            src="/assets/images/game/icons/crown.svg"
                            alt="ranking"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        <span className="text-lg font-bold text-gray-800">Ranking</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4">
                    {/* 年月選択 */}
                    <div className="mb-4">
                        <select
                            id="yearMonth"
                            value={yearMonth}
                            onChange={handleYearMonthChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {availableMonths.length > 0 ? (
                                availableMonths.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))
                            ) : (
                                <option value={yearMonth}>{yearMonth}</option>
                            )}
                        </select>
                    </div>

                    {/* ランキング表示 */}
                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <div className="text-red-500 mb-4">エラーが発生しました</div>
                                <button
                                    onClick={() => fetchRankings()}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                >
                                    再試行
                                </button>
                            </div>
                        ) : rankings.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                データがありません
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {getRankedData().map((ranking, index) => (
                                    <div
                                        key={`${ranking.player_name}-${ranking.year_month}-${index}`}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            ranking.rank <= 3
                                                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200'
                                                : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center">
                                                {getRankIcon(ranking.rank)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {ranking.player_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-blue-600">
                                                {ranking.wins}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
