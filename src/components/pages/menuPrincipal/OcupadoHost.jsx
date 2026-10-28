import React, { useEffect, useState } from "react";
import { registrarHost } from "./ocupado";
import "./Pasanaku.css";

// Pantalla de "estamos trabajando": una moneda que gira, el mensaje y una barra de avance. Bloquea los toques mientras dura.
const OcupadoHost = () => {
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    registrarHost(setEstado);
    return () => registrarHost(null);
  }, []);

  if (!estado) return null;
  const { titulo, texto, progreso } = estado;

  return (
    <div className="pk-ocupado-fondo" role="alertdialog" aria-busy="true" aria-live="polite" aria-label={titulo}>
      <div className="pk-ocupado">
        <div className="pk-ocupado-moneda" aria-hidden="true"><span>Bs</span></div>
        <h3>{titulo}</h3>
        {texto && <p>{texto}</p>}
        <div className={`pk-ocupado-barra ${progreso == null ? "indeterminada" : ""}`} aria-hidden="true">
          <span style={progreso == null ? undefined : { width: `${Math.max(4, Math.min(100, progreso))}%` }} />
        </div>
        {progreso != null && <small>{Math.round(progreso)}%</small>}
      </div>
    </div>
  );
};

export default OcupadoHost;
