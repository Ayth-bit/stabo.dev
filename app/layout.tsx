// app/layout.tsx

import type { Metadata } from "next";
// ★ DotGothic16 をインポート
import { Noto_Sans_JP, Yuji_Syuku, Zen_Kaku_Gothic_New, DotGothic16 } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  weight: ["400", "700"],
  display: 'swap',
});

const yujiSyuku = Yuji_Syuku({
  subsets: ["latin"],
  variable: "--font-yuji-syuku",
  weight: "400",
  display: 'swap',
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  variable: "--font-zen-kaku-gothic-new",
  weight: ["400", "700"],
  display: 'swap',
});

// ★ DotGothic16 の設定を追加
const dotGothic = DotGothic16({
  subsets: ["latin"],
  variable: "--font-dot-gothic",
  weight: "400",
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
        className={`${notoSansJp.variable} ${yujiSyuku.variable} ${zenKakuGothicNew.variable} ${dotGothic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}