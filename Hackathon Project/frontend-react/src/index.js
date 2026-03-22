import React from 'react';
import ReactDOM from 'react-dom/client';
import { CivicAuthProvider } from '@civic/auth/react';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CivicAuthProvider clientId="dd30a798-b633-47ed-91f0-c1a9cc212834">
    <App />
  </CivicAuthProvider>
);