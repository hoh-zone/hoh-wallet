import './polyfills';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

// Initialize theme from localStorage
const savedSettings = localStorage.getItem('sui_wallet_settings');
if (savedSettings) {
  const settings = JSON.parse(savedSettings);
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </StrictMode>,
)
