import React from "react";
import PropTypes from "prop-types";
import "./Splash.css";

// Marcador de carga para listas: tarjetas "fantasma" que brillan mientras llegan los datos
const Cargando = ({ filas = 3 }) => (
  <div className="cargando-lista" role="status" aria-label="Cargando">
    {Array.from({ length: filas }, (_, i) => (
      <div key={i} className="cargando-fila">
        <span className="cargando-foto" />
        <span className="cargando-lineas"><i /><i /></span>
        <span className="cargando-chip" />
      </div>
    ))}
  </div>
);

Cargando.propTypes = { filas: PropTypes.number };

export default Cargando;
