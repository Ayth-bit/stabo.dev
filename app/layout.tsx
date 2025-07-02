// app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_JP, Yuji_Syuku, Zen_Kaku_Gothic_New, DotGothic16, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";



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

const mplusRounded = M_PLUS_Rounded_1c({ 
  subsets: ['latin'],
  variable: '--font-m-plus-rounded', 
  weight: ['400', '700'], 
  display: 'swap' ,
});


export const metadata: Metadata = {
  title: 'Stabo',
  description: 'stabo.dev - your unique app experience "Stabo.world", change the world here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} ${yujiSyuku.variable} ${zenKakuGothicNew.variable} ${dotGothic.variable} ${mplusRounded.variable}`}>
        <ThemeProvider>
          <ThemeSwitcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}