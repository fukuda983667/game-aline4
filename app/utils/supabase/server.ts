
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase 環境変数が設定されていません。SUPABASE_URL（または NEXT_PUBLIC_SUPABASE_URL）と SUPABASE_SERVICE_ROLE_KEY または NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。");
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseKey);
