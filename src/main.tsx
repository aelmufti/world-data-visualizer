import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import { AISProvider } from './contexts/AISContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AISProvider>
      <App />
    </AISProvider>
  </React.StrictMode>,
)
