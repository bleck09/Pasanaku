import React from "react";
import PropTypes from "prop-types";
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import { guardarSonido } from "./sonido";
import "./Pasanaku.css";

const BotonSonido = ({ activo, onCambio }) => (
  <button
    type="button"
    className="pk-sonido"
    title={activo ? "Silenciar" : "Activar sonido"}
    onClick={() => { guardarSonido(!activo); onCambio(!activo); }}
  >
    {activo ? <FiVolume2 /> : <FiVolumeX />}
  </button>
);

BotonSonido.propTypes = { activo: PropTypes.bool.isRequired, onCambio: PropTypes.func.isRequired };

export default BotonSonido;
