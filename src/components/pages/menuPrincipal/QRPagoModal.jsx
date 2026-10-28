import React from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiDownload, FiCopy } from "react-icons/fi";
import Modal from "./Modal";
import "./Pasanaku.css";

// Muestra el QR de pago del pasanaku (descargable) con los datos de la cuenta
const QRPagoModal = ({ cuenta, nombreGrupo, titulo = "Pagar con QR", onCerrar }) => {
  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); toast.success("Copiado"); }
    catch { toast.error("No se pudo copiar."); }
  };

  const datos = [["Titular", cuenta.titular], ["Banco", cuenta.banco], ["Cuenta / celular", cuenta.cuenta]].filter(([, v]) => v);

  return (
    <Modal titulo={titulo} subtitulo={nombreGrupo} ancho={440} onCerrar={onCerrar}>
      <div className="pk-qr-caja">
        {cuenta.qr ? (
          <>
            <img className="pk-qr-img" src={cuenta.qr} alt="Código QR para pagar" />
            <a className="pk-btn" href={cuenta.qr} download={`QR-${(titulo + "-" + nombreGrupo).replace(/\s+/g, "-")}.webp`}><FiDownload /> Descargar QR</a>
            <small className="pkf-nota">Descárgalo y súbelo en la app de tu banco, o escanéalo desde otro dispositivo.</small>
          </>
        ) : <p className="pk-vacio">El administrador todavía no subió un QR.</p>}

        {datos.length > 0 && (
          <ul className="pk-datos pk-qr-datos">
            {datos.map(([etiqueta, valor]) => (
              <li key={etiqueta}>
                <span>{etiqueta}</span>
                <strong>{valor} <button type="button" className="pk-icon" title="Copiar" onClick={() => copiar(valor)}><FiCopy /></button></strong>
              </li>
            ))}
          </ul>
        )}
        {cuenta.nota && <p className="pk-qr-nota">{cuenta.nota}</p>}
      </div>
    </Modal>
  );
};

QRPagoModal.propTypes = {
  cuenta: PropTypes.shape({ qr: PropTypes.string, titular: PropTypes.string, banco: PropTypes.string, cuenta: PropTypes.string, nota: PropTypes.string }).isRequired,
  nombreGrupo: PropTypes.string.isRequired,
  titulo: PropTypes.string,
  onCerrar: PropTypes.func.isRequired,
};

export default QRPagoModal;
