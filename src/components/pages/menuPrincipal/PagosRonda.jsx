import React, { useState } from "react";
import { useAtras } from "./atras";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiCheck, FiX, FiTrash2, FiPlus, FiEye, FiClock, FiEdit3, FiChevronDown, FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { confirmar } from "./Confirmar";
import VisorImagen from "./VisorImagen";
import Comprobante from "./Comprobante";
import MostrarMas from "./MostrarMas";
import { ocupado } from "./ocupado";
import RegistrarPagoModal from "./RegistrarPagoModal";
import PagoEnviadoModal from "./PagoEnviadoModal";
import { usePaginado } from "./usePaginado";
import Avatar from "./Avatar";
import { usePerfiles } from "./perfiles";
import { fechaHora, fechaRonda, formatFecha, limiteSinMulta, money, multaId, resumenPago } from "./pasanakuUtils";
import "./Pasanaku.css";

const Estado = ({ r }) => (
  r.completo ? <span className="pk-chip pk-chip-ok"><FiCheck /> Completo</span>
    : r.pagado > 0 ? <span className="pk-chip pk-chip-rev">Parcial</span>
    : r.revision > 0 ? <span className="pk-chip pk-chip-rev"><FiClock /> En revisión</span>
    : <span className="pk-chip">Sin pagar</span>
);
Estado.propTypes = { r: PropTypes.object.isRequired };

// Pagos de una ronda en tarjetas, una por participante. "Ver pagos" abre el detalle de la persona:
// la ronda actual (confirmar, rechazar, registrar a mano) y su historial de las demás rondas.
const PagosRonda = ({ grupo, ronda, lista, pagos, multas = [], soloLectura = false, abrirId = null }) => {
  const fotos = usePerfiles();
  const [abierto, setAbierto] = useState(abrirId); // id del participante cuyo detalle se muestra
  useAtras(Boolean(abierto), () => setAbierto(null));
  const [registrando, setRegistrando] = useState(null); // { persona, ronda, falta }
  const [aviso, setAviso] = useState(null); // aviso con sonido tras confirmar o registrar un pago
  const [visor, setVisor] = useState(null);
  const [vistaDet, setVistaDet] = useState("ronda"); // ronda | todo
  const [abiertas, setAbiertas] = useState([]); // rondas desplegadas en el historial

  const pagina = usePaginado(lista, "", 24);
  const persona = lista.find((p) => p.id === abierto) || null;
  const totalRondas = Math.max(grupo.cupos || lista.length, 1);

  const confirmarPago = async (pago) => {
    const trabajo = ocupado.iniciar({ titulo: "Confirmando el pago...", texto: "Un momento." });
    try {
      await updateDoc(doc(db, "pagos", pago.id), { estado: "confirmado" });
      const quien = lista.find((x) => x.id === pago.participanteId)?.nombre || "la persona";
      await trabajo.terminar();
      setAviso({ titulo: "¡Pago aceptado!", monto: pago.monto, texto: `El pago de ${quien} de la ronda ${pago.ronda} quedó confirmado y ya cuenta en su cuota.` });
    } catch {
      await trabajo.terminar();
      toast.error("No se pudo confirmar.");
    }
  };

  const quitar = async (pago, rechazo) => {
    const ok = await confirmar(rechazo
      ? { titulo: "¿Rechazar este comprobante?", mensaje: "La persona deberá volver a enviarlo.", textoConfirmar: "Rechazar", peligro: true }
      : { titulo: "¿Eliminar este pago confirmado?", mensaje: "Dejará de contar en la cuota de la ronda.", textoConfirmar: "Eliminar", peligro: true });
    if (!ok) return;
    const trabajo = ocupado.iniciar({ titulo: rechazo ? "Rechazando el comprobante..." : "Eliminando el pago...", texto: "Un momento." });
    try { await deleteDoc(doc(db, "pagos", pago.id)); }
    catch { toast.error("No se pudo quitar el pago."); }
    finally { await trabajo.terminar(); }
  };

  const filas = (r) => (
    <ul className="pk-pagos-lista">
      {[...r.mios].sort((x, y) => (y.fecha || 0) - (x.fecha || 0)).map((pg) => (
        <li key={pg.id} className="pk-pago-fila">
          {pg.comprobanteUrl ? <Comprobante pago={pg} onVer={setVisor} /> : <span className="pk-pago-manual" title="Registrado por el administrador"><FiEdit3 /></span>}
          <div className="pk-pago-fila-info">
            <div><strong>{money(pg.monto)}</strong><span>{fechaHora(pg.fecha)}</span></div>
            {pg.estado === "revision" ? <span className="pk-chip pk-chip-rev"><FiClock /> En revisión</span> : <span className="pk-chip pk-chip-ok"><FiCheck /> Confirmado</span>}
          </div>
          <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini pk-btn-ojo" title="Ver detalle" aria-label="Ver detalle" onClick={() => setVisor(pg)}><FiEye /><span className="pk-txt-ancho"> Ver detalle</span></button>
          {!soloLectura && (
            <div className="pk-pago-fila-acciones">
              {pg.estado === "revision" ? (
                <>
                  <button type="button" className="pk-btn pk-btn-mini" onClick={() => confirmarPago(pg)}><FiCheck /> Confirmar</button>
                  <button type="button" className="pk-btn pk-btn-mini pk-btn-ghost" onClick={() => quitar(pg, true)}><FiX /> Rechazar</button>
                </>
              ) : (
                <button type="button" className="pk-btn pk-btn-mini pk-btn-ghost pk-danger" onClick={() => quitar(pg, false)}><FiTrash2 /> Eliminar</button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const etiquetaRonda = (n) => (n === ronda ? "ronda elegida" : n > ronda ? "próxima" : "anterior");

  // El administrador decide la multa por retraso: la confirma (se suma a la cuota) o la perdona
  const decidirMulta = async (p, n, estado) => {
    const monto = Number(grupo.multa) || 0;
    const ok = await confirmar(estado === "confirmada"
      ? { titulo: `¿Confirmar la multa de ${p.nombre}?`, mensaje: `Se sumarán ${money(monto)} a su cuota de la ronda ${n}. No podrá pagar rondas siguientes hasta completarla.`, textoConfirmar: "Sí, confirmar multa" }
      : { titulo: `¿Perdonar la multa de ${p.nombre}?`, mensaje: `Ya no se le cobrarán ${money(monto)} por esta ronda.`, textoConfirmar: "Sí, perdonar" });
    if (!ok) return;
    const trabajo = ocupado.iniciar({ titulo: estado === "confirmada" ? "Confirmando la multa..." : "Perdonando la multa...", texto: "Un momento." });
    try {
      await setDoc(doc(db, "multas", multaId(grupo.id, p.id, n)), { pasanakuId: grupo.id, participanteId: p.id, ronda: n, estado, monto, fecha: Date.now() });
      toast.success(estado === "confirmada" ? "Multa confirmada" : "Multa perdonada");
    } catch {
      toast.error("No se pudo guardar la decisión. ¿Publicaste las reglas de Firestore?");
    } finally {
      await trabajo.terminar();
    }
  };

  const bloqueMulta = (p, n, r) => {
    const limite = limiteSinMulta(grupo, n);
    if (r.multa > 0) {
      return (
        <div className="pk-multa-caja confirmada">
          <span><FiAlertTriangle /> <strong>Multa confirmada: {money(r.multa)}</strong> · {r.completo ? "ya pagada" : "pendiente de pago"}</span>
          {!soloLectura && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => decidirMulta(p, n, "perdonada")}>Perdonar</button>}
        </div>
      );
    }
    if (r.multaPropuesta > 0) {
      return (
        <div className="pk-multa-caja propuesta">
          <span><FiAlertTriangle /> <strong>Multa por retraso: {money(r.multaPropuesta)}</strong> · el plazo{limite ? ` terminó el ${formatFecha(new Date(limite))}` : " ya pasó"}</span>
          {soloLectura ? <small>Falta que el administrador la confirme.</small> : (
            <span className="pk-acciones-fila">
              <button type="button" className="pk-btn pk-btn-mini" onClick={() => decidirMulta(p, n, "confirmada")}><FiCheck /> Confirmar multa</button>
              <button type="button" className="pk-btn pk-btn-mini pk-btn-ghost" onClick={() => decidirMulta(p, n, "perdonada")}>Perdonar</button>
            </span>
          )}
        </div>
      );
    }
    if (r.multaPerdonada) {
      return (
        <div className="pk-multa-caja perdonada">
          <span><FiAlertTriangle /> Multa perdonada</span>
          {!soloLectura && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => decidirMulta(p, n, "confirmada")}>Aplicar multa</button>}
        </div>
      );
    }
    return null;
  };

  // Bloque de una ronda: monto, barra, pagos y (si corresponde) el registro manual
  const bloqueRonda = (p, n) => {
    const r = resumenPago(pagos, p.id, n, grupo, multas);
    return (
      <>
        {bloqueMulta(p, n, r)}
        <div className="pk-monto"><strong>{money(r.pagado)}</strong><span>de {money(r.cuotaTotal)}{r.revision > 0 ? ` · ${money(r.revision)} por revisar` : ""}</span></div>
        <div className="pk-barra">
          <div className="pk-barra-ok" style={{ width: `${Math.min(100, (r.pagado / r.cuotaTotal) * 100)}%` }} />
          <div className="pk-barra-rev" style={{ width: `${Math.min(100 - (r.pagado / r.cuotaTotal) * 100, (r.revision / r.cuotaTotal) * 100)}%` }} />
        </div>
        {r.mios.length > 0 ? filas(r) : <p className="pkf-nota">Todavía no hay pagos en esta ronda.</p>}
        {!r.completo && !soloLectura && (
          <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setRegistrando({ persona: p, ronda: n, falta: r.falta })}><FiPlus /> Registrar pago recibido</button>
        )}
      </>
    );
  };

  const detalle = () => {
    const todas = Array.from({ length: totalRondas }, (_, i) => i + 1);
    const resumenes = todas.map((n) => ({ n, r: resumenPago(pagos, persona.id, n, grupo, multas) }));
    const aportado = resumenes.reduce((suma, x) => suma + x.r.pagado, 0);
    const enRevision = resumenes.reduce((suma, x) => suma + x.r.revision, 0);
    const completas = resumenes.filter((x) => x.r.completo).length;
    // en el historial solo se listan las rondas que ya llegaron o que tienen pagos (por ejemplo, adelantos)
    const listadas = resumenes.filter((x) => x.n <= ronda || x.r.mios.length > 0).sort((x, y) => y.n - x.n);
    const alternar = (n) => setAbiertas(abiertas.includes(n) ? abiertas.filter((x) => x !== n) : [...abiertas, n]);

    return (
      <div className="pk-hoja-pago-grid">
        <aside className="pk-card pk-hoja-pago-lado">
          <Avatar nombre={persona.nombre} foto={fotos.get(persona.uid)} tam={84} />
          <h2>{persona.nombre}</h2>
          <small>Cobra en la ronda {persona.turno} · {formatFecha(fechaRonda(grupo, persona.turno))}</small>
          <div className="pk-pago-totales">
            <div><span>Aportado en total</span><strong>{money(aportado)}</strong></div>
            <div><span>Rondas completas</span><strong>{completas} de {totalRondas}</strong></div>
            {enRevision > 0 && <div className="rev"><span>En revisión</span><strong>{money(enRevision)}</strong></div>}
          </div>
          <div className="pk-segmento pk-pago-segmento">
            <button type="button" className={vistaDet === "ronda" ? "activo" : ""} onClick={() => setVistaDet("ronda")}>Ronda {ronda}</button>
            <button type="button" className={vistaDet === "todo" ? "activo" : ""} onClick={() => setVistaDet("todo")}>Todo el historial</button>
          </div>
        </aside>

        <div className="pk-card pk-hoja-pago-cuerpo">
        {vistaDet === "ronda" ? (
          <section>
            <div className="pk-ronda-cab">
              <h3>Ronda {ronda} <small>· cuota del {formatFecha(fechaRonda(grupo, ronda))}</small></h3>
              <Estado r={resumenPago(pagos, persona.id, ronda, grupo, multas)} />
            </div>
            {bloqueRonda(persona, ronda)}
          </section>
        ) : (
          <section className="pk-historial">
            {listadas.map(({ n, r }) => {
              const abierta = abiertas.includes(n);
              return (
                <div key={n} className={`pk-historial-ronda ${abierta ? "abierta" : ""}`}>
                  <button type="button" className="pk-historial-cab" onClick={() => alternar(n)} aria-expanded={abierta}>
                    <span className="pk-turno">{n}</span>
                    <span className="pk-historial-tit">
                      <strong>Ronda {n} · {formatFecha(fechaRonda(grupo, n))}</strong>
                      <small>{money(r.pagado)} de {money(r.cuotaTotal)} · {r.mios.length === 0 ? "sin pagos" : `${r.mios.length} pago${r.mios.length === 1 ? "" : "s"}`}<span className="pk-txt-ancho"> · {etiquetaRonda(n)}</span></small>
                    </span>
                    <Estado r={r} />
                    <FiChevronDown className={abierta ? "girado" : ""} />
                  </button>
                  {abierta && <div className="pk-historial-cuerpo">{bloqueRonda(persona, n)}</div>}
                </div>
              );
            })}
          </section>
        )}
        </div>
      </div>
    );
  };

  if (persona) {
    return (
      <div className="pk-hoja-pago">
        <button type="button" className="pk-btn pk-btn-ghost pk-hoja-pago-volver" onClick={() => setAbierto(null)}><FiArrowLeft /> Volver a los pagos de la ronda {ronda}</button>
        {soloLectura && <small className="pkf-nota">Solo lectura: los pagos los confirma el administrador.</small>}
        {detalle()}
        {visor && <VisorImagen pago={visor} onCerrar={() => setVisor(null)} />}
        {registrando && <RegistrarPagoModal grupo={grupo} persona={registrando.persona} foto={fotos.get(registrando.persona.uid)} ronda={registrando.ronda} falta={registrando.falta} onCerrar={() => setRegistrando(null)} onListo={(monto) => { setAviso({ titulo: "¡Pago registrado!", monto, texto: `Se registró el pago de ${registrando.persona.nombre} de la ronda ${registrando.ronda}.` }); setRegistrando(null); }} />}
        {aviso && <PagoEnviadoModal titulo={aviso.titulo} monto={aviso.monto} texto={aviso.texto} onCerrar={() => setAviso(null)} />}
      </div>
    );
  }

  return (
    <>
      <div className="pk-pagos-grid">
        {pagina.visibles.map((p) => {
          const r = resumenPago(pagos, p.id, ronda, grupo, multas);
          const porRevisar = r.mios.filter((x) => x.estado === "revision").length;
          return (
            <div key={p.id} className={`pk-card pk-pago-card ${r.completo ? "completo" : ""}`}>
              <span className="pk-mini-turno" title={`Turno ${p.turno}`}>{p.turno}</span>
              <Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={64} />
              <strong className="pk-pago-nombre">{p.nombre}</strong>
              <small className="pk-pago-turno">Cobra {formatFecha(fechaRonda(grupo, p.turno))}</small>
              <Estado r={r} />
              <div className="pk-barra">
                <div className="pk-barra-ok" style={{ width: `${Math.min(100, (r.pagado / r.cuotaTotal) * 100)}%` }} />
                <div className="pk-barra-rev" style={{ width: `${Math.min(100 - (r.pagado / r.cuotaTotal) * 100, (r.revision / r.cuotaTotal) * 100)}%` }} />
              </div>
              <small className="pk-pago-monto">{money(r.pagado)} de {money(r.cuotaTotal)}</small>
              {r.multa > 0 ? <span className="pk-multa-tag">Multa {money(r.multa)}</span> : r.multaPropuesta > 0 ? <span className="pk-multa-tag por-confirmar">Multa por confirmar</span> : null}
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => { setVistaDet("ronda"); setAbiertas([]); setAbierto(p.id); }}>
                <FiEye /> Ver pagos{porRevisar > 0 ? ` (${porRevisar} por revisar)` : ""}
              </button>
            </div>
          );
        })}
      </div>
      <MostrarMas pagina={pagina} />

      {visor && <VisorImagen pago={visor} onCerrar={() => setVisor(null)} />}
      {registrando && <RegistrarPagoModal grupo={grupo} persona={registrando.persona} foto={fotos.get(registrando.persona.uid)} ronda={registrando.ronda} falta={registrando.falta} onCerrar={() => setRegistrando(null)} onListo={(monto) => { setAviso({ titulo: "¡Pago registrado!", monto, texto: `Se registró el pago de ${registrando.persona.nombre} de la ronda ${registrando.ronda}.` }); setRegistrando(null); }} />}
      {aviso && <PagoEnviadoModal titulo={aviso.titulo} monto={aviso.monto} texto={aviso.texto} onCerrar={() => setAviso(null)} />}
    </>
  );
};

PagosRonda.propTypes = {
  grupo: PropTypes.object.isRequired,
  ronda: PropTypes.number.isRequired,
  lista: PropTypes.array.isRequired,
  pagos: PropTypes.array.isRequired,
  multas: PropTypes.array,
  soloLectura: PropTypes.bool,
  abrirId: PropTypes.string,
};

export default PagosRonda;
