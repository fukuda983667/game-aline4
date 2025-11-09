import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/utils/supabase/server';
import { getMonthContextFromInput, normalizeYearMonthValue, toDisplayYearMonth } from '@/utils/supabase/ranking';

// 月間ランキングを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // リクエストのyear_month（YYYYMM形式）を取得、なければ現在の月
    const yearMonthInput = searchParams.get('year_month') || new Date().toISOString().slice(0, 7).replace('-', '');

    const { data: rankings, error } = await supabaseServerClient
      .from('rankings')
      .select('*');

    if (error) {
      console.error('Supabaseランキング取得エラー:', error);
      console.error('エラー詳細:', JSON.stringify(error, null, 2));
      console.error('検索条件:', { yearMonthInput });
      return NextResponse.json(
        {
          success: false,
          message: 'ランキングの取得に失敗しました',
          error: error.message || String(error),
          details: error
        },
        { status: 500 }
      );
    }

    const { display, canonicalVariants } = getMonthContextFromInput(yearMonthInput);

    const filteredRankings = (rankings || []).filter((ranking: any) => {
      const normalized = normalizeYearMonthValue(ranking.year_month);
      if (!normalized) return false;
      return canonicalVariants.includes(normalized);
    });

    filteredRankings.sort((a: any, b: any) => {
      const winDiff = (b.wins ?? 0) - (a.wins ?? 0);
      if (winDiff !== 0) return winDiff;
      return (a.player_name ?? '').localeCompare(b.player_name ?? '');
    });

    const rankingsForResponse = filteredRankings.map((ranking: any) => ({
      ...ranking,
      year_month: toDisplayYearMonth(ranking.year_month)
    }));

    console.log('月間ランキングを取得しました', {
      year_month: display,
      rankings_count: rankingsForResponse.length
    });

    return NextResponse.json({
      success: true,
      rankings: rankingsForResponse,
      year_month: display
    });
  } catch (error) {
    console.error('ランキング取得でエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: 'ランキングの取得に失敗しました' },
      { status: 500 }
    );
  }
}






