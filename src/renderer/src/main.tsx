import * as Sentry from '@sentry/electron/renderer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
import './styles.css'

Sentry.init({})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
