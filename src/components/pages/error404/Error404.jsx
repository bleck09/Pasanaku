import React from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { FiHome, FiRefreshCw } from "react-icons/fi";
import Cerdito3D from "../home/Cerdito3D";
import "./Error404.css";

// Página de error: "no encontrada" cuando la ruta no existe, y "algo salió mal" cuando la pantalla falló por un error del programa
const Error404 = () => {
  const error = useRouteError();
  const noExiste = !error || (isRouteErrorResponse(error) && error.status === 404);

  return (
    <div className="e404">
      <span className="e404-deco d1" aria-hidden="true" />
      <span className="e404-deco d2" aria-hidden="true" />

      <main className="e404-centro">
        <div className="e404-cerdo" aria-hidden="true"><Cerdito3D /></div>

        <h1 className="e404-codigo">{noExiste ? "404" : "¡Ups!"}</h1>
        <h2>{noExiste ? "No encontramos esta página" : "Algo salió mal"}</h2>
        <p>
          {noExiste
            ? "La dirección que abriste no existe o ya cambió de lugar."
            : "Esta pantalla no se pudo mostrar. Prueba recargando; si sigue igual, avísale al administrador."}
        </p>

        <div className="e404-acciones">
          <Link to="/" className="e404-boton"><FiHome /> Volver al inicio</Link>
          {!noExiste && <button type="button" className="e404-boton claro" onClick={() => window.location.reload()}><FiRefreshCw /> Recargar</button>}
        </div>

        {!noExiste && error?.message && <small className="e404-detalle">Detalle técnico: {String(error.message).slice(0, 160)}</small>}
      </main>
    </div>
  );
};

export default Error404;
