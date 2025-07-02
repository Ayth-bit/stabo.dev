// components/ThemeSwitcher.tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';

// Themeの型定義をここにも追加
type Theme = 'stabo-classic' | 'modern-chic' | 'y2k-web' | 'harajuku-pop';

const themes = [
  { id: 'stabo-classic', name: 'クラシック' },
  { id: 'modern-chic', name: 'モダン' },
  { id: 'y2k-web', name: 'Y2K' },
  { id: 'harajuku-pop', name: '原宿' },
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000, background: 'rgba(255,255,255,0.8)', padding: '5px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
      <label htmlFor="theme-select" style={{ fontSize: '12px', marginRight: '5px' }}>テーマ:</label>
      <select
        id="theme-select"
        value={theme}
        // ★ 'any' を 'Theme' に修正
        onChange={(e) => setTheme(e.target.value as Theme)}
        style={{ border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};