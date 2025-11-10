import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './App'; // <-- Import AppWrapper instead of App

// Apply background image from the public/ folder at runtime.
// Using process.env.PUBLIC_URL ensures the file is loaded from the
// app's public path and prevents webpack/css-loader from attempting
// to resolve it during build.
const publicUrl = process.env.PUBLIC_URL || '';
if (typeof document !== 'undefined') {
  document.body.style.backgroundImage = `url(${publicUrl}/background.png)`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundAttachment = 'fixed';
}

// Expose a small helper to remove the static preloader added to
// `public/index.html`. This is intentionally global and lightweight
// so it is available before React mounts.
window.removePreloader = function removePreloader() {
  try {
    const p = document.getElementById('preloader');
    if (!p) return;
    const minVisible = 600; // keep preloader visible at least this many ms
    const start = window.__preloaderStart || 0;
    const elapsed = Math.max(0, Date.now() - start);
    const remaining = Math.max(0, minVisible - elapsed);
    p.classList.add('preloader-hide');
    // remove from DOM after fade + any remaining time to satisfy minVisible
    setTimeout(() => { p.remove(); }, 420 + remaining);
  } catch (e) {
    // no-op
    // console.warn('removePreloader failed', e);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper /> {/* <-- Render AppWrapper */}
  </React.StrictMode>
);