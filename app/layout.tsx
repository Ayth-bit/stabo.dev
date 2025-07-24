// app/layout.tsx
import type { Metadata } from 'next';
import {
  DotGothic16,
  M_PLUS_Rounded_1c,
  Noto_Sans_JP,
  Yuji_Syuku,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import LocationGuard from '@/components/LocationGuard';
import { Navigation } from '@/components/Navigation';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ThemeProvider } from '@/contexts/ThemeContext';

// --- フォント設定 ---
const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
});

const yujiSyuku = Yuji_Syuku({
  subsets: ['latin'],
  variable: '--font-yuji-syuku',
  weight: '400',
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  variable: '--font-zen-kaku-gothic-new',
  weight: '400',
});

const dotGothic = DotGothic16({
  subsets: ['latin'],
  variable: '--font-dot-gothic',
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
  return (
    <html lang="ja">
      {/* ★★★ headタグにニコモジフォントのリンクを追加 ★★★ */}
      <head>
        <link href="https://fonts.googleapis.com/earlyaccess/nicomoji.css" rel="stylesheet" />
      </head>
      <body
        className={`${notoSansJp.variable} ${yujiSyuku.variable} ${zenKakuGothicNew.variable} ${dotGothic.variable} ${mplusRounded.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <LocationGuard>
              <Navigation />
              <ThemeSwitcher />
              {children}
            </LocationGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
