"use client";

import { useEffect } from "react";

/**
 * メール確認コールバック
 * メール確認リンククリック後、トップページにリダイレクト（ログインが必要）
 */
export default function AuthCallbackEmail() {
  useEffect(() => {
    // メール確認後は直接トップページへリダイレクト
    // ユーザーはパスワードでログインする必要がある
    window.location.replace("/");
  }, []);

  return null;
}
