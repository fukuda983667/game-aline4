import { NextRequest, NextResponse } from 'next/server';

// ランキングデータの型定義
interface Ranking {
  player_name: string;
  wins: number;
  year_month: string;
}

// 月間ランキングを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearMonth = searchParams.get('year_month') || new Date().toISOString().slice(0, 7);

    // データベースがないため、サンプルデータを返す
    // 実際の実装では、データベースからランキングを取得
    const sampleRankings: Ranking[] = [
      { player_name: 'Player1', wins: 15, year_month: yearMonth },
      { player_name: 'Player2', wins: 12, year_month: yearMonth },
      { player_name: 'Player3', wins: 10, year_month: yearMonth },
      { player_name: 'Player4', wins: 8, year_month: yearMonth },
      { player_name: 'Player5', wins: 6, year_month: yearMonth },
    ];

    console.log('月間ランキングを取得しました', {
      year_month: yearMonth,
      rankings_count: sampleRankings.length
    });

    return NextResponse.json({
      success: true,
      rankings: sampleRankings,
      year_month: yearMonth
    });
  } catch (error) {
    console.error('ランキング取得でエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: 'ランキングの取得に失敗しました' },
      { status: 500 }
    );
  }
}






