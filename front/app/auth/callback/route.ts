import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/decision";

  console.log("Auth callback: Processing code:", code ? "present" : "missing");

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log("Auth callback: Exchange result:", { 
      user: data.user?.id, 
      error: error?.message 
    });
    
    if (!error && data.user) {
      console.log("Auth callback: Success, redirecting to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback: Exchange failed:", error);
    }
  }

  // エラー時はサインインページにリダイレクト
  console.log("Auth callback: Redirecting to auth page due to error");
  return NextResponse.redirect(`${origin}/auth?error=認証に失敗しました`);
}
