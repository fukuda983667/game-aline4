import { NextRequest, NextResponse } from 'next/server';

// 利用可能な月を取得
export async function GET(request: NextRequest) {
  try {
    // データベースがないため、サンプルデータを返す
    // 実際の実装では、データベースから利用可能な月を取得
    const currentMonth = new Date().toISOString().slice(0, 7);
    const availableMonths = [
      currentMonth,
      '2024-12',
      '2024-11',
      '2024-10',
      '2024-09',
      '2024-08',
      '2024-07',
      '2024-06',
      '2024-05',
      '2024-04',
      '2024-03',
      '2024-02',
      '2024-01'
    ];

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






