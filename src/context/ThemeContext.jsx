'use client';
// ──────────────────────────────────────────────────────────────────────────────
// context/ThemeContext.jsx
// 앱 전체가 공유하는 라이트/다크 테마 컨텍스트. 원래 지출 탭 전용
// (src/expense/context/)이었다가 전역으로 확장되어 이 위치로 옮겨졌습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react';

const VALID_THEMES = ['light', 'dark'];

const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('et_theme');
    // 예전 "재팬" 테마 등 더 이상 지원하지 않는 값이 저장돼 있으면 기본값을 유지합니다.
    if (saved && VALID_THEMES.includes(saved)) setThemeState(saved);
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('et_theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
