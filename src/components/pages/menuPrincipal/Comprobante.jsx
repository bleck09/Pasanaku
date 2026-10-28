import React from "react";
import PropTypes from "prop-types";
import { FiFileText } from "react-icons/fi";
import { esPdf } from "./imagenes";
import "./Pasanaku.css";

// Miniatura de un comprobante (imagen o ícono PDF). Al tocarla se abre el detalle del pago, sin salir del sitio.
const Comprobante = ({ pago, onVer }) => (
  esPdf(pago.comprobanteUrl) ? (
    <button type="button" className="pk-miniatura pk-miniatura-pdf" title="Ver el PDF" onClick={() => onVer(pago)}>
      <FiFileText /><span>PDF</span>
    </button>
  ) : (
    <button type="button" className="pk-miniatura" title="Ver comprobante" onClick={() => onVer(pago)}>
      <img src={pago.comprobanteUrl} alt="Comprobante" />
    </button>
  )
);

Comprobante.propTypes = { pago: PropTypes.shape({ comprobanteUrl: PropTypes.string.isRequired }).isRequired, onVer: PropTypes.func.isRequired };

export default Comprobante;
