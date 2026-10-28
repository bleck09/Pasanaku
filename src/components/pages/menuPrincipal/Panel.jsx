import React from "react";
import PropTypes from "prop-types";
import "./Pasanaku.css";

// Sección que se muestra dentro de una pestaña (misma forma que Modal, pero en la página)
const Panel = ({ titulo, subtitulo, children }) => (
  <div className="pk-card pk-panel">
    <div className="pk-panel-cab">
      <h3>{titulo}</h3>
      {subtitulo && <small>{subtitulo}</small>}
    </div>
    {children}
  </div>
);

Panel.propTypes = { titulo: PropTypes.string.isRequired, subtitulo: PropTypes.string, children: PropTypes.node };

export default Panel;
