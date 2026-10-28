import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { FiX, FiExternalLink, FiCheck, FiClock, FiFileText, FiEdit3, FiCalendar, FiGift, FiUser } from "react-icons/fi";
import { esPdf } from "./imagenes";
import { fechaHora, money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Detalle de un pago: monto, fecha y hora, estado y el comprobante (imagen o PDF) sin salir del sitio
const VisorImagen = ({ pago, onCerrar }) => {
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const url = pago.comprobanteUrl;
  const pdf = url ? esPdf(url) : false;
  // Chrome/Firefox/Safari de escritorio muestran el PDF dentro de la página; en muchos celulares no, y ahí se ofrece abrirlo
  const pdfEnPagina = typeof navigator !== "undefined" && navigator.pdfViewerEnabled !== false;

  return (
    <div className="pk-visor-fondo" onClick={onCerrar} role="presentation">
      <div className="pk-visor pk-visor-detalle" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="pk-visor-barra">
          <strong className="pk-visor-monto">{money(pago.monto)}</strong>
          {pago.estado === "revision" ? <span className="pk-chip pk-chip-rev"><FiClock /> En revisión</span> : <span className="pk-chip pk-chip-ok"><FiCheck /> {pago.estado === "entregado" ? "Entregado" : "Confirmado"}</span>}
          <button type="button" className="pk-icon pk-visor-cerrar" title="Cerrar" onClick={onCerrar}><FiX /></button>
        </div>
        <div className="pk-visor-meta">
          <span><FiCalendar /> {fechaHora(pago.fecha)}</span>
          <span>{pago.estado === "entregado" ? <FiGift /> : <FiUser />} {pago.leyenda || (pago.manual ? "Registrado por el administrador" : "Enviado por la persona")}</span>
        </div>

        {!url ? (
          <div className="pk-visor-vacio"><FiEdit3 /><p>Este registro no tiene comprobante adjunto.</p></div>
        ) : pdf ? (
          pdfEnPagina ? (
            <iframe className="pk-visor-pdf" title="Comprobante en PDF" src={url} />
          ) : (
            <div className="pk-visor-vacio"><FiFileText /><p>Este comprobante es un PDF. Tu navegador no puede mostrarlo aquí; ábrelo en una pestaña nueva.</p></div>
          )
        ) : (
          <img src={url} alt="Comprobante de pago" />
        )}

        {url && <a className="pk-link pk-visor-abrir" href={url} target="_blank" rel="noreferrer"><FiExternalLink /> Abrir en una pestaña nueva</a>}
      </div>
    </div>
  );
};

VisorImagen.propTypes = {
  pago: PropTypes.shape({ comprobanteUrl: PropTypes.string, monto: PropTypes.number, fecha: PropTypes.number, estado: PropTypes.string, manual: PropTypes.bool, verbo: PropTypes.string, leyenda: PropTypes.string }).isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default VisorImagen;
