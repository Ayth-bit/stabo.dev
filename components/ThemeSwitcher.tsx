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
    <div className="fixed top-20 right-4 z-[1000] bg-white rounded-xl p-3 shadow-lg" style={{boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)'}}>
      <div className="flex items-center gap-3">
        <label htmlFor="theme-select" className="text-sm text-gray-600 font-medium">
          テーマ
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-opacity-50 min-w-[80px]"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
