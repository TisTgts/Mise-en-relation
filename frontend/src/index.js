import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/consoleGuard';
import App from './App';
import { syncCountryFromServer } from './pays/runtime';
import { AppErrorBoundary, initMonitoring } from './monitoring';

initMonitoring();

// Aligne le pays de l'UI sur celui défini côté serveur (recharge si nécessaire).
syncCountryFromServer();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
