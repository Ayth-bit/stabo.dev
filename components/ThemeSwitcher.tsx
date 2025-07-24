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

  return (
    <div className="fixed top-20 right-3 z-[1000] card p-2 shadow-lg">
      <label htmlFor="theme-select" className="text-sm text-secondary mr-2">
        テーマ:
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-primary focus:outline-none focus:border-accent"
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
