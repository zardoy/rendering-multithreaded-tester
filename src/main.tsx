import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// StrictMode disabled due to OffscreenCanvas incompatibility with double-mounting
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
