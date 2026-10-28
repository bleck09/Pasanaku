import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { addDoc, collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiX, FiEye, FiPlay, FiSearch, FiClock, FiGift, FiCalendar, FiArrowLeft, FiSend } from "react-icons/fi";
import GrupoForm from "./GrupoForm";
import { confirmar } from "./Confirmar";
import PanelParticipantes from "./PanelParticipantes";
import DetalleGrupo from "./DetalleGrupo";
import EntregarPozoHoja from "./EntregarPozoHoja";
import { iniciarPasanaku, pendientesInicio, puedeIniciar } from "./acciones";
import { describirFrecuencia, esConfirmado, estadoGrupo, estaIniciado, fechaRonda, formatFecha, money, resumenPago, useColeccion } from "./pasanakuUtils";
import Avatar from "./Avatar";
import { usePerfiles } from "./perfiles";
import { portadaDe } from "./portadas";
import Cargando from "./Cargando";
import "./Pasanaku.css";

const VACIO = { nombre: "", cuota: "", cupos: 10, frecuencia: "mensual", diaSemana: 0, diaMes: 15, fechaInicio: "", multa: "", diasGracia: 0 };

const Grupos = ({ destino = null, onDestinoUsado = () => {} }) => {
  const { docs: grupos, cargando } = useColeccion("pasanakus");
  const { docs: participantes } = useColeccion("participantes");
  const { docs: pagos } = useColeccion("pagos");
  const { docs: multas } = useColeccion("multas");
  const [entregando, setEntregando] = useState(null); // { grupo, persona }
  const [form, setForm] = useState(null); // null = cerrado
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [visibles, setVisibles] = useState(24);
  const [editId, setEditId] = useState(null);
  const fotos = usePerfiles();
  const [panelId, setPanelId] = useState(null); // grupo cuyos participantes se están gestionando
  const grupoPanel = grupos.find((g) => g.id === panelId);
  const [detalleId, setDetalleId] = useState(destino?.grupoId || null); // grupo abierto en su tablero
  const [detalleTab, setDetalleTab] = useState(destino ? "pagos" : null); // pestaña con la que se abre el tablero
  const [destinoActivo, setDestinoActivo] = useState(destino); // persona y ronda a revisar al abrir el tablero
  const grupoDetalle = grupos.find((g) => g.id === detalleId);

  // Si ya estábamos en esta sección y llega un destino nuevo (desde la campana), lo abrimos
  useEffect(() => {
    if (!destino) return;
    setDestinoActivo(destino);
    setDetalleTab("pagos");
    setDetalleId(destino.grupoId);
    onDestinoUsado();
  }, [destino]);

  const orden = { "En curso": 0, "Armando": 1, "Finalizado": 2 };
  const filtrados = grupos
    .filter((g) => estado === "Todos" || estadoGrupo(g) === estado)
    .filter((g) => !q.trim() || (g.nombre || "").toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (orden[estadoGrupo(a)] - orden[estadoGrupo(b)]) || (a.nombre || "").localeCompare(b.nombre || ""));

  const abrirNuevo = () => { setEditId(null); setForm(VACIO); };
  const abrirEditar = (g) => {
    setEditId(g.id);
    setForm({ ...VACIO, nombre: g.nombre, cuota: g.cuota, cupos: g.cupos ?? participantes.filter((p) => p.pasanakuId === g.id).length, frecuencia: g.frecuencia, diaSemana: g.diaSemana ?? VACIO.diaSemana, diaMes: g.diaMes ?? VACIO.diaMes, fechaInicio: g.fechaInicio, multa: g.multa || "", diasGracia: g.diasGracia || 0 });
  };

  const guardar = async (e) => {
    e.preventDefault();
    const datos = { ...form, nombre: form.nombre.trim(), cuota: Number(form.cuota), cupos: Number(form.cupos), diaSemana: Number(form.diaSemana), diaMes: Number(form.diaMes) };
    datos.multa = Number(form.multa) > 0 ? Number(form.multa) : 0;
    datos.diasGracia = datos.multa > 0 ? Math.max(0, Math.min(30, Math.round(Number(form.diasGracia) || 0))) : 0;
    if (!datos.nombre || datos.cuota <= 0 || datos.cupos < 2 || !datos.fechaInicio) return toast.error("Completa todos los campos.");
    try {
      if (editId) {
        await updateDoc(doc(db, "pasanakus", editId), datos);
        toast.success("Pasanaku actualizado");
      } else {
        await addDoc(collection(db, "pasanakus"), { ...datos, rondaActual: 1, estado: "armando", iniciado: false, creado: Date.now() });
        toast.success("Pasanaku creado");
      }
      setForm(null);
    } catch {
      toast.error("No se pudo guardar.");
    }
  };

  const eliminar = async (g) => {
    const ok = await confirmar({
      titulo: `¿Eliminar "${g.nombre}"?`,
      mensaje: "Se borrarán también todos sus participantes, aportes y entregas. Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    try {
      const batch = writeBatch(db);
      for (const col of ["participantes", "pagos", "entregas"]) {
        const snap = await getDocs(query(collection(db, col), where("pasanakuId", "==", g.id)));
        snap.forEach((d) => batch.delete(d.ref));
      }
      batch.delete(doc(db, "pasanakus", g.id));
      await batch.commit();
      toast.success("Pasanaku eliminado");
    } catch {
      toast.error("No se pudo eliminar.");
    }
  };

  if (entregando) {
    const { grupo: eg, persona } = entregando;
    const delGrupo = participantes.filter((m) => m.pasanakuId === eg.id);
    const delGrupoPagos = pagos.filter((x) => x.pasanakuId === eg.id);
    return (
      <EntregarPozoHoja
        grupo={eg} persona={persona} foto={fotos.get(persona.uid)}
        monto={delGrupoPagos.filter((x) => x.ronda === persona.turno && esConfirmado(x)).reduce((suma, x) => suma + (x.monto || 0), 0)}
        completos={delGrupo.filter((m) => resumenPago(delGrupoPagos, m.id, persona.turno, eg, multas).completo).length}
        total={delGrupo.length} totalRondas={eg.cupos || delGrupo.length} onCerrar={() => setEntregando(null)}
      />
    );
  }

  if (grupoDetalle) return <DetalleGrupo key={`${grupoDetalle.id}-${detalleTab}-${destinoActivo?.participanteId || ""}-${destinoActivo?.ronda || ""}`} grupo={grupoDetalle} tabInicial={detalleTab} destino={destinoActivo} onVolver={() => { setDetalleId(null); setDetalleTab(null); setDestinoActivo(null); }} />;

  // Crear o editar: hoja aparte, sin la lista debajo
  if (form) {
    return (
      <div className="pk-view pk-hoja">
        <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setForm(null)} style={{ marginBottom: "1rem" }}><FiArrowLeft /> Pasanakus</button>
        <div className="pk-header">
          <div>
            <h1>{editId ? "Editar pasanaku" : "Nuevo pasanaku"}</h1>
            <p>{editId ? "Cambia los datos del grupo." : "Define la cuota, cuántas personas participan y cada cuánto se paga."}</p>
          </div>
        </div>
        <GrupoForm
          form={form}
          setForm={setForm}
          editando={Boolean(editId)}
          minCupos={editId ? participantes.filter((p) => p.pasanakuId === editId).length : 0}
          onSubmit={guardar}
          onCancelar={() => setForm(null)}
        />
      </div>
    );
  }

  return (
    <div className="pk-view">
      <div className="pk-header">
        <div>
          <h1>Pasanakus</h1>
          <p>Grupos de ahorro rotativo.</p>
        </div>
        <button className="pk-btn" onClick={abrirNuevo}><FiPlus /> Nuevo pasanaku</button>
      </div>

      {cargando ? <Cargando /> : grupos.length === 0 ? (
        <p className="pk-vacio">Aún no hay pasanakus. Crea el primero.</p>
      ) : (
        <>
        <div className="pk-barra-filtros">
          <label className="pk-buscar">
            <FiSearch />
            <input placeholder="Buscar pasanaku por nombre..." value={q} onChange={(e) => { setQ(e.target.value); setVisibles(24); }} />
          </label>
          <div className="pk-segmento">
            {["Todos", "En curso", "Armando", "Finalizado"].map((e) => (
              <button type="button" key={e} className={estado === e ? "activo" : ""} onClick={() => { setEstado(e); setVisibles(24); }}>
                {e} ({e === "Todos" ? grupos.length : grupos.filter((g) => estadoGrupo(g) === e).length})
              </button>
            ))}
          </div>
        </div>
        {filtrados.length === 0 && <p className="pk-vacio">Ningún pasanaku coincide.</p>}
        <div className="pk-galeria">
          {filtrados.slice(0, visibles).map((g) => {
            const miembros = participantes.filter((p) => p.pasanakuId === g.id).sort((x, y) => x.turno - y.turno);
            const n = miembros.length;
            const cupos = g.cupos ?? n;
            const curso = estaIniciado(g) && g.estado !== "finalizado";
            const recibe = curso ? miembros.find((m) => m.turno === g.rondaActual) : null;
            const fecha = curso ? fechaRonda(g, g.rondaActual) : null;
            const clase = g.estado === "finalizado" ? "" : estaIniciado(g) ? "ok" : "rev";
            return (
              <article key={g.id} className="pk-gcard">
                <div className="pk-gcard-portada" style={{ background: portadaDe(g.nombre) }}>
                  <span className="pk-gcard-circ" />
                  <div className="pk-gcard-chips">
                    <span className="pk-gchip"><FiClock /> {describirFrecuencia(g)}</span>
                    <span className={`pk-gchip estado ${clase}`}>{g.estado === "finalizado" ? "Finalizado" : estaIniciado(g) ? "En curso" : "Armando el grupo"}</span>
                  </div>
                  <h3>{g.nombre}</h3>
                </div>
                <div className="pk-gcard-cuerpo">
                  <div className="pk-gcard-datos">
                    <div><small>Cuota</small><strong>{money(g.cuota)}</strong></div>
                    <div><small>Pozo</small><strong>{money(g.cuota * cupos)}</strong></div>
                    <div><small>Ronda</small><strong>{!estaIniciado(g) ? "—" : g.rondaActual > cupos && n > 0 ? "Fin" : `${g.rondaActual} de ${cupos}`}</strong></div>
                  </div>
                  <p className="pk-gcard-linea"><FiUsers /> Participantes: <strong>{n} de {cupos}</strong></p>
                  {curso
                    ? <p className="pk-gcard-linea"><FiGift /> Cobra ahora: <strong>{recibe?.nombre || "—"}</strong>{fecha ? <> · <FiCalendar /> {formatFecha(fecha)}</> : null}</p>
                    : !estaIniciado(g) && <p className="pk-gcard-linea">{puedeIniciar(g, n) ? "Todo listo para iniciar." : `Falta: ${pendientesInicio(g, n).filter((x) => !x.hecho).map((x) => x.texto.replace(/ \(.*\)$/, "").toLowerCase()).join(", ")}.`}</p>}

                  <div className="pk-gcard-pie">
                    <div className="pk-portada-pila pk-pila-chica">
                      {miembros.slice(0, 5).map((m) => <Avatar key={m.id} nombre={m.nombre} foto={fotos.get(m.uid)} tam={28} className="pk-pila-av" />)}
                      {miembros.length > 5 && <span className="pk-pila-mas" style={{ width: 28, height: 28 }}>+{miembros.length - 5}</span>}
                    </div>
                    <div className="pk-gcard-iconos">
                      <button className="pk-icon" title={estaIniciado(g) ? "Ver participantes" : "Agregar participantes"} onClick={() => setPanelId(g.id)}><FiUsers /></button>
                      <button className="pk-icon" title="Editar" onClick={() => abrirEditar(g)}><FiEdit2 /></button>
                      <button className="pk-icon pk-danger" title="Eliminar" onClick={() => eliminar(g)}><FiTrash2 /></button>
                    </div>
                  </div>
                  <div className="pk-gcard-botones">
                    <button className="pk-btn" onClick={() => { setDetalleTab(null); setDetalleId(g.id); }}><FiEye /> Ver detalles</button>
                    {!estaIniciado(g) && (
                      <button className="pk-btn pk-btn-inicio" onClick={() => iniciarPasanaku(g)} disabled={!puedeIniciar(g, n)}><FiPlay /> Iniciar</button>
                    )}
                    {curso && recibe && (
                      <button className="pk-btn pk-btn-inicio" title={`Entregar el pozo a ${recibe.nombre}`} onClick={() => setEntregando({ grupo: g, persona: recibe })}><FiSend /> Pagar pozo</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {filtrados.length > visibles && (
          <div className="pk-mas"><button type="button" className="pk-btn pk-btn-ghost" onClick={() => setVisibles(visibles + 24)}>Mostrar más ({filtrados.length - visibles} restantes)</button></div>
        )}
        </>
      )}

      {grupoPanel && (
        <div className="pk-modal-fondo" onClick={() => setPanelId(null)}>
          <div className="pk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pk-modal-cab">
              <div>
                <h2>{grupoPanel.nombre}</h2>
                <p>Participantes y turnos</p>
              </div>
              <button className="pk-icon" title="Cerrar" onClick={() => setPanelId(null)}><FiX /></button>
            </div>
            <PanelParticipantes grupo={grupoPanel} onSortear={() => { setDetalleTab("ruleta"); setDetalleId(grupoPanel.id); setPanelId(null); }} />
          </div>
        </div>
      )}
    </div>
  );
};

Grupos.propTypes = {
  destino: PropTypes.shape({ grupoId: PropTypes.string, participanteId: PropTypes.string, ronda: PropTypes.number }),
  onDestinoUsado: PropTypes.func,
};

export default Grupos;
