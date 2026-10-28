import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { ref } from "firebase/storage";
import { ocupado, subirConProgreso } from "./ocupado";
import { auth, db, storage } from "../../../firebase";
import { FiArrowLeft, FiCheck, FiAlertTriangle, FiDownload, FiCopy, FiSend } from "react-icons/fi";
import Avatar from "./Avatar";
import PagoEnviadoModal from "./PagoEnviadoModal";
import SubirComprobante from "./SubirComprobante";
import { confirmar } from "./Confirmar";
import { esPdf, extensionDe } from "./imagenes";
import { useCuentaPago } from "./useCuentaPago";
import { entregaId, fechaHora, fechaRonda, formatFecha, money } from "./pasanakuUtils";
import "./Pasanaku.css";

// Hoja para entregar el pozo de una ronda: a la izquierda quién cobra y su QR; a la derecha el comprobante y la confirmación.
// Queda registrado a quién, cuánto, cuándo, con qué comprobante y qué administrador lo hizo.
const EntregarPozoHoja = ({ grupo, persona, foto, monto, completos, total, totalRondas, onCerrar }) => {
  const [archivo, setArchivo] = useState(null);
  const [nota, setNota] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [hecho, setHecho] = useState(false);
  const { cuenta: cobro } = useCuentaPago(persona.uid || null, "cuentas_cobro");
  const incompleto = completos < total;
  const reciente = cobro?.actualizado && Date.now() - cobro.actualizado < 72 * 3600 * 1000;

  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); toast.success("Copiado"); }
    catch { toast.error("No se pudo copiar."); }
  };

  const entregar = async (e) => {
    e.preventDefault();
    if (!archivo) return toast.error("Sube el comprobante de la entrega.");
    const ok = await confirmar({
      titulo: "¿Confirmar la entrega del pozo?",
      mensaje: `Entregas ${money(monto)} a ${persona.nombre} (ronda ${persona.turno}). Esto cierra la ronda y pasa a la siguiente.`,
      textoConfirmar: "Sí, entregar pozo",
    });
    if (!ok) return;

    setSubiendo(true);
    const trabajo = ocupado.iniciar({ titulo: "Entregando el pozo...", texto: "Subiendo el comprobante. No cierres esta página." });
    let comprobanteUrl;
    try {
      const archivoRef = ref(storage, `entregas/${grupo.id}/${persona.turno}_${Date.now()}.${extensionDe(archivo)}`);
      comprobanteUrl = await subirConProgreso(archivoRef, archivo, trabajo.progreso);
    } catch (err) {
      console.error("Subir comprobante de entrega:", err);
      toast.error(err.code === "storage/unauthorized"
        ? "Firebase no permite subir el archivo (faltan publicar las reglas de Storage)."
        : `No se pudo subir el archivo (${err.code || "error"}).`, { duration: 7000 });
      await trabajo.terminar();
      setSubiendo(false);
      return;
    }
    try {
      trabajo.texto("Registrando la entrega...");
      const usuario = auth.currentUser;
      const perfil = usuario ? (await getDoc(doc(db, "usuario", usuario.uid)).catch(() => null))?.data() : null;
      const id = entregaId(grupo.id, persona.turno);
      const batch = writeBatch(db);
      // lo que ven todos: a quién se entregó, cuánto, cuándo y la prueba
      batch.set(doc(db, "entregas", id), {
        pasanakuId: grupo.id, ronda: persona.turno, participanteId: persona.id, monto,
        comprobanteUrl, comprobanteTipo: esPdf(archivo) ? "pdf" : "imagen", nota: nota.trim(), fecha: Date.now(),
      });
      // lo que solo ven los administradores: quién hizo la entrega
      batch.set(doc(db, "entregas_admin", id), {
        pasanakuId: grupo.id, ronda: persona.turno, adminUid: usuario?.uid || null,
        adminNombre: perfil?.nombre || usuario?.email || "Administrador", fecha: Date.now(),
      });
      batch.update(doc(db, "pasanakus", grupo.id), {
        rondaActual: persona.turno + 1,
        estado: persona.turno >= totalRondas ? "finalizado" : "activo",
      });
      await batch.commit();
      await trabajo.terminar();
      setSubiendo(false);
      setHecho(true);
    } catch (err) {
      console.error("Registrar entrega:", err);
      toast.error(`No se pudo registrar la entrega (${err.code || "error"}). Revisa las reglas de Firestore.`, { duration: 7000 });
      await trabajo.terminar();
      setSubiendo(false);
    }
  };

  if (hecho) {
    return <PagoEnviadoModal titulo="¡Pozo entregado!" monto={monto} texto={`La entrega de la ronda ${persona.turno} a ${persona.nombre} quedó registrada con su comprobante. Ya puede verla en su pasanaku.`} onCerrar={onCerrar} />;
  }

  return (
    <div className="pk-view pk-hoja-pago">
      <button type="button" className="pk-btn pk-btn-ghost pk-hoja-pago-volver" onClick={onCerrar} disabled={subiendo}><FiArrowLeft /> Volver</button>
      <div className="pk-header" style={{ marginBottom: "0.5rem" }}>
        <div>
          <h1>Entregar el pozo</h1>
          <p>{grupo.nombre} · ronda {persona.turno} de {totalRondas}</p>
        </div>
      </div>

      <div className="pk-hoja-pago-grid">
        <aside className="pk-card pk-hoja-pago-lado">
          <Avatar nombre={persona.nombre} foto={foto} tam={84} />
          <h2>{persona.nombre}</h2>
          <small>Le toca cobrar el {formatFecha(fechaRonda(grupo, persona.turno))}</small>
          <div className="pk-pago-totales">
            <div><span>Pozo a entregar</span><strong>{money(monto)}</strong></div>
            <div><span>Cuotas completas</span><strong>{completos} de {total}</strong></div>
          </div>
          {incompleto && <p className="pk-aviso-pedido"><FiAlertTriangle /> No todos completaron su cuota: el monto es lo confirmado hasta ahora.</p>}

          <div className="pk-qr-bloque">
            <span className="pk-etiqueta">QR de {persona.nombre}</span>
            {cobro?.qr ? (
              <>
                <img className="pk-qr-img" src={cobro.qr} alt={`QR de ${persona.nombre}`} />
                <a className="pk-btn" href={cobro.qr} download={`QR-${persona.nombre.replace(/\s+/g, "-")}.webp`}><FiDownload /> Descargar QR</a>
                {cobro.nota && (
                  <p className="pk-qr-nota">{cobro.nota} <button type="button" className="pk-icon" title="Copiar" onClick={() => copiar(cobro.nota)}><FiCopy /></button></p>
                )}
                <small className="pkf-nota">Actualizado el {fechaHora(cobro.actualizado)}</small>
                {reciente && <p className="pk-aviso-pedido"><FiAlertTriangle /> Este QR se cambió hace menos de 3 días. Confirma con {persona.nombre} que es suyo antes de pagar.</p>}
              </>
            ) : (
              <p className="pk-aviso-pedido"><FiAlertTriangle /> {persona.nombre} todavía no subió su QR (lo hace desde &quot;Mi perfil&quot;). Pídele sus datos para pagarle.</p>
            )}
          </div>
        </aside>

        <form className="pk-card pk-hoja-pago-cuerpo" onSubmit={entregar}>
          <div className="pk-pago-bloque">
            <span className="pk-pago-paso"><b>1</b> Paga con el QR</span>
            <p className="pkf-nota">Descarga el QR, haz la transferencia de {money(monto)} desde tu banco y guarda la captura del comprobante.</p>
          </div>

          <div className="pk-pago-bloque">
            <span className="pk-pago-paso"><b>2</b> Sube el comprobante de la entrega</span>
            <SubirComprobante archivo={archivo} onArchivo={setArchivo} />
            <small className="pkf-nota">Lo verá todo el grupo como prueba de que se pagó.</small>
          </div>

          <div className="pk-pago-bloque">
            <span className="pk-pago-paso"><b>3</b> Nota (opcional)</span>
            <label className="pkf-campo"><input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Transferencia al Banco Unión" maxLength={140} /></label>
          </div>

          <div className="pk-actions">
            <button type="button" className="pk-btn pk-btn-ghost" onClick={onCerrar} disabled={subiendo}>Cancelar</button>
            <button type="submit" className="pk-btn pk-btn-inicio" disabled={subiendo || !archivo}><FiSend /> {subiendo ? "Registrando..." : "Entregar pozo"}{!subiendo && <FiCheck />}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

EntregarPozoHoja.propTypes = {
  grupo: PropTypes.object.isRequired,
  persona: PropTypes.object.isRequired,
  foto: PropTypes.string,
  monto: PropTypes.number.isRequired,
  completos: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  totalRondas: PropTypes.number.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default EntregarPozoHoja;
