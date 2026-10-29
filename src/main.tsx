import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/jigi.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { createDefaultApi } from './api';
import { AppProviders, AppRoutes } from './App';

// Routage par hash : GitHub Pages ne réécrit pas les URL (cahier des charges 6.1).
const api = createDefaultApi();
const container = document.getElementById('root');
if (!container) throw new Error('Élément #root introuvable dans index.html.');

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <AppProviders api={api}>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  </StrictMode>,
);
