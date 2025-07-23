import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// REMOVE THIS IMPORT: import { BrowserRouter } from 'react-router-dom'; // No BrowserRouter here
import { Provider } from 'react-redux';
import { store } from './app/store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

const persistor = persistStore(store); // Define persistor here

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* IMPORTANT: NO BrowserRouter HERE. It must be in AppRouter.js only. */}
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);