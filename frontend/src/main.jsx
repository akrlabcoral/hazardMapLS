import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'maplibre-gl/dist/maplibre-gl.css';

// Debug error overlays — only active in local development, stripped in production builds
if (import.meta.env.DEV) {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:red;color:white;z-index:999999;padding:2rem;font-family:monospace;white-space:pre-wrap;';
    errDiv.innerHTML = `<h1>Fatal Error</h1><p>${msg}</p><p>${error?.stack}</p>`;
    document.body.appendChild(errDiv);
    return false;
  };

  const originalError = console.error;
  console.error = function (...args) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:darkred;color:white;z-index:999998;padding:2rem;font-family:monospace;white-space:pre-wrap;';
    errDiv.innerHTML = `<h1>React Render Crash</h1><p>${args.map(a => typeof a === 'object' && a?.stack ? a.stack : JSON.stringify(a)).join(' ')}</p>`;
    document.body.appendChild(errDiv);
    originalError.apply(console, args);
  };
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
