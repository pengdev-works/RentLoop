import React from 'react';
import ReactDOM from 'react-dom/client';
import 'sweetalert2/dist/sweetalert2.min.css';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dismiss the splash screen after React has painted its first frame
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      // Keep splash up for at least 1.4 s so the animation feels intentional
      const minDelay = 2200;
      const elapsed = performance.now();
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => splash.classList.add('splash-hidden'), remaining);
    }
  });
});

