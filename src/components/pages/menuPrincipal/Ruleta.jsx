import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiX, FiRotateCw, FiTrash2, FiAward, FiSearch, FiLayers, FiRefreshCw } from "react-icons/fi";
import { useColeccion } from "./pasanakuUtils";
import Rueda from "./Rueda";
import ConfigAvanzada from "./ConfigAvanzada";
import GanadorModal from "./GanadorModal";
import PodioOrden from "./PodioOrden";
import BotonSonido from "./BotonSonido";
import { fanfarria, leerSonido, programarTicks } from "./sonido";
import { COLORES, estadoSorteo, prepararGiro } from "./ruedaUtils";
import "./Pasanaku.css";

let siguienteId = 1;
const nuevo = (nombre) => ({ id: siguienteId++, nombre });

// Separa por espacio, coma, punto, punto y coma o salto de línea. Lo que va entre comillas queda como un solo nombre.
const separarNombres = (texto) =>
  (texto.match(/"[^"]+"|[^\s,.;]+/g) || []).map((t) => t.replace(/"/g, "").trim()).filter(Boolean);

// Ruleta para sortear: se cargan los participantes de un pasanaku o se escriben nombres a mano
// `simple`: ruleta libre para cualquier persona (sin cargar pasanakus ni configuración avanzada); no toca ningún pasanaku
const Ruleta = ({ simple = false }) => {
  const { docs: grupos } = useColeccion("pasanakus", simple ? null : undefined);
  const { docs: participantes } = useColeccion("participantes", simple ? null : undefined);
  const [lista, setLista] = useState([]); // todos los nombres cargados
  const [salieron, setSalieron] = useState([]); // ids en el orden en que fueron saliendo
  const [fijas, setFijas] = useState([]); // lugares pedidos (configuración avanzada)
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargado, setCargado] = useState(null); // pasanaku del que se cargaron los nombres
  const [quitar, setQuitar] = useState(true); // sacar al ganador de la rueda (para sortear un orden)
  const [giro, setGiro] = useState(0);
  const [girando, setGirando] = useState(false);
  const [anuncio, setAnuncio] = useState(null); // quién acaba de salir (se muestra en grande)
  const [sonido, setSonido] = useState(leerSonido);
  const [pendiente, setPendiente] = useState(null);

  // Con "sacar al ganador" el sorteo va lugar por lugar; un lugar pedido hace girar la rueda hasta la persona que lo pidió
  const fijasOk = quitar ? fijas.filter((f) => f.pos <= lista.length && lista.some((o) => o.id === f.id)) : [];
  const estado = estadoSorteo(lista, fijasOk, salieron);
  const opciones = quitar ? estado.rueda : lista;
  const orden = quitar ? estado.orden : [];
  const historial = quitar ? orden.filter(Boolean) : salieron.map((id) => ({ id })).filter((o) => lista.some((x) => x.id === o.id));
  const terminado = quitar && lista.length >= 2 && estado.completo;
  const siguiente = estado.posicion;

  const nombreDe = (id) => lista.find((o) => o.id === id)?.nombre || "";

  const nuevos = useMemo(() => separarNombres(texto), [texto]);

  // Con muchos pasanakus solo se muestran las primeras coincidencias
  const resultados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return [];
    return grupos
      .filter((g) => (g.nombre || "").toLowerCase().includes(t))
      .slice(0, 6)
      .map((g) => ({ ...g, n: participantes.filter((p) => p.pasanakuId === g.id).length }));
  }, [busqueda, grupos, participantes]);

  const reiniciarResultados = () => { setAnuncio(null); setSalieron([]); setPendiente(null); };

  const agregar = (e) => {
    e.preventDefault();
    if (!nuevos.length) return;
    setLista((prev) => [...prev, ...nuevos.map(nuevo)]);
    setTexto("");
  };

  const cargarGrupo = (g) => {
    const miembros = participantes.filter((p) => p.pasanakuId === g.id).sort((a, b) => a.turno - b.turno);
    if (!miembros.length) return toast.error("Ese pasanaku aún no tiene participantes.");
    setLista(miembros.map((p) => nuevo(p.nombre)));
    setCargado(g);
    setBusqueda("");
    reiniciarResultados();
  };

  const vaciar = () => { setLista([]); setCargado(null); setFijas([]); reiniciarResultados(); };

  const renombrar = (id, nombre) => setLista((prev) => prev.map((o) => (o.id === id ? { ...o, nombre } : o)));
  const quitarOpcion = (id) => { setLista((prev) => prev.filter((o) => o.id !== id)); setSalieron((prev) => prev.filter((x) => x !== id)); setFijas((prev) => prev.filter((f) => f.id !== id)); };

  const girar = () => {
    if (girando || opciones.length < (quitar ? 1 : 2)) return;
    const forzado = quitar && estado.fija ? opciones.findIndex((o) => o.id === estado.fija.id) : undefined;
    const sorteables = opciones.map((o, i) => (o.reservado ? -1 : i)).filter((i) => i >= 0);
    const { idx, giro: nuevoGiro } = prepararGiro(opciones.length, giro, forzado, sorteables);
    setAnuncio(null);
    if (sonido) programarTicks(giro, nuevoGiro, opciones.length);
    setPendiente(opciones[idx]);
    setGirando(true);
    setGiro(nuevoGiro);
  };

  const terminar = () => {
    if (!girando) return;
    setGirando(false);
    if (sonido) fanfarria();
    setAnuncio({ nombre: pendiente.nombre, detalle: quitar ? `Lugar ${siguiente}${estado.fija ? "" : ""}` : "¡Salió!" });
    setSalieron((prev) => [...prev, pendiente.id]);
  };

  return (
    <div className="pk-view">
      {anuncio && !girando && <GanadorModal nombre={anuncio.nombre} detalle={anuncio.detalle} onCerrar={() => setAnuncio(null)} />}
      <div className="pk-header">
        <div>
          <h1>Ruleta</h1>
          <p>{simple ? "Escribe los nombres y gira. Es independiente de tus pasanakus." : "Para sortear turnos, premios o lo que quieras."}</p>
        </div>
      </div>

      <div className="pk-ruleta-layout">
        <div className="pk-card pk-ruleta-panel">
          {!simple && (
            <section className="pk-ruleta-seccion">
              <h4 className="pk-paso"><b>1</b> Cargar desde un pasanaku</h4>
              {cargado ? (
                <div className="pk-ruleta-cargado">
                  <FiLayers /> <strong>{cargado.nombre}</strong>
                  <button type="button" className="pk-icon" title="Quitar" onClick={vaciar} disabled={girando}><FiX /></button>
                </div>
              ) : (
                <div className="pk-ruleta-busca">
                  <label className="pk-buscar"><FiSearch /><input placeholder="Buscar pasanaku por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={girando} /></label>
                  {busqueda.trim() && (
                    <ul className="pk-ruleta-resultados">
                      {resultados.length === 0 ? <li className="pk-buscador-vacio">Ningún pasanaku coincide.</li> : resultados.map((g) => (
                        <li key={g.id}><button type="button" onClick={() => cargarGrupo(g)}><strong>{g.nombre}</strong><small>{g.n} participante{g.n === 1 ? "" : "s"}</small></button></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="pk-ruleta-seccion">
            <h4 className="pk-paso"><b>{simple ? 1 : 2}</b> {simple ? "Escribe los nombres" : "O escribir nombres"}</h4>
            <form onSubmit={agregar} className="pk-ruleta-agregar">
              <input placeholder="Ej: ana luis, mari. pepe" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={girando} />
              <button type="submit" className="pk-ruleta-mas" title="Agregar" disabled={girando || nuevos.length === 0}><FiPlus /></button>
            </form>
            {nuevos.length > 0
              ? <div className="pk-ruleta-previa">{nuevos.map((n, i) => <span key={i} className="pk-chip" style={{ cursor: "default" }}>{n}</span>)}</div>
              : <small className="pkf-nota">Separa con espacio, coma, punto o punto y coma. Para un nombre con espacio, ponlo entre comillas: &quot;Juan Pérez&quot;.</small>}
          </section>

          <section className="pk-ruleta-seccion">
            <div className="pk-ruleta-cab">
              <h4 className="pk-paso"><b>{simple ? 2 : 3}</b> En la ruleta <span className="pk-paso-cuenta">{lista.length}</span></h4>
              {lista.length > 0 && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={vaciar} disabled={girando}><FiTrash2 /> Vaciar</button>}
            </div>
            {lista.length === 0 ? <p className="pk-vacio">Aún no hay nombres.</p> : (
              <ul className="pk-ruleta-lista">
                {lista.map((o, i) => (
                  <li key={o.id} className={quitar && (estado.colocados.includes(o.id)) ? "ya-salio" : ""}>
                    <span className="pk-ruleta-punto" style={{ background: COLORES[i % COLORES.length] }} />
                    <input
                      value={o.nombre}
                      onChange={(e) => renombrar(o.id, e.target.value)}
                      onBlur={() => { if (!o.nombre.trim()) quitarOpcion(o.id); }}
                      disabled={girando}
                      aria-label="Nombre (editable)"
                    />
                    <button type="button" className="pk-icon" title="Quitar" onClick={() => quitarOpcion(o.id)} disabled={girando}><FiX /></button>
                  </li>
                ))}
              </ul>
            )}
            <small className="pkf-nota">Toca un nombre para corregirlo.</small>
          </section>

          <label className="pk-ruleta-check">
            <input type="checkbox" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} />
            Sacar de la ruleta a quien salga (para sortear un orden)
          </label>
          {!simple && quitar && lista.length >= 3 && (
            <ConfigAvanzada personas={lista} fijas={fijasOk} onCambio={setFijas} total={lista.length} bloqueado={salieron.length > 0 || girando} />
          )}
        </div>

        <div className="pk-card pk-ruleta-escena">
          <BotonSonido activo={sonido} onCambio={setSonido} />
          {lista.length < 2 ? (
            <div className="pk-ruleta-vacia">
              <span className="pk-ruleta-fantasma"><FiRotateCw /></span>
              <strong>Tu ruleta está vacía</strong>
              <p>Carga un pasanaku o escribe al menos 2 nombres para empezar.</p>
            </div>
          ) : terminado ? (
            <div className="pk-ruleta-fin">
              <span className="pk-trofeo"><FiAward /></span>
              <strong>¡Sorteo terminado!</strong>
              <p>Ya tienen lugar los {lista.length} participantes. Este es el orden:</p>
            </div>
          ) : (
            <>
              <Rueda opciones={opciones} giro={giro} girando={girando} onFin={terminar} onGirar={girar} desactivado={opciones.length < (quitar ? 1 : 2)} />
              <p className="pk-ruleta-leyenda">{girando ? "Girando..." : quitar && (salieron.length > 0 || fijasOk.length > 0) ? `Toca el centro para girar el lugar ${siguiente} (quedan ${opciones.filter((o) => !o.reservado).length})` : "Toca el centro para girar"}</p>
              {quitar && !estado.fija && opciones.filter((o) => !o.reservado).length === 1 && <small className="pkf-nota">Queda una sola persona para este lugar.</small>}
              {quitar && estado.fija && <small className="pkf-nota pk-aviso-pedido">  {siguiente} <strong>{nombreDe(estado.fija.id)}</strong></small>}
            </>
          )}

          {historial.length > 0 && (
            <div className="pk-ruleta-historial">
              <div className="pk-ruleta-cab">
                <span className="pk-etiqueta">Resultados en orden ({historial.length} de {lista.length})</span>
              </div>
              <PodioOrden
                items={quitar
                  ? orden.map((o) => (o ? { nombre: nombreDe(o.id), fijo: o.fijo } : { pendiente: true }))
                  : historial.map((o) => ({ nombre: nombreDe(o.id) }))}
              />
              <div className="pk-actions" style={{ justifyContent: "flex-start", marginTop: "1rem" }}>
                <button type="button" className="pk-btn" onClick={reiniciarResultados} disabled={girando}><FiRefreshCw /> Empezar de nuevo con estos nombres</button>
                <button type="button" className="pk-btn pk-btn-ghost" onClick={vaciar} disabled={girando}><FiTrash2 /> Vaciar todo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Ruleta.propTypes = { simple: PropTypes.bool };

export default Ruleta;
