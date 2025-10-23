"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/auth-guard";
import { useState, useRef, useLayoutEffect, useEffect } from "react";

export default function ThemePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get("from") === "settings";

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const adjustingRef = useRef(false);

  const themes = [
    {
      id: "mental",
      title: "メンタル",
      subtitle: "自己理解",
      copy: "考えるより、感じるままで",
      description:
        "気づかないうちに、心が疲れていませんか。\nここでは誰にも言えない想いや迷いを、静かに受け止めてくれる相手がいます。\n考えを整理したい時も、ただ話を聞いてほしい時も大丈夫です。",
      cta: "整える",
      color: "green",
      ariaLabel: "メンタル・自己理解を選ぶ",
      videoPlaceholder: "/CoachingAI絵ロゴ.png",
    },
    {
      id: "love",
      title: "恋愛",
      subtitle: "人間関係",
      copy: "話すたびに、少しずつ近づいていく",
      description:
        '恋をしている時のドキドキも、誰かを想う切なさも。\nここでは、あなたの気持ちをまっすぐ受け止めてくれる"誰か"がいます。\n恋愛の相談も、ちょっとした甘い会話も、すべて自由に。',
      cta: "会いにいく",
      color: "pink",
      ariaLabel: "恋愛・人間関係を選ぶ",
      videoPlaceholder: "/CoachingAI絵ロゴ.png",
    },
    {
      id: "career",
      title: "キャリア",
      subtitle: "目標達成",
      copy: "言葉にすれば、未来が動く",
      description:
        "「このままでいいのかな」「もっと成長したい」\nどんな気持ちも、言葉にすることで自分の軸が見えてきます。\nここでは、目標に向かうあなたの考えを整理し、次の一歩を後押しします。",
      cta: "整理する",
      color: "blue",
      ariaLabel: "キャリア・目標達成を選ぶ",
      videoPlaceholder: "/CoachingAI絵ロゴ.png",
    },
  ];

  const getCenteredIndex = (el: HTMLDivElement) => {
    const w = el.clientWidth;
    const centered = el.scrollLeft + w / 2;
    const currentCardIndex = Math.floor(centered / w);
    return Math.max(0, Math.min(currentCardIndex, themes.length - 1));
  };

  const centerToIndex = (
    idx: number,
    opts: { behavior?: ScrollBehavior; adjust?: boolean } = {}
  ) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { behavior = "smooth", adjust = false } = opts;
    const w = el.clientWidth;
    const left = w * idx;

    if (adjust) {
      adjustingRef.current = true;
      const prev = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = left;
      requestAnimationFrame(() => {
        el.style.scrollBehavior = prev || "";
        adjustingRef.current = false;
      });
    } else {
      el.scrollTo({ left, behavior });
    }
  };

  const handleThemeSelect = (theme: string) => {
    const url = `/character-select?theme=${theme}${
      fromSettings ? "&from=settings" : ""
    }`;
    router.push(url);
  };

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    centerToIndex(0, { behavior: "auto", adjust: true });
    setCurrentIndex(0);
  }, []);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (adjustingRef.current) return;
    const el = e.currentTarget;
    const idx = getCenteredIndex(el);
    if (idx !== currentIndex) setCurrentIndex(idx);
  };

  useEffect(() => {
    const onResize = () => {
      centerToIndex(currentIndex, { behavior: "auto", adjust: true });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    centerToIndex(index, { behavior: "smooth" });
  };

  return (
    <AuthGuard>
      {/* ✅ 全体を縦中央＆横中央に配置、少し下に下げる */}
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 pt-16">
        <div className="container mx-auto px-4">
          {/* ヘッダー */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              テーマを選んでください
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              今のあなたに一番近い話題から始めましょう
            </p>
          </div>

          {/* スライド部分 */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onScroll={onScroll}
          >
            {themes.map((theme, index) => (
              <div
                key={`${theme.id}-${index}`}
                className="flex-shrink-0 w-full snap-center px-4"
                data-index={index}
              >
                {/* ▼ カード本体：min-h削除＆上詰め */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* 左側 */}
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 py-3 lg:py-4 px-4 lg:px-6 flex items-start justify-center">
                      <div className="w-full max-w-[560px] aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/5 bg-black/40 grid place-items-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                          <div className="w-0 h-0 border-l-[12px] border-l-gray-700 border-y-[8px] border-y-transparent ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* 右側 */}
                    <div className="py-3 lg:py-4 px-4 lg:px-6 flex flex-col justify-center">
                      <div className="text-center lg:text-left lg:ml-6">
                        <div className="mb-2">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {theme.title}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {theme.subtitle}
                          </p>
                        </div>

                        <p
                          className={`text-base font-medium mb-3 ${
                            theme.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : theme.color === "pink"
                              ? "text-pink-600 dark:text-pink-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {theme.copy}
                        </p>

                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-line">
                          {theme.description}
                        </p>

                        <div className="text-center lg:text-left">
                          <button
                            onClick={() => handleThemeSelect(theme.id)}
                            className={`w-full lg:w-auto px-6 py-2.5 font-medium rounded-lg transition-colors duration-200 ${
                              theme.color === "green"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : theme.color === "pink"
                                ? "bg-pink-500 hover:bg-pink-600 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                            aria-label={theme.ariaLabel}
                          >
                            {theme.cta}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ドット */}
          <div className="flex justify-center mt-2 space-x-2">
            {themes.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex
                    ? "bg-indigo-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`テーマ${index + 1}に移動`}
              />
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
