import React, { useState } from "react";
import PropTypes from "prop-types";
import { FiCheck, FiClock, FiDollarSign, FiCalendar, FiGift, FiPlay, FiImage, FiGrid, FiInfo, FiHome, FiAperture, FiEye, FiCreditCard, FiRefreshCw, FiEdit2 } from "react-icons/fi";
import { describirFrecuencia, esConfirmado, estadoGrupo, estaIniciado, resumenPago, fechaRonda, formatFecha, money, useColeccion } from "./pasanakuUtils";
import { iniciarPasanaku, pendientesInicio, puedeIniciar } from "./acciones";
import PagosRonda from "./PagosRonda";
import SelectorRonda from "./SelectorRonda";
import EntregarPozoHoja from "./EntregarPozoHoja";
import VisorImagen from "./VisorImagen";
import PanelCuentaPago from "./PanelCuentaPago";
import PodioOrden from "./PodioOrden";
import MatrizPagos from "./MatrizPagos";
import ResumenFinal from "./ResumenFinal";
import OrdenManual from "./OrdenManual";
import Avatar from "./Avatar";
import Portada from "./Portada";
import Panel from "./Panel";
import SorteoTurnos from "./SorteoTurnos";
import { usePerfiles } from "./perfiles";
import "./Pasanaku.css";

const Barra = ({ valor, total }) => (
  <div className="pk-barra"><div style={{ width: `${total ? Math.min(100, (valor / total) * 100) : 0}%` }} /></div>
);
Barra.propTypes = { valor: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

// Tablero de un pasanaku: lo importante arriba; el detalle largo (pagos, calendario, matriz) en ventanas
const DetalleGrupo = ({ grupo, onVolver, tabInicial = null, destino = null }) => {
  const { docs: participantes } = useColeccion("participantes", grupo.id);
  const { docs: pagos } = useColeccion("pagos", grupo.id);
  const { docs: entregas } = useColeccion("entregas", grupo.id);
  const { docs: multas } = useColeccion("multas", grupo.id);
  const [modal, setModal] = useState(tabInicial); // pagos | calendario | matriz | datos | ruleta | qr
  const [rondaPagos, setRondaPagos] = useState(destino?.ronda ?? null);
  const [entregando, setEntregando] = useState(null); // participante al que se le entrega el pozo
  const [verEntrega, setVerEntrega] = useState(null);
  const [modoOrden, setModoOrden] = useState("ruleta"); // ruleta | manual
  const [resorteando, setResorteando] = useState(false); // volver a girar la ruleta aunque el orden ya esté guardado
  const fotos = usePerfiles();

  const lista = [...participantes].sort((a, b) => a.turno - b.turno);
  const n = grupo.cupos || lista.length;
  const iniciado = estaIniciado(grupo);
  const finalizado = grupo.estado === "finalizado";
  const ronda = grupo.rondaActual;
  const enCurso = iniciado && !finalizado && ronda <= n;

  const pasosInicio = pendientesInicio(grupo, lista.length);
  const pagoDe = (pid, r) => resumenPago(pagos, pid, r, grupo, multas);
  const confirmados = pagos.filter(esConfirmado);
  const recaudado = confirmados.reduce((s, p) => s + (p.monto || 0), 0);
  const esperado = grupo.cuota * n * n; // cada ronda: n cuotas, n rondas
  const entregado = entregas.reduce((s, e) => s + (e.monto || 0), 0);

  const pagosRonda = pagos.filter((p) => p.ronda === ronda);
  const okRonda = lista.filter((p) => pagoDe(p.id, ronda).completo).length;
  const revRonda = pagosRonda.filter((p) => !esConfirmado(p)).length;
  const recaudoRonda = lista.reduce((s, p) => s + pagoDe(p.id, ronda).pagado, 0);
  const pendientes = lista.filter((p) => !pagoDe(p.id, ronda).completo);
  const recibe = lista.find((p) => p.turno === ronda);
  const anterior = lista.find((p) => p.turno === ronda - 1);
  const rondas = Array.from({ length: n }, (_, i) => i + 1);
  const ultima = fechaRonda(grupo, n);
  const verRonda = Math.min(rondaPagos ?? Math.min(ronda, n), Math.max(n, 1));

  // El pozo se entrega desde una ventana que pide el comprobante y registra quién lo hizo
  const cobradoDe = (r) => pagos.filter((x) => x.ronda === r && esConfirmado(x)).reduce((suma, x) => suma + (x.monto || 0), 0);
  const comprobanteEntrega = (e) => ({ comprobanteUrl: e.comprobanteUrl, monto: e.monto, fecha: e.fecha, estado: "entregado", verbo: "Entregado", leyenda: e.nota || "Entrega del pozo" });

  if (entregando) {
    return (
      <EntregarPozoHoja
        grupo={grupo} persona={entregando} foto={fotos.get(entregando.uid)}
        monto={cobradoDe(entregando.turno)} completos={lista.filter((q) => pagoDe(q.id, entregando.turno).completo).length}
        total={lista.length} totalRondas={n} onCerrar={() => setEntregando(null)}
      />
    );
  }

  return (
    <div className="pk-view">
      <Portada
        titulo={grupo.nombre}
        estado={estadoGrupo(grupo)}
        estadoClase={iniciado ? "ok" : ""}
        subtitulo={`${describirFrecuencia(grupo)} · termina ${formatFecha(ultima)}`}
        miembros={lista}
        fotos={fotos}
        datos={[
          { etiqueta: "Cuota", valor: money(grupo.cuota) },
          { etiqueta: "Pozo", valor: money(grupo.cuota * n) },
          { etiqueta: "Ronda", valor: iniciado ? (finalizado ? "Fin" : `${Math.min(ronda, n)} de ${n}`) : "—" },
        ]}
        pestanas={[
          { id: "resumen", texto: "Resumen", icono: <FiHome /> },
          ...(iniciado ? [{ id: "pagos", texto: "Pagos", icono: <FiDollarSign /> }] : []),
          ...(!iniciado && lista.length >= 2 ? [{ id: "ruleta", texto: "Turnos", icono: <FiAperture /> }] : []),
          { id: "calendario", texto: "Calendario", icono: <FiCalendar /> },
          ...(iniciado ? [{ id: "matriz", texto: "Quién pagó", icono: <FiGrid /> }] : []),
          { id: "qr", texto: "QR de pago", icono: <FiCreditCard /> },
          { id: "datos", texto: "Datos", icono: <FiInfo /> },
        ]}
        activa={modal || "resumen"}
        onTab={(id) => { setRondaPagos(null); setModal(id === "resumen" ? null : id); }}
        onVolver={onVolver}
        volverTexto="Pasanakus"
      />

      {!iniciado && !modal && (
        <div className="pk-card pk-preparacion">
          <div className="pk-preparacion-cab">
            <strong>Antes de iniciar</strong>
            <small>{pasosInicio.filter((p) => p.hecho).length} de {pasosInicio.length} listos</small>
          </div>
          <ul>
            {pasosInicio.map((p) => (
              <li key={p.id} className={p.hecho ? "hecho" : ""}>
                <span className="pk-paso-marca">{p.hecho ? <FiCheck /> : null}</span>
                <span className="pk-paso-texto">{p.texto}</span>
                {p.id === "orden" && !p.hecho && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => setModal("ruleta")}><FiAperture /> Definir el orden</button>}
                {p.id === "qr" && !p.hecho && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => setModal("qr")}><FiCreditCard /> Subir QR</button>}
              </li>
            ))}
          </ul>
          <button className="pk-btn pk-btn-inicio" onClick={() => iniciarPasanaku(grupo)} disabled={!puedeIniciar(grupo, lista.length)}><FiPlay /> Iniciar pasanaku</button>
          <small className="pkf-nota">Al iniciar ya no se podrán cambiar los participantes ni el orden.</small>
        </div>
      )}

      {finalizado && !modal && (
        <ResumenFinal grupo={grupo} lista={lista} pagos={pagos} entregas={entregas} n={n} fotos={fotos} onVerEntrega={(e) => setVerEntrega(comprobanteEntrega(e))} />
      )}

      {enCurso && !modal && (
        <>
          <div className="pk-hero">
            <div className="pk-hero-item pk-hero-listo">
              <span className="pk-etiqueta">Ya se pagó a</span>
              <strong>{anterior && <Avatar nombre={anterior.nombre} foto={fotos.get(anterior.uid)} tam={30} />} {anterior ? anterior.nombre : "Nadie todavía"}</strong>
              <small>{anterior ? `Ronda ${anterior.turno}` : "Es la primera ronda"}</small>
            </div>
            <div className="pk-hero-item pk-hero-ahora">
              <span className="pk-etiqueta">Ahora le toca a</span>
              <strong>{recibe ? <Avatar nombre={recibe.nombre} foto={fotos.get(recibe.uid)} tam={30} /> : <FiGift />} {recibe?.nombre || "—"}</strong>
              <small>Ronda {ronda} de {n} · {formatFecha(fechaRonda(grupo, ronda))}</small>
            </div>
            <div className="pk-hero-item">
              <span className="pk-etiqueta">Este mes completaron</span>
              <strong>{okRonda} de {lista.length}</strong>
              <small>Recaudado {money(recaudoRonda)} de {money(grupo.cuota * n)}</small>
            </div>
          </div>

          <div className="pk-dos-col">
            <div className="pk-card">
              <div className="pk-ronda-cab">
                <h3>Pagos de este mes</h3>
                <span className="pk-ronda-num"><strong>{okRonda}</strong> / {lista.length}</span>
              </div>
              <Barra valor={okRonda} total={lista.length} />
              {revRonda > 0 && <p className="pk-nota-linea"><span style={{ color: "#ffc107" }}>{revRonda} comprobante(s) por revisar</span></p>}
              <div className="pk-grupo-chips">
                <span className="pk-etiqueta">Faltan por pagar</span>
                <div>
                  {pendientes.length === 0 ? <small className="pkf-nota">¡Todos pagaron!</small> : pendientes.map((p) => (
                    <span key={p.id} className="pk-chip pk-chip-persona"><Avatar nombre={p.nombre} foto={fotos.get(p.uid)} tam={24} /> {p.nombre}{pagoDe(p.id, ronda).pagado > 0 ? ` · falta ${money(pagoDe(p.id, ronda).falta)}` : ""}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="pk-btn" onClick={() => { setRondaPagos(null); setModal("pagos"); }} style={{ marginTop: "0.75rem" }}>
                <FiImage /> Ver pagos y comprobantes{revRonda > 0 ? ` (${revRonda})` : ""}
              </button>
            </div>

            <div className="pk-card">
              <div className="pk-ronda-cab">
                <h3>Avance general</h3>
                <span className="pk-ronda-num"><strong>{entregas.length}</strong> / {n} entregas</span>
              </div>
              <Barra valor={entregas.length} total={n} />
              <p className="pk-nota-linea">
                Aportado: <strong>{money(recaudado)}</strong> de {money(esperado)}<br />
                Pozos entregados: <strong>{money(entregado)}</strong>
              </p>
              <p className="pk-nota-linea">{lista.length} de {n} participantes · pozo por ronda {money(grupo.cuota * n)}</p>
            </div>
          </div>
        </>
      )}

      {modal === "pagos" && (
        <Panel titulo="Pagos y comprobantes" subtitulo="Revisa cada foto, confirma o rechaza, o registra un pago recibido">
          <div className="pk-toolbar">
            <SelectorRonda valor={verRonda} total={Math.max(n, 1)} actual={Math.min(ronda, Math.max(n, 1))} onChange={setRondaPagos} fechaDe={(r) => formatFecha(fechaRonda(grupo, r))} />
          </div>
          <PagosRonda multas={multas} key={destino?.participanteId || "lista"} grupo={grupo} ronda={verRonda} lista={lista} pagos={pagos} abrirId={destino?.participanteId || null} />
        </Panel>
      )}

      {modal === "ruleta" && !iniciado && (
        grupo.ordenListo && !resorteando ? (
          <Panel titulo="Orden de cobro definido" subtitulo="Así quedó el orden en que se repartirá el pozo. Se puede cambiar mientras el pasanaku no inicie.">
            <PodioOrden items={lista.map((p) => ({ nombre: p.nombre, foto: fotos.get(p.uid) }))} />
            <div className="pk-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => { setModoOrden("manual"); setResorteando(true); }}><FiEdit2 /> Editar a mano</button>
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => { setModoOrden("ruleta"); setResorteando(true); }}><FiRefreshCw /> Volver a sortear</button>
            </div>
          </Panel>
        ) : (
          <Panel titulo="Definir el orden de cobro" subtitulo="Elige cómo repartir los turnos: con la ruleta del sistema, o a mano si ya lo sortearon de otra forma.">
            <div className="pk-segmento pk-modo-orden">
              <button type="button" className={modoOrden === "ruleta" ? "activo" : ""} onClick={() => setModoOrden("ruleta")}><FiAperture /> Con la ruleta</button>
              <button type="button" className={modoOrden === "manual" ? "activo" : ""} onClick={() => setModoOrden("manual")}><FiEdit2 /> A mano</button>
            </div>
            {modoOrden === "ruleta" ? (
              <SorteoTurnos key={lista.map((p) => p.id).join()} lista={lista} fotos={fotos} grupoId={grupo.id} onListo={() => setResorteando(false)} />
            ) : (
              <OrdenManual key={lista.map((p) => p.id).join()} lista={lista} fotos={fotos} grupoId={grupo.id} onListo={() => setResorteando(false)} />
            )}
          </Panel>
        )
      )}

      {modal === "calendario" && (
        <Panel titulo="Calendario de rondas">
          <div className="pk-tabla-wrap">
            <table className="pk-tabla">
              <thead><tr><th>Ronda</th><th>Fecha</th><th>Recibe</th><th>Aportes</th><th>Estado</th></tr></thead>
              <tbody>
                {rondas.map((r) => {
                  const p = lista.find((x) => x.turno === r);
                  const aportes = lista.filter((x) => pagoDe(x.id, r).completo).length;
                  const entregada = entregas.some((e) => e.ronda === r);
                  const actual = enCurso && r === ronda;
                  return (
                    <tr key={r} className={actual ? "pk-fila-actual" : ""}>
                      <td><span className="pk-turno">{r}</span></td>
                      <td>{formatFecha(fechaRonda(grupo, r))}</td>
                      <td>{p?.nombre || <span style={{ color: "var(--text-dim)" }}>Sin asignar</span>}</td>
                      <td>{iniciado ? `${aportes} / ${lista.length}` : "—"}</td>
                      <td>
                        {entregada ? (
                          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span className="pk-chip pk-chip-ok"><FiCheck /> Pozo entregado</span>
                            {entregas.find((e) => e.ronda === r)?.comprobanteUrl && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => setVerEntrega(comprobanteEntrega(entregas.find((e) => e.ronda === r)))}><FiEye /> Comprobante</button>}
                          </span>
                        )
                          : actual ? (
                            <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <span className="pk-chip pk-chip-rev"><FiClock /> En curso</span>
                              {p && <button type="button" className="pk-btn" onClick={() => setEntregando(p)}><FiGift /> Entregar pozo</button>}
                            </span>
                          )
                          : <span className="pk-chip">Pendiente</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {modal === "matriz" && (
        <Panel titulo="Quién pagó en cada ronda" subtitulo="Cada fila es una persona y cada columna una ronda. La ronda en curso está resaltada.">
          <MatrizPagos multas={multas} grupo={grupo} lista={lista} pagos={pagos} ronda={ronda} n={n} enCurso={enCurso} finalizado={finalizado} fotos={fotos} />
        </Panel>
      )}

      {verEntrega && <VisorImagen pago={verEntrega} onCerrar={() => setVerEntrega(null)} />}

      {modal === "qr" && (
        <Panel titulo="QR y datos de pago" subtitulo="Sube el QR de la cuenta donde cada participante debe depositar. Lo verán en este pasanaku al momento de pagar.">
          <PanelCuentaPago grupo={grupo} />
        </Panel>
      )}

      {modal === "datos" && (
        <Panel titulo="Datos del pasanaku">
          <ul className="pk-datos">
            <li><span>Frecuencia</span><strong>{describirFrecuencia(grupo)}</strong></li>
            <li><span>Primera ronda</span><strong>{formatFecha(fechaRonda(grupo, 1))}</strong></li>
            <li><span>Última ronda</span><strong>{formatFecha(ultima)}</strong></li>
            <li><span>Participantes</span><strong>{lista.length} de {n}</strong></li>
            <li><span>Cuota por persona</span><strong>{money(grupo.cuota)}</strong></li>
            <li><span>Total que aporta cada persona</span><strong>{money(grupo.cuota * n)}</strong></li>
            <li><span>Pozo por ronda</span><strong>{money(grupo.cuota * n)}</strong></li>
            <li><span>Multa por retraso</span><strong>{grupo.multa > 0 ? `${money(grupo.multa)}${grupo.diasGracia > 0 ? ` · ${grupo.diasGracia} día${grupo.diasGracia === 1 ? "" : "s"} de gracia` : ""}` : "Sin multa"}</strong></li>
            {grupo.creado && <li><span>Creado el</span><strong>{formatFecha(new Date(grupo.creado))}</strong></li>}
          </ul>
        </Panel>
      )}
    </div>
  );
};

DetalleGrupo.propTypes = {
  grupo: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
  tabInicial: PropTypes.string,
  destino: PropTypes.shape({ participanteId: PropTypes.string, ronda: PropTypes.number }),
};

export default DetalleGrupo;
