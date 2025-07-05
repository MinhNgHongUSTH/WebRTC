import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId='770914931850-r3vin30rb3ogrl6t3ojklekl51538q6m.apps.googleusercontent.com'>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>,
  document.getElementById("root")
);

reportWebVitals();
