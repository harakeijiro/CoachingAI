import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用の Supabase クライアント
 * Server Actions や API Routes でのみ使用
 * 環境変数はクライアントに公開されません
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL and Anon Key must be defined in the environment variables"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
