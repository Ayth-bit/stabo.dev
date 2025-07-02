// app/contexts/ThemeContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// テーマの型定義
type Theme = 'stabo-classic' | 'modern-chic' | 'y2k-web' | 'harajuku-pop';

// Contextが提供する値の型定義
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Contextの作成
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Contextを提供するためのプロバイダーコンポーネント
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('stabo-classic'); // 初期テーマ

  // テーマが変更されたら、<html>タグの属性を更新し、ローカルストレージに保存
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // ページ読み込み時にローカルストレージからテーマを復元
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 他のコンポーネントからテーマ情報を使えるようにするカスタムフック
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};