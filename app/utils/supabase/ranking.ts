import { randomUUID } from 'crypto';
import { supabaseServerClient } from './server';

const extractYearAndMonth = (value?: string) => {
  const digits = (value ?? '').replace(/\D/g, '');

  if (digits.length >= 6) {
    return {
      year: digits.substring(0, 4),
      month: digits.substring(4, 6),
    };
  }

  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
  };
};

export const normalizeYearMonthValue = (value?: string): string | null => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 6) return null;
  const year = digits.substring(0, 4);
  const month = digits.substring(4, 6);
  const day = digits.length >= 8 ? digits.substring(6, 8) : '01';
  return `${year}${month}${day.padStart(2, '0')}`;
};

export const toDisplayYearMonth = (value: string): string => {
  const normalized = normalizeYearMonthValue(value);
  if (!normalized) return String(value);
  return `${normalized.substring(0, 4)}-${normalized.substring(4, 6)}`;
};

const buildYearMonthVariants = (year: string, month: string) => {
  const mm = month.padStart(2, '0');
  const m = String(Number(mm));

  return Array.from(
    new Set([
      `${year}${mm}01`,
      `${year}${mm}`,
      `${year}-${mm}-01`,
      `${year}-${m}-01`,
      `${year}-${mm}`,
      `${year}-${m}`,
    ]),
  );
};

export const getMonthContextFromInput = (value?: string) => {
  const { year, month } = extractYearAndMonth(value);
  const mm = month.padStart(2, '0');
  const display = `${year}-${mm}`;
  const canonical = `${year}${mm}01`;
  const variants = buildYearMonthVariants(year, mm);
  const canonicalVariants = Array.from(
    new Set(
      variants
        .map((variant) => normalizeYearMonthValue(variant))
        .filter((variant): variant is string => Boolean(variant))
        .concat(canonical)
    ),
  );

  return {
    display,
    canonical,
    variants,
    canonicalVariants,
  };
};

const getCurrentMonthContext = () => getMonthContextFromInput();

export const recordPlayerWin = async (playerName: string): Promise<void> => {
  try {
    const { display, canonical, canonicalVariants } = getCurrentMonthContext();

    console.log('recordPlayerWin invoked', { playerName, canonicalVariants });

    const { data: existingRanking, error: selectError } = await supabaseServerClient
      .from('rankings')
      .select('*')
      .eq('player_name', playerName)
      .in('year_month', canonicalVariants)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('ランキング検索エラー:', selectError);
      return;
    }

    if (existingRanking) {
      const currentWins = existingRanking.wins ?? 0;
      const { error: updateError } = await supabaseServerClient
        .from('rankings')
        .update({ wins: currentWins + 1, year_month: canonical })
        .eq('id', existingRanking.id);

      if (updateError) {
        console.error('ランキング更新エラー:', updateError);
      } else {
        console.log('ランキングを更新しました', {
          player_name: playerName,
          year_month: display,
          wins: currentWins + 1,
        });
      }

      return;
    }

    const { error: insertError } = await supabaseServerClient
      .from('rankings')
      .insert({
        id: randomUUID(),
        player_name: playerName,
        year_month: canonical,
        wins: 1,
      });

    if (insertError) {
      console.error('ランキング作成エラー:', insertError);
      return;
    }

    console.log('ランキングを新規作成しました', {
      player_name: playerName,
      year_month: display,
      wins: 1,
    });
  } catch (error) {
    console.error('ランキング更新でエラーが発生しました:', error);
  }
};

