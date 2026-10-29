import React, { useState } from "react";
import { useAtras } from "./atras";
import PropTypes from "prop-types";
import { idSesion } from "./sesion";
import { FiCheck, FiGift, FiClock, FiImage, FiFileText, FiDownload, FiLayers, FiPlay, FiAward, FiList, FiDollarSign, FiUsers, FiSearch, FiEye, FiGrid, FiCalendar, FiAlertTriangle } from "react-icons/fi";
import Cerdito3D from "../home/Cerdito3D";
import { describirFrecuencia, esConfirmado, estadoGrupo, estaIniciado, fechaRonda, fechaHora, formatFecha, limiteSinMulta, money, resumenPago, useColeccion } from "./pasanakuUtils";
import { esPdf } from "./imagenes";
import VisorImagen from "./VisorImagen";
import Comprobante from "./Comprobante";
import QRPagoModal from "./QRPagoModal";
import PagarHoja from "./PagarHoja";
import ResumenFinal from "./ResumenFinal";
import { useCuentaPago } from "./useCuentaPago";
import SelectorRonda from "./SelectorRonda";
import MostrarMas from "./MostrarMas";
import { usePaginado } from "./usePaginado";
import Avatar from "./Avatar";
import Portada from "./Portada";
import PagosRonda from "./PagosRonda";
import Panel from "./Panel";
import { usePerfiles } from "./perfiles";
import { portadaDe } from "./portadas";
import Cargando from "./Cargando";
import "./Pasanaku.css";

const diasPara = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((fecha - hoy) / 86400000);
};

const Barra = ({ confirmado, revision, total, grande }) => (
  <div className={`pk-barra ${grande ? "pk-barra-grande" : ""}`}>
    <div className="pk-barra-ok" style={{ width: `${Math.min(100, (confirmado / total) * 100)}%` }} />
    <div className="pk-barra-rev" style={{ width: `${Math.min(100 - (confirmado / total) * 100, (revision / total) * 100)}%` }} />
  </div>
);
Barra.propTypes = { confirmado: PropTypes.number, revision: PropTypes.number, total: PropTypes.number, grande: PropTypes.bool };

const Detalle = ({ grupo, uid, onVolver }) => {
  const { docs: participantes } = useColeccion("participantes", grupo.id);
  const { docs: pagos } = useColeccion("pagos", grupo.id);
  const { docs: entregas } = useColeccion("entregas", grupo.id);
  const { docs: multas } = useColeccion("multas", grupo.id);
  const [rondaMulta, setRondaMulta] = useState(null); // ronda cuya multa se está pagando
  const [modal, setModal] = useState(null); // pagar
  const [vista, setVista] = useState("resumen"); // resumen | orden | historial
  const [visor, setVisor] = useState(null);
  const [rondaVer, setRondaVer] = useState(null);
  const fotos = usePerfiles();
  const { cuenta: cuentaPago } = useCuentaPago(grupo.id);
  const [verQRPago, setVerQRPago] = useState(false);
  useAtras(Boolean(modal), () => setModal(null));
  useAtras(vista !== "resumen", () => setVista("resumen"));

  const lista = [...participantes].sort((a, b) => a.turno - b.turno);
  const total = lista.length;
  const n = grupo.cupos || total;
  const iniciado = estaIniciado(grupo);
  const finalizado = iniciado && grupo.rondaActual > n;
  const ronda = Math.min(grupo.rondaActual, Math.max(n, 1));
  const yo = lista.find((p) => p.uid === uid);
  const recibe = lista.find((p) => p.turno === ronda);
  const verRonda = Math.min(rondaVer ?? ronda, Math.max(n, 1));
  const fecha = fechaRonda(grupo, ronda);
  // Plazo para pagar mi cuota: la fecha de la ronda; si hay multa, el último día sin multa (con días de gracia)
  const limiteMs = limiteSinMulta(grupo, ronda);
  const plazo = grupo.multa > 0 && limiteMs ? new Date(limiteMs) : fecha;
  const diasPlazo = plazo ? diasPara(plazo) : null;

  const pago = (p, r = ronda) => resumenPago(pagos, p.id, r, grupo, multas);
  const mio = yo ? pago(yo) : null;
  const plazoEstado = mio?.completo ? "ok" : diasPlazo === null ? "" : diasPlazo < 0 ? "vencido" : diasPlazo <= 1 ? "urgente" : "";
  // Mis multas: por confirmar, confirmadas (pendientes o pagadas) y perdonadas. Una multa confirmada sin pagar de una ronda anterior bloquea los pagos nuevos.
  const misMultas = yo && grupo.multa > 0
    ? Array.from({ length: Math.min(ronda, Math.max(n, 1)) }, (_, i) => i + 1).map((rr) => ({ ronda: rr, r: pago(yo, rr) })).filter((x) => x.r.multa > 0 || x.r.multaPropuesta > 0 || x.r.multaPerdonada)
    : [];
  const bloqueo = misMultas.find((x) => x.ronda < ronda && x.r.multa > 0 && !x.r.completo) || null;
  const companeros = usePaginado(lista, "", 24); // siempre en orden de turno
  const siguienteRonda = ronda < n ? ronda + 1 : null; // se puede adelantar la cuota de la siguiente ronda
  const mioSig = yo && siguienteRonda ? pago(yo, siguienteRonda) : null;
  const pagaron = lista.filter((p) => pago(p).completo);
  const misPagos = yo ? pagos.filter((p) => p.participanteId === yo.id).sort((a, b) => (b.fecha || 0) - (a.fecha || 0)) : [];
  const enCurso = iniciado && !finalizado;

  // Pagar (la cuota, una multa o adelantar la siguiente ronda) es una hoja completa, no una ventana
  const hojaPago = modal === "pagarMulta" && yo && rondaMulta ? { ronda: rondaMulta, mio: pago(yo, rondaMulta) }
    : modal === "pagarSig" && yo && mioSig ? { ronda: siguienteRonda, mio: mioSig }
    : modal === "pagar" && mio ? { ronda, mio }
    : null;
  if (hojaPago) return <PagarHoja grupo={grupo} ronda={hojaPago.ronda} yo={yo} uid={uid} mio={hojaPago.mio} onCerrar={() => setModal(null)} />;

  return (
    <div className="pk-view">
      <Portada
        titulo={grupo.nombre}
        estado={estadoGrupo(grupo)}
        estadoClase={iniciado ? "ok" : ""}
        subtitulo={describirFrecuencia(grupo)}
        miembros={lista}
        fotos={fotos}
        datos={[
          { etiqueta: "Cuota", valor: money(grupo.cuota) },
          { etiqueta: "Pozo", valor: money(grupo.cuota * n) },
          { etiqueta: "Ronda", valor: iniciado ? (finalizado ? "Fin" : `${ronda} de ${n}`) : "—" },
        ]}
        pestanas={[
          { id: "resumen", texto: "Resumen", icono: <FiDollarSign /> },
          { id: "orden", texto: "Turnos", icono: <FiUsers /> },
          ...(iniciado ? [{ id: "pagos", texto: "Pagos", icono: <FiImage /> }] : []),
          ...(iniciado && yo && grupo.multa > 0 ? [{ id: "multas", texto: misMultas.length > 0 ? `Multas (${misMultas.length})` : "Multas", icono: <FiAlertTriangle /> }] : []),
          ...(yo && iniciado ? [{ id: "historial", texto: "Historial", icono: <FiList /> }] : []),
        ]}
        activa={vista}
        onTab={setVista}
        onVolver={onVolver}
        volverTexto="Mis pasanakus"
      />

      {!iniciado && (
        <p className="pk-aviso">Este pasanaku aún no inicia ({total}{grupo.cupos ? ` de ${grupo.cupos}` : ""} participantes). Cuando el administrador lo inicie verás aquí tu turno y podrás pagar.</p>
      )}
      {finalizado && vista === "resumen" && (
        <ResumenFinal
          grupo={grupo} lista={lista} pagos={pagos} entregas={entregas} n={n} fotos={fotos} uid={uid}
          onVerEntrega={(e) => setVisor({ comprobanteUrl: e.comprobanteUrl, monto: e.monto, fecha: e.fecha, estado: "entregado", verbo: "Entregado", leyenda: e.nota || "Entrega del pozo" })}
        />
      )}

      {enCurso && vista === "resumen" && (
        <>
          {bloqueo && (
            <div className="pk-alerta-multa">
              <FiAlertTriangle />
              <div><strong>Tienes una multa pendiente de {money(bloqueo.r.multa)}</strong><small>Ronda {bloqueo.ronda}. Págala para poder pagar tus siguientes cuotas.</small></div>
            </div>
          )}

          <div className="pk-resumen-cabeza">
            <div className="pk-hero-item pk-hero-ahora">
              <span className="pk-hero-icono"><FiGift /></span>
              <span className="pk-etiqueta">Ahora le toca a</span>
              <strong>{recibe && <Avatar nombre={recibe.nombre} foto={fotos.get(recibe.uid)} tam={40} />} {recibe?.nombre || "—"}{recibe?.uid === uid ? " (¡tú!)" : ""}</strong>
              <span className="pk-hero-recibe">{recibe?.uid === uid ? "Recibes" : "Recibe"} {money(grupo.cuota * n)}</span>
            </div>

            {yo && (
              <div className={`pk-plazo ${plazoEstado}`}>
                <span className="pk-plazo-icono">{mio.completo ? <FiCheck /> : <FiClock />}</span>
                <div className="pk-plazo-texto">
                  <span className="pk-etiqueta">{mio.completo ? "Tu cuota" : "Plazo para pagar tu cuota"}</span>
                  {mio.completo ? (
                    <strong>¡Ya pagaste esta ronda!</strong>
                  ) : mio.porPagar === 0 ? (
                    <strong>Tu pago está en revisión</strong>
                  ) : (
                    <>
                      <strong>Hasta el {formatFecha(plazo)}</strong>
                      <small>
                        {diasPlazo === null ? "" : diasPlazo < 0 ? `Venció hace ${-diasPlazo} día${diasPlazo === -1 ? "" : "s"}` : diasPlazo === 0 ? "Vence hoy" : diasPlazo === 1 ? "Vence mañana" : `Te quedan ${diasPlazo} días`}
                        {grupo.multa > 0 && (diasPlazo !== null && diasPlazo < 0 ? ` · se aplica multa de ${money(grupo.multa)}` : ` · después, multa de ${money(grupo.multa)}`)}
                      </small>
                    </>
                  )}
                </div>
                <span className="pk-plazo-cuenta">{pagaron.length}/{total}<small>pagaron</small></span>
              </div>
            )}
          </div>

          <div className="pk-seccion-cab">
            <h3 className="pk-seccion-tit">Participantes</h3>
            <div className="pk-seccion-acciones">
            {cuentaPago?.qr && <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setVerQRPago(true)}><FiDownload /> QR de pago</button>}
            {yo && (
              bloqueo ? (
                <button type="button" className="pk-btn pk-cta-fija pk-btn-peligro" onClick={() => { setRondaMulta(bloqueo.ronda); setModal("pagarMulta"); }}><FiAlertTriangle /> Pagar multa primero · {money(bloqueo.r.porPagar)}</button>
              ) : mio.porPagar > 0 ? (
                <button type="button" className="pk-btn pk-cta-fija" onClick={() => setModal("pagar")}><FiDollarSign /> Pagar mi cuota{mio.pagado > 0 ? ` · faltan ${money(mio.porPagar)}` : ""}</button>
              ) : !mio.completo ? (
                <span className="pk-chip pk-chip-rev"><FiClock /> Esperando confirmación del administrador</span>
              ) : siguienteRonda && mioSig && (
                mioSig.completo || mioSig.porPagar <= 0
                  ? <span className="pk-chip pk-chip-ok"><FiCheck /> Ya pagaste también la ronda {siguienteRonda}</span>
                  : <button type="button" className="pk-btn pk-btn-ghost pk-cta-fija" onClick={() => setModal("pagarSig")}><FiCalendar /> Adelantar la ronda {siguienteRonda}</button>
              )
            )}
            </div>
          </div>
          <div className="pk-companeros">
            {companeros.visibles.map((p) => {
              const soyYo = p.uid === uid;
              const r = soyYo ? mio : pago(p);
              return (
                <div key={p.id} className={`pk-mini-persona ${p.turno < grupo.rondaActual ? "cobro-listo" : p.turno === grupo.rondaActual ? "cobro-ahora" : "cobro-falta"} ${soyYo ? "yo" : ""}`}>
                  <span className="pk-mini-turno" title={`Turno ${p.turno}`}>{p.turno}</span>
                  {soyYo && <span className="pk-mini-tu">Tú</span>}
                  <span className={`pk-av-anillo ${r.completo ? "ok" : r.pagado > 0 || r.revision > 0 ? "parte" : "nada"}`} style={{ "--pct": `${Math.min(100, Math.round(((r.pagado + r.revision) / r.cuotaTotal) * 100))}%` }}>
                    <Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={58} />
                  </span>
                  <strong>{p.nombre}</strong>
                  <span className={`pk-cobra-linea ${p.turno < grupo.rondaActual ? "listo" : p.turno === grupo.rondaActual ? "ahora" : ""}`}>
                    <FiGift /> {p.turno < grupo.rondaActual ? "Ya cobró" : p.turno === grupo.rondaActual ? "Cobra ahora" : `Cobra ${formatFecha(fechaRonda(grupo, p.turno))}`}
                  </span>
                  <span className={`pk-pago-pastilla ${r.completo ? "ok" : r.pagado > 0 ? "parte" : r.revision > 0 ? "rev" : ""}`}>
                    {r.completo ? <><FiCheck /> {soyYo ? "Pagaste" : "Pagó"}</>
                      : r.pagado > 0 ? <>{Math.round((r.pagado / r.cuotaTotal) * 100)}% pagado</>
                      : r.revision > 0 ? <><FiClock /> En revisión</>
                      : <>{soyYo ? "Sin pagar" : "Sin pagar"}</>}
                    <b>{money(r.pagado)}</b>
                  </span>
                  {r.multa > 0 ? <span className="pk-multa-tag">Multa {money(r.multa)}</span> : r.multaPropuesta > 0 ? <span className="pk-multa-tag por-confirmar">Multa por confirmar</span> : null}
                </div>
              );
            })}
          </div>
          <MostrarMas pagina={companeros} />
        </>
      )}

      {verQRPago && cuentaPago && <QRPagoModal cuenta={cuentaPago} nombreGrupo={grupo.nombre} onCerrar={() => setVerQRPago(false)} />}

      {vista === "orden" && (
        <Panel titulo="Orden de cobro" subtitulo={iniciado ? "Quién cobra y cuándo. Cada pozo entregado queda aquí con su comprobante, para que todos lo vean." : "Orden de turnos del pasanaku."}>
          {iniciado && yo && entregas.find((e) => e.participanteId === yo.id) && (() => {
            const mia = entregas.find((e) => e.participanteId === yo.id);
            return (
              <div className="pk-mi-cobro">
                <FiGift />
                <div><strong>Recibiste {money(mia.monto)}</strong><small>Ronda {mia.ronda} · {fechaHora(mia.fecha)}</small></div>
                {mia.comprobanteUrl && <button type="button" className="pk-btn" onClick={() => setVisor({ comprobanteUrl: mia.comprobanteUrl, monto: mia.monto, fecha: mia.fecha, estado: "entregado", verbo: "Entregado", leyenda: mia.nota || "Entrega del pozo" })}><FiEye /> Ver mi comprobante</button>}
              </div>
            );
          })()}
          {iniciado && (
          <div className="pk-entregas-progreso">
            <span><strong>{entregas.length}</strong> de {lista.length} pozos entregados</span>
            <Barra confirmado={entregas.length} revision={0} total={Math.max(lista.length, 1)} />
          </div>
          )}
          <div className="pk-orden">
            {lista.map((p) => {
              const e = entregas.find((x) => x.participanteId === p.id);
              const ahora = iniciado && !e && !finalizado && p.turno === grupo.rondaActual;
              const abrirComprobante = () => setVisor({ comprobanteUrl: e.comprobanteUrl, monto: e.monto, fecha: e.fecha, estado: "entregado", verbo: "Entregado", leyenda: e.nota || "Entrega del pozo" });
              return (
                <div key={p.id} className={`pk-orden-item pk-entrega-item ${e ? "pagada" : ahora ? "ahora" : "pendiente"} ${p.uid === uid ? "yo" : ""}`}>
                  <span className="pk-turno">{e ? <FiCheck /> : p.turno}</span>
                  <Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={38} />
                  <div className="pk-orden-info">
                    <strong>{p.nombre}{p.uid === uid ? " (tú)" : ""}</strong>
                    {e ? (
                      <>
                        <span className="pk-entrega-monto">{money(e.monto)}</span>
                        <small>{fechaHora(e.fecha)}</small>
                      </>
                    ) : <small>{ahora ? "Cobra ahora · " : "Le toca el "}{formatFecha(fechaRonda(grupo, p.turno))}</small>}
                  </div>
                  {e ? (
                    <span className="pk-entrega-der">
                      <span className="pk-chip pk-chip-ok"><FiCheck /> Pagado</span>
                      {e.comprobanteUrl && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini pk-btn-ojo" title="Ver comprobante" aria-label="Ver comprobante" onClick={abrirComprobante}><FiEye /><span className="pk-txt-ancho"> Comprobante</span></button>}
                    </span>
                  ) : ahora ? <span className="pk-chip pk-chip-rev"><FiGift /> Cobra ahora</span> : iniciado ? <span className="pk-chip"><FiClock /> Pendiente</span> : null}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {vista === "multas" && iniciado && yo && (
        <Panel titulo="Mis multas" subtitulo={`Multa por retraso: ${money(grupo.multa)}${grupo.diasGracia > 0 ? ` · ${grupo.diasGracia} día${grupo.diasGracia === 1 ? "" : "s"} de gracia` : ""}. El administrador confirma cada una.`}>
          {misMultas.length === 0 ? <p className="pk-vacio">No tienes multas. ¡Sigue pagando a tiempo!</p> : (
            <div className="pk-multas-lista">
              {[...misMultas].reverse().map(({ ronda: rr, r }) => {
                const estado = r.multa > 0 ? (r.completo ? "pagada" : "pendiente") : r.multaPerdonada ? "perdonada" : "revision";
                return (
                  <div key={rr} className={`pk-multa-fila ${estado}`}>
                    <span className="pk-turno">{rr}</span>
                    <div className="pk-multa-info">
                      <strong>Ronda {rr} · {formatFecha(fechaRonda(grupo, rr))}</strong>
                      <small>{estado === "revision" ? `Multa por retraso de ${money(r.multaPropuesta)}: falta que el administrador la confirme.` : estado === "perdonada" ? "El administrador perdonó esta multa." : estado === "pagada" ? `Multa de ${money(r.multa)} pagada.` : `Multa de ${money(r.multa)} confirmada: pendiente de pago.`}</small>
                    </div>
                    {estado === "pendiente" ? <button type="button" className="pk-btn pk-btn-mini pk-btn-peligro" onClick={() => { setRondaMulta(rr); setModal("pagarMulta"); }}>Pagar multa</button>
                      : <span className={`pk-chip ${estado === "pagada" ? "pk-chip-ok" : estado === "revision" ? "pk-chip-rev" : ""}`}>{estado === "pagada" ? <><FiCheck /> Pagada</> : estado === "perdonada" ? "Perdonada" : <><FiClock /> Por confirmar</>}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {vista === "pagos" && iniciado && (
        <Panel titulo="Pagos de todos" subtitulo="Mira quién pagó y su comprobante en cada ronda. Solo lectura: los pagos los confirma el administrador.">
          <div className="pk-toolbar">
            <SelectorRonda valor={verRonda} total={Math.max(n, 1)} actual={Math.min(ronda, Math.max(n, 1))} onChange={setRondaVer} fechaDe={(r) => formatFecha(fechaRonda(grupo, r))} />
          </div>
          <PagosRonda grupo={grupo} ronda={verRonda} lista={lista} pagos={pagos} multas={multas} soloLectura />
        </Panel>
      )}

      {vista === "historial" && (
        <Panel titulo="Mi historial de pagos">
          {misPagos.length === 0 ? <p className="pk-vacio">Todavía no has enviado ningún pago.</p> : (
            <>
            <div className="pk-pagos-movil">
              <div className="pk-pagos-resumen">
                <div><span>Aportado</span><strong>{money(misPagos.filter(esConfirmado).reduce((suma, x) => suma + (x.monto || 0), 0))}</strong></div>
                <div><span>Pagos</span><strong>{misPagos.length}</strong></div>
                <div><span>En revisión</span><strong>{misPagos.filter((x) => !esConfirmado(x)).length}</strong></div>
              </div>
              <div className="pk-lista-movil">
                {misPagos.map((p) => (
                  <button key={p.id} type="button" className="pk-fila-movil pk-fila-pago" onClick={() => setVisor(p)}>
                    {p.comprobanteUrl && !esPdf(p.comprobanteUrl) ? <img src={p.comprobanteUrl} alt="" className="pk-fila-mini" /> : <span className="pk-fila-mini pk-fila-mini-icono">{p.comprobanteUrl ? <FiFileText /> : <FiImage />}</span>}
                    <span className="pk-fila-info">
                      <strong>{money(p.monto)}</strong>
                      <small>Ronda {p.ronda} · {fechaHora(p.fecha)}</small>
                    </span>
                    {p.estado === "revision" ? <span className="pk-chip pk-chip-rev"><FiClock /> Revisión</span> : <span className="pk-chip pk-chip-ok"><FiCheck /> Confirmado</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="pk-tabla-wrap pk-vista-escritorio">
              <table className="pk-tabla">
                <thead><tr><th>Ronda</th><th>Fecha</th><th>Monto</th><th>Estado</th><th>Comprobante</th></tr></thead>
                <tbody>
                  {misPagos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.ronda}</td>
                      <td>{formatFecha(p.fecha ? new Date(p.fecha) : null)}</td>
                      <td>{money(p.monto)}</td>
                      <td>{p.estado === "revision" ? <span className="pk-chip pk-chip-rev"><FiClock /> En revisión</span> : <span className="pk-chip pk-chip-ok"><FiCheck /> Confirmado</span>}</td>
                      <td>
                        {p.comprobanteUrl ? (
                          <Comprobante pago={p} onVer={setVisor} />
                        ) : <span style={{ color: "var(--text-dim)" }}><FiImage /> Registrado por el administrador</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Panel>
      )}
      {visor && <VisorImagen pago={visor} onCerrar={() => setVisor(null)} />}
    </div>
  );
};

Detalle.propTypes = {
  grupo: PropTypes.object.isRequired,
  uid: PropTypes.string.isRequired,
  onVolver: PropTypes.func,
};

const FILTROS = [["todos", "Todos"], ["curso", "En curso"], ["armando", "Por iniciar"], ["fin", "Finalizados"]];
const ICONOS_FILTRO = { todos: <FiLayers />, curso: <FiPlay />, armando: <FiClock />, fin: <FiAward /> };

const MisPasanakus = () => {
  const uid = idSesion();
  const { docs: mias, cargando: c1 } = useColeccion("participantes", uid || null, "uid");
  const { docs: grupos, cargando: c2 } = useColeccion("pasanakus");
  const { docs: todos } = useColeccion("participantes");
  const fotos = usePerfiles();
  const [abiertoId, setAbiertoId] = useState(null);
  useAtras(Boolean(abiertoId), () => setAbiertoId(null));
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modo, setModo] = useState("tarjetas");

  const misGrupos = grupos.filter((g) => mias.some((m) => m.pasanakuId === g.id));
  // Siempre se muestra la lista y se entra al pasanaku tocándolo (también cuando solo hay uno)
  const seleccionado = misGrupos.find((g) => g.id === abiertoId);

  const etapa = (g) => (g.estado === "finalizado" ? "fin" : estaIniciado(g) ? "curso" : "armando");
  const texto = q.trim().toLowerCase();
  const visibles = misGrupos.filter((g) => (filtro === "todos" || etapa(g) === filtro) && (!texto || g.nombre.toLowerCase().includes(texto)));
  const pagina = usePaginado(visibles, `${filtro}|${texto}`);

  if (c1 || c2) return <Cargando />;

  if (seleccionado) {
    return <Detalle grupo={seleccionado} uid={uid} onVolver={() => setAbiertoId(null)} />;
  }

  const cuenta = (f) => (f === "todos" ? misGrupos.length : misGrupos.filter((g) => etapa(g) === f).length);
  // Una ficha por cada pasanaku en curso: cuándo me toca cobrar a mí (primero el más cercano; los que ya cobré, al final)
  const misCobros = misGrupos
    .filter((g) => etapa(g) === "curso")
    .map((g) => {
      const miembros = todos.filter((m) => m.pasanakuId === g.id);
      const yo = miembros.find((m) => m.uid === uid);
      if (!yo) return null;
      const fecha = fechaRonda(g, yo.turno);
      return {
        g, yo, fecha, dias: diasPara(fecha),
        ahora: yo.turno === g.rondaActual,
        yaCobre: yo.turno < g.rondaActual,
        recibe: miembros.find((m) => m.turno === g.rondaActual),
      };
    })
    .filter(Boolean)
    .sort((x, y) => (x.yaCobre - y.yaCobre) || ((x.fecha || 0) - (y.fecha || 0)));
  const rondaDe = (g) => (!estaIniciado(g) ? "—" : g.estado === "finalizado" ? "Terminó" : `${g.rondaActual}${g.cupos ? ` de ${g.cupos}` : ""}`);
  const etiquetaEstado = (g) => (estadoGrupo(g) === "Armando" ? "Aún no inicia" : estadoGrupo(g));
  const claseEstado = (g) => (etapa(g) === "curso" ? "ok" : etapa(g) === "armando" ? "rev" : "");

  return (
    <div className="pk-view">
      {misGrupos.length === 0 ? (
        <p className="pk-vacio">Todavía no estás en ningún pasanaku. Pídele al administrador que te agregue.</p>
      ) : (
        <>
          <div className="pk-resumen-general">
            <span>Resumen general</span>
            <strong>{cuenta("curso")}</strong>
            <small>Pasanaku{cuenta("curso") === 1 ? "" : "s"} activo{cuenta("curso") === 1 ? "" : "s"}</small>
            <div className="pk-resumen-general-cerdo" aria-hidden="true"><Cerdito3D /></div>
          </div>

          <div className="pk-categorias">
            {FILTROS.map(([id, etiqueta]) => (
              <button key={id} type="button" className={`pk-categoria ${filtro === id ? "activa" : ""} c-${id}`} onClick={() => setFiltro(id)}>
                <span className="pk-categoria-circulo">{ICONOS_FILTRO[id]}<b>{cuenta(id)}</b></span>
                <small>{etiqueta}</small>
              </button>
            ))}
          </div>

          <div className="pk-barra-filtros">
            <label className="pk-buscar"><FiSearch /><input placeholder="Buscar pasanaku..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <div className="pk-segmento pk-solo-escritorio">
              {FILTROS.map(([id, etiqueta]) => <button key={id} type="button" className={filtro === id ? "activo" : ""} onClick={() => setFiltro(id)}>{etiqueta} ({cuenta(id)})</button>)}
            </div>
            <div className="pk-segmento pk-solo-escritorio">
              <button type="button" className={modo === "tarjetas" ? "activo" : ""} onClick={() => setModo("tarjetas")}><FiGrid /> Tarjetas</button>
              <button type="button" className={modo === "tabla" ? "activo" : ""} onClick={() => setModo("tabla")}><FiList /> Tabla</button>
            </div>
          </div>

          <h3 className="pk-lista-titulo">Mis pasanakus ({visibles.length})</h3>
          {visibles.length === 0 ? <p className="pk-vacio">Ningún pasanaku coincide con la búsqueda.</p> : modo === "tabla" ? (
            <div className="pk-card pk-tabla-wrap pk-vista-escritorio">
              <table className="pk-tabla">
                <thead><tr><th>Pasanaku</th><th>Estado</th><th>Frecuencia</th><th>Cuota</th><th>Ronda</th><th /></tr></thead>
                <tbody>
                  {pagina.visibles.map((g) => (
                    <tr key={g.id}>
                      <td><strong>{g.nombre}</strong></td>
                      <td><span className={`pk-chip ${claseEstado(g) ? `pk-chip-${claseEstado(g)}` : ""}`}>{etiquetaEstado(g)}</span></td>
                      <td>{describirFrecuencia(g)}</td>
                      <td>{money(g.cuota)}</td>
                      <td>{rondaDe(g)}</td>
                      <td><button className="pk-btn pk-btn-mini" onClick={() => setAbiertoId(g.id)}><FiEye /> Ver detalles</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pk-galeria">
              {pagina.visibles.map((g) => {
                const miembros = todos.filter((m) => m.pasanakuId === g.id).sort((x, y) => x.turno - y.turno);
                const n = g.cupos || miembros.length;
                const recibe = etapa(g) === "curso" ? miembros.find((m) => m.turno === g.rondaActual) : null;
                const fecha = etapa(g) === "curso" ? fechaRonda(g, g.rondaActual) : null;
                const cobro = misCobros.find((c) => c.g.id === g.id);
                return (
                  <article key={g.id} className="pk-gcard">
                    <div className="pk-gcard-portada" style={{ background: portadaDe(g.nombre) }}>
                      <span className="pk-gcard-circ" />
                      <div className="pk-gcard-chips">
                        <span className="pk-gchip"><FiClock /> {describirFrecuencia(g)}</span>
                        <span className={`pk-gchip estado ${claseEstado(g)}`}>{etiquetaEstado(g)}</span>
                      </div>
                      <h3>{g.nombre}</h3>
                    </div>
                    <div className="pk-gcard-cuerpo">
                      <div className="pk-gcard-datos">
                        <div><small>Cuota</small><strong>{money(g.cuota)}</strong></div>
                        <div><small>Pozo</small><strong>{money(g.cuota * n)}</strong></div>
                        <div><small>Ronda</small><strong>{rondaDe(g)}</strong></div>
                      </div>
                      <p className="pk-gcard-linea"><FiUsers /> Participantes: <strong>{miembros.length} de {n}</strong></p>
                      <p className="pk-gcard-linea"><FiGift /> {recibe ? <>Cobra ahora: <strong>{recibe.nombre}</strong>{fecha ? <> · <FiCalendar /> {formatFecha(fecha)}</> : null}</> : etapa(g) === "armando" ? "Esperando que el administrador inicie" : "Pasanaku terminado"}</p>
                      {cobro && (
                        <p className={`pk-gcard-linea pk-gcard-mio ${cobro.ahora ? "ahora" : cobro.yaCobre ? "listo" : ""}`}>
                          <FiClock /> {cobro.ahora ? "Te toca cobrar ahora" : cobro.yaCobre ? `Ya cobraste el ${formatFecha(cobro.fecha)}` : <>Tú cobras el <strong>{formatFecha(cobro.fecha)}</strong></>}
                          {!cobro.yaCobre && !cobro.ahora && cobro.dias !== null && cobro.dias >= 0 && <span className="pk-gcard-dias">{cobro.dias === 0 ? "Es hoy" : `Faltan ${cobro.dias} día${cobro.dias === 1 ? "" : "s"}`}</span>}
                        </p>
                      )}
                      {g.multa > 0 && <p className="pk-gcard-linea pk-gcard-multa"><FiAlertTriangle /> Multa {money(g.multa)}{g.diasGracia > 0 ? ` · ${g.diasGracia} día${g.diasGracia === 1 ? "" : "s"} de gracia` : ""}</p>}
                      {estaIniciado(g) && g.cupos ? <span className="pk-fila-avance"><span style={{ width: `${Math.min(100, ((g.estado === "finalizado" ? g.cupos : g.rondaActual - 1) / g.cupos) * 100)}%` }} /></span> : null}
                      <div className="pk-gcard-pie">
                        <div className="pk-portada-pila pk-pila-chica">
                          {miembros.slice(0, 5).map((m) => <Avatar key={m.id} nombre={m.nombre} foto={fotos.get(m.uid)} tam={28} className="pk-pila-av" />)}
                          {miembros.length > 5 && <span className="pk-pila-mas" style={{ width: 28, height: 28 }}>+{miembros.length - 5}</span>}
                        </div>
                        <button className="pk-btn" onClick={() => setAbiertoId(g.id)}><FiEye /> Ver detalles</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <MostrarMas pagina={pagina} />
        </>
      )}
    </div>
  );
};

export default MisPasanakus;
