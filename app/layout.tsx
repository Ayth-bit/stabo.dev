// app/layout.tsx

import type { Metadata } from "next";
// ★ Google Fontsから読み込みたいフォントをインポート
import { Noto_Sans_JP, Yuji_Syuku, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// ★ 各フォントの設定
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp", // CSS変数として定義
  weight: ["400", "700"], // 必要な太さを指定
  display: 'swap',
});

const yujiSyuku = Yuji_Syuku({
  subsets: ["latin"],
  variable: "--font-yuji-syuku", // 手書き風フォント
  weight: "400",
  display: 'swap',
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  variable: "--font-zen-kaku-gothic-new", // おしゃれなゴシック体
  weight: ["400", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'stabo.dev',
  description: 'stabo.dev - your unique app experience "Stabo.world", change the world here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ★ bodyのclassNameに新しいフォント変数を追加
    <html lang="ja">
      <body
        className={`${notoSansJp.variable} ${yujiSyuku.variable} ${zenKakuGothicNew.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}