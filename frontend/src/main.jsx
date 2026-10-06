import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

// Restaure le thème choisi par l'utilisateur avant le premier rendu (évite le flash sombre)
if (localStorage.getItem('axis_theme') === 'light') {
  document.documentElement.setAttribute('data-axis-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
