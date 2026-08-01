import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Add skip link for accessibility
if (typeof document !== 'undefined') {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.prepend(skipLink);
}

createRoot(document.getElementById('app')!).render(<App />);