import React, { useState } from "react";
import PropTypes from "prop-types";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./Pasanaku.css";

// Campo de contraseña con botón para mostrarla u ocultarla
const CampoClave = ({ etiqueta, value, onChange, autoComplete, autoFocus = false }) => {
  const [ver, setVer] = useState(false);
  return (
    <label>{etiqueta}
      <span className="pk-campo-clave">
        <input type={ver ? "text" : "password"} value={value} onChange={onChange} minLength={8} required autoFocus={autoFocus} autoComplete={autoComplete} />
        <button type="button" className="pk-ojo-clave" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {ver ? <FiEyeOff /> : <FiEye />}
        </button>
      </span>
    </label>
  );
};

CampoClave.propTypes = {
  etiqueta: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
};

export default CampoClave;
