import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress all console logs to prevent exposure of API data or other info
console.log = () => {};
console.warn = () => {};
console.error = () => {};
console.info = () => {};
console.debug = () => {};

createRoot(document.getElementById('root')).render(
    <App />
)
