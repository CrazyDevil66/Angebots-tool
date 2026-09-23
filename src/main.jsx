import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Lokal statt von Google Fonts: keine IP-Übermittlung an Google, funktioniert auch offline.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
