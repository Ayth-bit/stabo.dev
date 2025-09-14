// app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_JP, Yuji_Syuku, Zen_Kaku_Gothic_New, DotGothic16, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Script from 'next/script'; // next/scriptをインポート


// --- フォント設定 ---
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

const yujiSyuku = Yuji_Syuku({
  subsets: ["latin"],
  variable: "--font-yuji-syuku",
  weight: "400",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  variable: "--font-zen-kaku-gothic-new",
  weight: "400",
});

const dotGothic = DotGothic16({
  subsets: ["latin"],
  variable: "--font-dot-gothic",
  weight: '400',
});

const mplusRounded = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  variable: '--font-m-plus-rounded',
  weight: '400',
});

// --- メタデータ定義 ---
export const metadata: Metadata = {
  title: 'stabo.dev',
  description: 'stabo.dev - your unique app experience "Stabo.world", change the world here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = "GTM-XXXXXXX"; // 取得したGTMコンテナIDに置き換えてください

  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/earlyaccess/nicomoji.css" rel="stylesheet" />
        {/* ★★★ Googleタグマネージャーのスクリプトを追加 ★★★ */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      </head>
      <body className={`${notoSansJp.variable} ${yujiSyuku.variable} ${zenKakuGothicNew.variable} ${dotGothic.variable} ${mplusRounded.variable} antialiased`}>
        {/* ★★★ Googleタグマネージャーの<noscript>タグを追加 ★★★ */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        <ThemeProvider>
          <ThemeSwitcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );