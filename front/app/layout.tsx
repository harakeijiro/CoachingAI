import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoachingAI",
  description: "あなた専用のAIコーチ",
  icons: {
    icon: [
      { url: "/CoachingAI絵ロゴ.png", sizes: "32x32", type: "image/png" },
      { url: "/CoachingAI絵ロゴ.png", sizes: "16x16", type: "image/png" },
      { url: "/CoachingAI絵ロゴ.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/CoachingAI絵ロゴ.png",
    apple: "/CoachingAI絵ロゴ.png",
  },
  manifest: "/manifest.json",
  other: {
    "msapplication-TileImage": "/CoachingAI絵ロゴ.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Next.jsのアイコン処理スクリプトエラーを無効化
              (function() {
                const originalAppendChild = Node.prototype.appendChild;
                Node.prototype.appendChild = function(child) {
                  if (child.tagName === 'LINK' && (child.rel === 'icon' || child.rel === 'apple-touch-icon')) {
                    return child; // 何もしない
                  }
                  return originalAppendChild.call(this, child);
                };
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
