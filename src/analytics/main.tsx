import React from 'react';
import ReactDOM from 'react-dom/client';
import './analytics.css';
import App from './App.tsx';
import ConvexClientProvider from '../components/ConvexClientProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      <App />
    </ConvexClientProvider>
  </React.StrictMode>,
);
