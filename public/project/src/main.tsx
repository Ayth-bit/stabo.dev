// public/project/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ★★★ './App.tsx' から '.tsx' を削除 ★★★
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);