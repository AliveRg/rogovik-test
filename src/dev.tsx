import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DevPage } from './pages/DevPage';
import './styles/style.css';
import './styles/dev.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found in dev.html');

createRoot(root).render(
  <StrictMode>
    <DevPage />
  </StrictMode>
);
