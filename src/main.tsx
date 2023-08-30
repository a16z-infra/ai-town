import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './App.tsx'
import './index.css'
import ConvexClientProvider from './components/ConvexClientProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      <Home />
    </ConvexClientProvider>
  </React.StrictMode>,
)
