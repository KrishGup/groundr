import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


// Make sure React properly mounts to the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

