import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Debug: log startup
try {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    console.error('Root element not found!')
  } else {
    console.log('Mounting React app...')
    const root = createRoot(rootEl)
    root.render(
      <React.StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </React.StrictMode>
    )
    console.log('React app mounted successfully')
  }
} catch (err) {
  console.error('Failed to mount React app:', err)
  document.body.innerHTML = '<div style="padding:20px;color:red">Error: ' + (err as Error).message + '</div>'
}
