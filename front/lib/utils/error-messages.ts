/**
 * Supabase エラーメッセージを日本語化
 */
export function translateAuthError(error: string): string {
  // よくあるSupabaseのエラーメッセージを日本語に変換
  const errorMap: Record<string, string> = {
    // 認証エラー
    "User already registered": "このメールアドレスは既に登録されています",
    "Invalid email": "メールアドレスの形式が正しくありません",
    "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません",
    "Email not confirmed": "メールアドレスが確認されていません",
    "Password should be at least 6 characters": "パスワードは6文字以上である必要があります",
    
    // レート制限
    "Email rate limit exceeded": "メール送信の制限を超えました。しばらく待ってから再度お試しください",
    "Too many requests": "リクエストが多すぎます。しばらく待ってから再度お試しください",
    
    // ネットワーク・サーバーエラー
    "Failed to fetch": "ネットワークエラーが発生しました。インターネット接続を確認してください",
    "Network request failed": "ネットワークエラーが発生しました",
    "Internal Server Error": "サーバーエラーが発生しました。しばらく待ってから再度お試しください",
    
    // データベースエラー
    "Could not find the table": "データベースの設定に問題があります。管理者に連絡してください",
    "Database error": "データベースエラーが発生しました",
    
    // その他
    "Invalid supabaseUrl": "設定エラーが発生しました。管理者に連絡してください",
    "User data is null": "ユーザー情報の取得に失敗しました",
  };

  // 完全一致を探す
  if (errorMap[error]) {
    return errorMap[error];
  }

  // 部分一致を探す
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  // マッピングにない場合は一般的なエラーメッセージを返す
  return "エラーが発生しました。もう一度お試しください";
}

/**
 * データベースエラーメッセージを日本語化
 */
export function translateDatabaseError(error: any): string {
  if (!error) return "データベースエラーが発生しました";

  const code = error.code || "";
  const message = error.message || "";

  // Postgresエラーコードに基づく変換
  const codeMap: Record<string, string> = {
    "23505": "既に登録されているデータです",
    "23503": "関連するデータが見つかりません",
    "42P01": "テーブルが見つかりません。データベースの設定を確認してください",
    "PGRST116": "指定された条件に一致するデータが見つかりませんでした",
    "PGRST204": "データがありません",
    "PGRST205": "テーブルが見つかりません。データベースの設定を確認してください",
  };

  if (codeMap[code]) {
    return codeMap[code];
  }

  // メッセージからの判断
  if (message.includes("duplicate key")) {
    return "既に登録されているデータです";
  }
  if (message.includes("violates foreign key")) {
    return "関連するデータが見つかりません";
  }
  if (message.includes("permission denied")) {
    return "この操作を実行する権限がありません";
  }
  if (message.includes("not found")) {
    return "データが見つかりませんでした";
  }

  return "データベースエラーが発生しました";
}
