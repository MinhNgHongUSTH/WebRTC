import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App.jsx';
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId='770914931850-r9edonatfgi09obmpr78d7nfi3ps5v82.apps.googleusercontent.com'>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
