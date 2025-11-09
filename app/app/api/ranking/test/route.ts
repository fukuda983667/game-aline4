import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/utils/supabase/server';

// Supabaseのrankingsテーブルから全データを取得（テスト用）
export async function GET(request: NextRequest) {
  try {
    // 全データを取得
    console.log('Supabase接続テスト開始');
    console.log('環境変数:', {
      SUPABASE_URL: (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) ? '設定済み' : '未設定',
      SUPABASE_ANON_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? '設定済み' : '未設定'
    });
    
    const { data: rankings, error } = await supabaseServerClient
      .from('rankings')
      .select('*')
      .order('year_month', { ascending: false });
    
    console.log('Supabaseクエリ結果:', { 
      data_count: rankings?.length || 0, 
      error: error ? JSON.stringify(error) : null 
    });

    if (error) {
      console.error('Supabaseランキング取得エラー:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'ランキングの取得に失敗しました',
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    console.log('テスト: 全ランキングデータを取得しました', {
      rankings_count: rankings?.length || 0,
      rankings: rankings
    });

    return NextResponse.json({
      success: true,
      count: rankings?.length || 0,
      rankings: rankings || [],
      message: 'テスト成功: データを取得できました'
    });
  } catch (error) {
    console.error('テストでエラーが発生しました:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'エラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
