import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/utils/supabase/server';
import { getMonthContextFromInput, toDisplayYearMonth } from '@/utils/supabase/ranking';

// 利用可能な月を取得
export async function GET(request: NextRequest) {
  try {
    // Supabaseから利用可能な月を取得
    const { data: rankings, error } = await supabaseServerClient
      .from('rankings')
      .select('year_month')
      .order('year_month', { ascending: false });

    if (error) {
      console.error('Supabase利用可能な月取得エラー:', error);
      return NextResponse.json(
        { success: false, message: '利用可能な月の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 重複を除去して月のリストを作成（YYYYMMDD形式からYYYYMM形式に変換）
    const availableMonthsSet = new Set<string>();
    if (rankings) {
      rankings.forEach((ranking: any) => {
        if (ranking.year_month) {
          const formatted = toDisplayYearMonth(ranking.year_month);
          if (formatted) {
            availableMonthsSet.add(formatted);
          }
        }
      });
    }

    // 現在の月も含める
    const { display: currentDisplay } = getMonthContextFromInput();
    availableMonthsSet.add(currentDisplay);

    // ソートして配列に変換（YYYYMM形式で降順）
    const availableMonths = Array.from(availableMonthsSet).sort().reverse();

    console.log('利用可能な月を取得しました', {
      available_months: availableMonths
    });

    return NextResponse.json({
      success: true,
      available_months: availableMonths
    });
  } catch (error) {
    console.error('利用可能な月の取得でエラーが発生しました:', error);
    return NextResponse.json(
      { success: false, message: '利用可能な月の取得に失敗しました' },
      { status: 500 }
    );
  }
}






