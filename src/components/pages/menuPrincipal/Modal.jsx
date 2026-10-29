import React, { useEffect } from "react";
import { useAtras } from "./atras";
import PropTypes from "prop-types";
import { FiX } from "react-icons/fi";
import "./Pasanaku.css";

// Ventana emergente estándar (se cierra con la X, con Esc o haciendo clic fuera)
const Modal = ({ titulo, subtitulo, ancho = 760, onCerrar, children }) => {
  useAtras(true, onCerrar);
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="pk-modal-fondo" onClick={onCerrar} role="presentation">
      <div className="pk-modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="pk-modal-cab">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="pk-icon" title="Cerrar" onClick={onCerrar}><FiX /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  titulo: PropTypes.string.isRequired,
  subtitulo: PropTypes.string,
  ancho: PropTypes.number,
  onCerrar: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default Modal;
