import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { addDoc, collection } from "firebase/firestore";
import { ref } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { FiArrowLeft, FiArrowRight, FiCheck, FiAlertTriangle, FiDownload, FiCopy, FiFileText, FiClock } from "react-icons/fi";
import Avatar from "./Avatar";
import Modal from "./Modal";
import SubirComprobante from "./SubirComprobante";
import PagoEnviadoModal from "./PagoEnviadoModal";
import { ocupado, subirConProgreso } from "./ocupado";
import { esPdf, extensionDe } from "./imagenes";
import { useCuentaPago } from "./useCuentaPago";
import { usePerfiles } from "./perfiles";
import { fechaRonda, formatFecha, limiteSinMulta, money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Hoja para pagar: a la izquierda tu cuota, el plazo y el QR; a la derecha el monto y el comprobante.
// Se confirma con una ventana corta, y al enviar aparece el aviso de pago enviado.
const PagarHoja = ({ grupo, ronda, yo, uid, mio, onCerrar }) => {
  const fotos = usePerfiles();
  const { cuenta } = useCuentaPago(grupo.id);
  const [monto, setMonto] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const vista = useMemo(() => (archivo && !esPdf(archivo) ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => { if (vista) URL.revokeObjectURL(vista); }, [vista]);

  const montoNum = Number(monto);
  const quedaras = mio.pagado + mio.revision + (montoNum > 0 ? montoNum : 0);
  const completa = montoNum > 0 && quedaras >= mio.cuotaTotal;
  const limite = grupo.multa > 0 ? limiteSinMulta(grupo, ronda) : null;
  const plazo = limite ? new Date(limite) : fechaRonda(grupo, ronda);

  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); toast.success("Copiado"); }
    catch { toast.error("No se pudo copiar."); }
  };

  const revisar = (e) => {
    e.preventDefault();
    if (!(montoNum > 0)) return toast.error("Escribe cuánto vas a pagar.");
    if (montoNum > mio.porPagar) return toast.error(`Solo te faltan ${money(mio.porPagar)}.`);
    if (!archivo) return toast.error("Sube la foto o el PDF de tu comprobante.");
    setConfirmando(true);
  };

  const enviar = async () => {
    setEnviando(true);
    const trabajo = ocupado.iniciar({ titulo: "Enviando tu pago...", texto: "Estamos subiendo tu comprobante. No cierres esta página." });
    let comprobanteUrl;
    try {
      const storageRef = ref(storage, `comprobantes/${grupo.id}/${ronda}_${uid}_${Date.now()}.${extensionDe(archivo)}`);
      comprobanteUrl = await subirConProgreso(storageRef, archivo, trabajo.progreso);
    } catch (err) {
      console.error("Subir comprobante:", err);
      toast.error(err.code === "storage/unauthorized"
        ? "Firebase no permite subir el archivo (reglas de Storage sin publicar, o el archivo es muy pesado)."
        : `No se pudo subir el archivo (${err.code || "error"}).`, { duration: 7000 });
      await trabajo.terminar();
      setEnviando(false);
      return;
    }
    try {
      trabajo.texto("Registrando tu pago...");
      await addDoc(collection(db, "pagos"), {
        pasanakuId: grupo.id, ronda, participanteId: yo.id, uid,
        monto: montoNum, estado: "revision", comprobanteUrl, comprobanteTipo: esPdf(archivo) ? "pdf" : "imagen", fecha: Date.now(),
      });
      await trabajo.terminar();
      setConfirmando(false);
      setEnviando(false);
      setEnviado(true);
    } catch (err) {
      console.error("Registrar pago:", err);
      toast.error(`No se pudo registrar el pago (${err.code || "error"}). Revisa las reglas de Firestore.`, { duration: 7000 });
      await trabajo.terminar();
      setEnviando(false);
    }
  };

  if (enviado) return <PagoEnviadoModal monto={montoNum} ronda={ronda} onCerrar={onCerrar} />;

  const datosCuenta = cuenta ? [["Titular", cuenta.titular], ["Banco", cuenta.banco], ["Cuenta / celular", cuenta.cuenta]].filter(([, v]) => v) : [];

  return (
    <div className="pk-view pk-hoja-pago">
      <button type="button" className="pk-btn pk-btn-ghost pk-hoja-pago-volver" onClick={onCerrar} disabled={enviando}><FiArrowLeft /> Volver</button>
      <div className="pk-header" style={{ marginBottom: "0.5rem" }}>
        <div>
          <h1>{mio.cuotaBase !== mio.cuotaTotal && mio.pagado >= mio.cuotaBase ? "Pagar mi multa" : "Pagar mi cuota"}</h1>
          <p>Ronda {ronda} · {grupo.nombre}</p>
        </div>
      </div>

      <div className="pk-hoja-pago-grid">
        <aside className="pk-card pk-hoja-pago-lado">
          <Avatar nombre={yo.nombre} foto={fotos.get(yo.uid)} tam={64} />
          <h2>{yo.nombre}</h2>
          <div className="pk-pago-totales">
            <div><span>{mio.multa > 0 ? "Cuota + multa" : "Cuota"}</span><strong>{money(mio.cuotaTotal)}</strong></div>
            <div><span>Ya aportaste</span><strong>{money(mio.pagado + mio.revision)}</strong></div>
            <div className="rev"><span>Te falta</span><strong>{money(mio.porPagar)}</strong></div>
          </div>
          {mio.multa > 0 && <p className="pk-aviso-pedido"><FiAlertTriangle /> Incluye una multa por retraso de {money(mio.multa)}, confirmada por el administrador.</p>}
          {plazo && !mio.completo && <p className="pk-plazo-linea"><FiClock /> Plazo: hasta el <strong>{formatFecha(plazo)}</strong></p>}

          {cuenta?.qr && (
            <div className="pk-qr-bloque">
              <span className="pk-etiqueta">Paga a este QR</span>
              <img className="pk-qr-img" src={cuenta.qr} alt="QR para pagar" />
              <a className="pk-btn" href={cuenta.qr} download={`QR-${grupo.nombre.replace(/\s+/g, "-")}.webp`}><FiDownload /> Descargar QR</a>
              {datosCuenta.length > 0 && (
                <ul className="pk-datos pk-qr-datos">
                  {datosCuenta.map(([etiqueta, valor]) => (
                    <li key={etiqueta}><span>{etiqueta}</span><strong>{valor} <button type="button" className="pk-icon" title="Copiar" onClick={() => copiar(valor)}><FiCopy /></button></strong></li>
                  ))}
                </ul>
              )}
              {cuenta.nota && <p className="pk-qr-nota">{cuenta.nota}</p>}
            </div>
          )}
        </aside>

        <form className="pk-card pk-hoja-pago-cuerpo" onSubmit={revisar}>
          <div className="pk-pago-bloque">
            <span className="pk-pago-paso"><b>1</b> ¿Cuánto vas a pagar?</span>
            <div className="pk-monto-input">
              <span>Bs.</span>
              <input type="number" min="1" max={mio.porPagar} step="any" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" inputMode="decimal" required />
            </div>
            <div className="pk-montos-rapidos">
              <button type="button" className="pk-modo" onClick={() => setMonto(String(mio.porPagar))}>Todo ({money(mio.porPagar)})</button>
              {mio.porPagar >= 2 && <button type="button" className="pk-modo" onClick={() => setMonto(String(Math.round((mio.porPagar / 2) * 100) / 100))}>La mitad</button>}
            </div>
          </div>

          <div className="pk-pago-bloque">
            <span className="pk-pago-paso"><b>2</b> Sube tu comprobante</span>
            <SubirComprobante archivo={archivo} onArchivo={setArchivo} />
            <small className="pkf-nota">Después de pagar con el QR, sube la captura o el PDF del comprobante.</small>
          </div>

          <div className="pk-actions">
            <button type="button" className="pk-btn pk-btn-ghost" onClick={onCerrar} disabled={enviando}>Cancelar</button>
            <button type="submit" className="pk-btn"><FiArrowRight /> Revisar y enviar</button>
          </div>
        </form>
      </div>

      {confirmando && (
        <Modal titulo="¿Enviar este pago?" subtitulo="Revisa los datos antes de confirmar" ancho={440} onCerrar={enviando ? () => {} : () => setConfirmando(false)}>
          <div className="pk-confirmar-pago">
            <div className="pk-confirmar-monto">
              <span>Vas a enviar</span>
              <strong>{money(montoNum)}</strong>
              <small>Ronda {ronda} · {grupo.nombre}</small>
            </div>
            <div className="pk-confirmar-archivo">
              {archivo && esPdf(archivo) ? <div className="pk-preview pk-preview-pdf"><FiFileText /><strong>PDF</strong></div> : <img className="pk-preview" src={vista} alt="Tu comprobante" />}
              <small>{completa ? "Con este pago completas tu cuota de la ronda." : `Después de este pago te seguirán faltando ${money(Math.max(mio.cuotaTotal - quedaras, 0))}.`}</small>
            </div>
            <p className="pkf-nota">El administrador revisará tu comprobante y lo confirmará. Mientras tanto aparecerá como &quot;en revisión&quot;.</p>
            <div className="pk-actions">
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setConfirmando(false)} disabled={enviando}>Volver</button>
              <button type="button" className="pk-btn" onClick={enviar} disabled={enviando}><FiCheck /> Sí, enviar pago</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

PagarHoja.propTypes = {
  grupo: PropTypes.object.isRequired,
  ronda: PropTypes.number.isRequired,
  yo: PropTypes.object.isRequired,
  uid: PropTypes.string.isRequired,
  mio: PropTypes.object.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default PagarHoja;
