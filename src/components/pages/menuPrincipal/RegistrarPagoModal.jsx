import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { addDoc, collection } from "firebase/firestore";
import { ref } from "firebase/storage";
import { ocupado, subirConProgreso } from "./ocupado";
import { db, storage } from "../../../firebase";
import { FiCheck } from "react-icons/fi";
import Modal from "./Modal";
import Avatar from "./Avatar";
import SubirComprobante from "./SubirComprobante";
import { esPdf, extensionDe } from "./imagenes";
import { formatFecha, fechaRonda, money } from "./pasanakuUtils";
import "./Pasanaku.css";

// El administrador registra un pago que recibió fuera del sistema (efectivo, transferencia...) y puede adjuntar el comprobante
const RegistrarPagoModal = ({ grupo, persona, foto, ronda, falta, onListo, onCerrar }) => {
  const [monto, setMonto] = useState(String(falta));
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const montoNum = Number(monto);

  const guardar = async (e) => {
    e.preventDefault();
    if (!(montoNum > 0)) return toast.error("Escribe un monto válido.");
    if (montoNum > falta) return toast.error(`Solo falta ${money(falta)} de esta ronda.`);
    setGuardando(true);
    const trabajo = ocupado.iniciar({ titulo: "Registrando el pago...", texto: archivo ? "Subiendo el comprobante. No cierres esta ventana." : "Guardando el pago." });
    let comprobanteUrl = null;
    try {
      if (archivo) {
        const archivoRef = ref(storage, `comprobantes/${grupo.id}/${ronda}_${persona.id}_${Date.now()}.${extensionDe(archivo)}`);
        comprobanteUrl = await subirConProgreso(archivoRef, archivo, trabajo.progreso);
      }
    } catch (err) {
      console.error("Subir comprobante manual:", err);
      toast.error(err.code === "storage/unauthorized" ? "Firebase no permite subir el archivo (reglas de Storage)." : `No se pudo subir el archivo (${err.code || "error"}).`, { duration: 7000 });
      await trabajo.terminar();
      setGuardando(false);
      return;
    }
    try {
      trabajo.texto("Guardando el pago...");
      await addDoc(collection(db, "pagos"), {
        pasanakuId: grupo.id, ronda, participanteId: persona.id, uid: persona.uid || null,
        monto: montoNum, estado: "confirmado", manual: true, fecha: Date.now(),
        ...(comprobanteUrl ? { comprobanteUrl, comprobanteTipo: esPdf(archivo) ? "pdf" : "imagen" } : {}),
      });
      await trabajo.terminar();
      onListo(montoNum);
    } catch (err) {
      console.error("Registrar pago:", err);
      toast.error(`No se pudo registrar el pago (${err.code || "error"}).`);
      await trabajo.terminar();
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Registrar pago recibido" subtitulo={`Ronda ${ronda} · ${grupo.nombre}`} ancho={500} onCerrar={guardando ? () => {} : onCerrar}>
      <form onSubmit={guardar} className="pk-pagar-form">
        <div className="pk-pago-resumen">
          <Avatar nombre={persona.nombre} foto={foto} tam={44} />
          <div className="pk-pago-datos">
            <div><span>Persona</span><strong>{persona.nombre}</strong></div>
            <div><span>Cuota del</span><strong>{formatFecha(fechaRonda(grupo, ronda))}</strong></div>
            <div className="falta"><span>Falta</span><strong>{money(falta)}</strong></div>
          </div>
        </div>

        <div className="pk-pago-bloque">
          <span className="pk-pago-paso"><b>1</b> ¿Cuánto recibiste?</span>
          <div className="pk-monto-input">
            <span>Bs.</span>
            <input type="number" min="1" max={falta} step="any" value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" required autoFocus />
          </div>
          <div className="pk-montos-rapidos">
            <button type="button" className="pk-modo" onClick={() => setMonto(String(falta))}>Todo ({money(falta)})</button>
            {falta >= 2 && <button type="button" className="pk-modo" onClick={() => setMonto(String(Math.round((falta / 2) * 100) / 100))}>La mitad</button>}
          </div>
        </div>

        <div className="pk-pago-bloque">
          <span className="pk-pago-paso"><b>2</b> Comprobante (recomendado)</span>
          <SubirComprobante archivo={archivo} onArchivo={setArchivo} />
          <small className="pkf-nota">Foto de la transferencia o del recibo. Si fue en efectivo, puedes registrarlo sin comprobante.</small>
        </div>

        <div className="pk-actions">
          <button type="button" className="pk-btn pk-btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="pk-btn" disabled={guardando}><FiCheck /> {guardando ? "Registrando..." : "Registrar pago"}</button>
        </div>
      </form>
    </Modal>
  );
};

RegistrarPagoModal.propTypes = {
  grupo: PropTypes.object.isRequired,
  persona: PropTypes.object.isRequired,
  foto: PropTypes.string,
  ronda: PropTypes.number.isRequired,
  falta: PropTypes.number.isRequired,
  onListo: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default RegistrarPagoModal;
