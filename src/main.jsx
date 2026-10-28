import React from 'react';
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom';
import router from './router/Router';
import './index.css';

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)

// Service worker: la app abre más rápido y se puede instalar en el celular
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
