import React, { lazy, Suspense } from 'react';
import { createHashRouter } from "react-router-dom";
import Error404 from "../components/pages/error404/Error404";
import App from '../components/templates/App';
import Splash from '../components/pages/menuPrincipal/Splash';

// Cada pantalla se descarga solo cuando se visita (el inicio no carga Firebase ni las gráficas)
const Products = lazy(() => import('../components/pages/productos/Products'));
const Albun = lazy(() => import('../components/pages/albun/Albun'));
const Home = lazy(() => import('../components/pages/home/Home'));
const Login = lazy(() => import('../components/pages/login/Login'));
const MenuPrincipal = lazy(() => import('../components/pages/menuPrincipal/MenuPrincipal'));

const cargando = (pantalla) => <Suspense fallback={<Splash />}>{pantalla}</Suspense>;

const router = createHashRouter([  // 👈 también aquí
  {
    path: "/",
    element: <App />,
    errorElement: <Error404 />,
    children: [
      {
        index: true,
        element: cargando(<Home />),
      },
      {
        path: "/productos",
        element: cargando(<Products />),
      },
      {
        path: "/albun",
        element: cargando(<Albun />),
      },
       {
        path: "/menuPrincipal",
        element: cargando(<MenuPrincipal />),
      },
    ],
  },
  {
    path: "/login",
    element: cargando(<Login />),
  },
]);

export default router;
