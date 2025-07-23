// components/ThemeSwitcher.tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';

type Theme = 'stabo-classic' | 'modern-chic' | 'y2k-web' | 'harajuku-pop';

const themes = [
  { id: 'stabo-classic', name: 'クラシック' },
  { id: 'modern-chic', name: 'モダン' },
  { id: 'y2k-web', name: 'Y2K' },
  { id: 'harajuku-pop', name: '原宿' },
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  // モダンテーマ用のスタイルを定義
  const switcherStyle: React.CSSProperties = {
    position: 'fixed',
    top: '80px',
    right: '10px',
    zIndex: 1000,
    background: theme === 'modern-chic' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255,255,255,0.8)',
    color: theme === 'modern-chic' ? '#fff' : '#000',
    padding: '5px',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    border: theme === 'modern-chic' ? '1px solid #555' : 'none',
  };

  const selectStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: theme === 'modern-chic' ? '#333' : '#fff',
    color: theme === 'modern-chic' ? '#fff' : '#000',
  };

  return (
    <div style={switcherStyle}>
      <label htmlFor="theme-select" style={{ fontSize: '12px', marginRight: '5px' }}>テーマ:</label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        style={selectStyle}
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