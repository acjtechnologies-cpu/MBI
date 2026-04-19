// Reset localStorage si version app change
const APP_VERSION = '3'
if (localStorage.getItem('mbi_version') !== APP_VERSION) {
  localStorage.clear()
  localStorage.setItem('mbi_version', APP_VERSION)
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <App />
  ,
)