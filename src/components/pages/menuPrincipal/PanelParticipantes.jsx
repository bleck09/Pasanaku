import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { FiPlus, FiTrash2, FiAperture, FiArrowUp, FiArrowDown, FiPlay, FiRefreshCw, FiCopy, FiKey, FiSearch } from "react-icons/fi";
import { estaIniciado, useColeccion } from "./pasanakuUtils";
import {
  conPaso, crearCuentaJugador, generarClave, iniciarPasanaku, mensajeErrorCuenta,
  normalizarUsuario, pendientesInicio, puedeIniciar, sugerirUsuario,
} from "./acciones";
import Credenciales from "./Credenciales";
import MostrarMas from "./MostrarMas";
import { usePaginado } from "./usePaginado";
import ResetClaveModal from "./ResetClaveModal";
import { confirmar } from "./Confirmar";
import Cargando from "./Cargando";
import "./Pasanaku.css";

// Gestión de los integrantes de un pasanaku (se usa en la sección Participantes y en la tarjeta del grupo)
const PanelParticipantes = ({ grupo, onSortear }) => {
  const { docs, cargando } = useColeccion("participantes", grupo.id);
  const { docs: jugadores } = useColeccion("jugadores");
  const { docs: cuentas } = useColeccion("usuario"); // cuentas con correo (administrador)
  const { docs: temporales } = useColeccion("temporales"); // contraseñas temporales aún no cambiadas (solo las ve el administrador)
  const [modo, setModo] = useState("existente"); // existente | nueva
  const [buscarPersona, setBuscarPersona] = useState("");
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [usuarioEditado, setUsuarioEditado] = useState(false);
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);
  const [resetPara, setResetPara] = useState(null);

  const lista = [...docs].sort((a, b) => a.turno - b.turno);
  // Todas las personas que ya existen y todavía no están en este pasanaku
  const personas = [
    ...jugadores.map((j) => ({ id: j.id, nombre: j.nombre, usuario: j.usuario || j.id, rol: "Jugador" })),
    ...cuentas.filter((c) => c.rol?.toLowerCase() === "administrador").map((c) => ({ id: c.id, nombre: c.nombre, usuario: c.correo || c.email, rol: "Administrador" })),
  ];
  const miId = auth.currentUser?.uid;
  const disponibles = personas
    .filter((u) => !docs.some((p) => p.uid === u.id))
    .filter((u) => !buscarPersona.trim() || [u.nombre, u.usuario].some((t) => (t || "").toLowerCase().includes(buscarPersona.trim().toLowerCase())))
    .sort((a, b) => (b.id === miId) - (a.id === miId) || (a.nombre || "").localeCompare(b.nombre || ""));
  const paginaPersonas = usePaginado(disponibles, buscarPersona, 12);
  const bloqueado = estaIniciado(grupo); // ya empezó: no se agrega, quita ni reordena
  const faltan = grupo.cupos ? grupo.cupos - lista.length : 0;
  const listoParaIniciar = !bloqueado && puedeIniciar(grupo, lista.length);
  const tieneAcceso = (p) => Boolean(p.uid) && personas.some((x) => x.id === p.uid);
  const sinCuenta = lista.filter((p) => !tieneAcceso(p)).length;

  // Agrega a alguien que ya tiene cuenta (jugador o administrador, incluido tú) sin crear nada nuevo
  const agregarExistente = async (persona) => {
    if (grupo.cupos && lista.length >= grupo.cupos) return toast.error(`Este pasanaku es de ${grupo.cupos} participantes y ya está completo.`);
    const ok = await confirmar({ titulo: `¿Agregar a ${persona.nombre}?`, mensaje: `Entrará a "${grupo.nombre}" como participante ${lista.length + 1}${grupo.cupos ? ` de ${grupo.cupos}` : ""}.`, textoConfirmar: "Sí, agregar" });
    if (!ok) return;
    setGuardando(true);
    try {
      await conPaso("participantes", () => addDoc(collection(db, "participantes"), {
        pasanakuId: grupo.id, nombre: persona.nombre, telefono: "", uid: persona.id, turno: lista.length + 1,
      }));
      marcarOrden(false);
      toast.success(`${persona.nombre} se agregó al pasanaku`);
    } catch (err) {
      toast.error(mensajeErrorCuenta(err));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarNombre = (valor) => {
    setNombre(valor);
    if (!usuarioEditado) setUsuario(sugerirUsuario(valor, jugadores));
  };

  const limpiar = () => {
    setNombre(""); setUsuario(""); setUsuarioEditado(false); setClave(""); setTelefono("");
  };

  const agregar = async (e) => {
    e.preventDefault();
    if (grupo.cupos && lista.length >= grupo.cupos) return toast.error(`Este pasanaku es de ${grupo.cupos} participantes y ya está completo.`);
    setGuardando(true);
    try {
      const nombreFinal = nombre.trim();
      const cuenta = await crearCuentaJugador({ nombre: nombreFinal, usuario, clave });
      const uid = cuenta.uid;
      const nuevas = { nombre: nombreFinal, usuario: cuenta.usuario, clave };

      await conPaso("participantes", () => addDoc(collection(db, "participantes"), {
        pasanakuId: grupo.id,
        nombre: nombreFinal,
        telefono: telefono.trim(),
        uid, // vincula al participante con su cuenta
        turno: lista.length + 1,
      }));
      marcarOrden(false);
      if (nuevas) setCredenciales(nuevas);
      limpiar();
    } catch (err) {
      toast.error(mensajeErrorCuenta(err));
    } finally {
      setGuardando(false);
    }
  };

  // Un clic: crea el acceso de un participante (usuario según su nombre + contraseña generada, visible en la tabla)
  const crearAccesoRapido = async (p) => {
    setGuardando(true);
    try {
      const cuenta = await crearCuentaJugador({ nombre: p.nombre, usuario: sugerirUsuario(p.nombre, jugadores), clave: generarClave() });
      await updateDoc(doc(db, "participantes", p.id), { uid: cuenta.uid });
      toast.success(`Acceso creado para ${p.nombre}`);
    } catch (err) {
      toast.error(mensajeErrorCuenta(err));
    } finally {
      setGuardando(false);
    }
  };

  // Crea el acceso de todos los participantes que aún no tienen, con usuario y contraseña generados
  const crearAccesosPendientes = async () => {
    const pendientes = lista.filter((p) => !tieneAcceso(p));
    if (pendientes.length === 0) return;
    const ok = await confirmar({
      titulo: `¿Crear acceso a ${pendientes.length} persona(s)?`,
      mensaje: "Se generará un usuario y una contraseña temporal para cada una. Las verás en la tabla para entregárselas.",
      textoConfirmar: "Crear accesos",
    });
    if (!ok) return;
    setGuardando(true);
    const creados = [];
    const conocidos = [...jugadores];
    try {
      for (const p of pendientes) {
        const usuarioNuevo = sugerirUsuario(p.nombre, conocidos);
        const claveNueva = generarClave();
        const cuenta = await crearCuentaJugador({ nombre: p.nombre, usuario: usuarioNuevo, clave: claveNueva });
        await updateDoc(doc(db, "participantes", p.id), { uid: cuenta.uid });
        conocidos.push({ usuario: cuenta.usuario });
        creados.push({ nombre: p.nombre, usuario: cuenta.usuario, clave: claveNueva });
      }
    } catch (err) {
      toast.error(mensajeErrorCuenta(err));
    } finally {
      setGuardando(false);
      if (creados.length) setCredenciales(creados);
    }
  };

  const marcarOrden = (listo) => updateDoc(doc(db, "pasanakus", grupo.id), { ordenListo: listo }).catch(() => {});

  const guardarOrden = async (nuevoOrden) => {
    const batch = writeBatch(db);
    nuevoOrden.forEach((p, i) => batch.update(doc(db, "participantes", p.id), { turno: i + 1 }));
    await batch.commit();
  };

  const mover = async (i, dir) => {
    const copia = [...lista];
    const j = i + dir;
    if (j < 0 || j >= copia.length) return;
    [copia[i], copia[j]] = [copia[j], copia[i]];
    try { await guardarOrden(copia); marcarOrden(true); } catch { toast.error("No se pudo mover."); }
  };

  const eliminar = async (p) => {
    if (!(await confirmar({ titulo: `¿Quitar a ${p.nombre}?`, mensaje: "Saldrá de este pasanaku. Su cuenta no se borra.", textoConfirmar: "Quitar", peligro: true }))) return;
    try {
      await deleteDoc(doc(db, "participantes", p.id));
      await guardarOrden(lista.filter((x) => x.id !== p.id));
      marcarOrden(false);
    } catch {
      toast.error("No se pudo eliminar.");
    }
  };

  const usuarioDe = (uid) => personas.find((x) => x.id === uid)?.usuario || "";
  const esJugador = (uid) => jugadores.some((j) => j.id === uid);

  return (
    <>
      {credenciales && <Credenciales datos={credenciales} onCerrar={() => setCredenciales(null)} />}
      {resetPara && <ResetClaveModal persona={resetPara} onCerrar={() => setResetPara(null)} onListo={(c) => { setResetPara(null); setCredenciales(c); }} />}

      {bloqueado ? (
        <p className="pk-aviso">El pasanaku ya inició: los participantes y el orden de turnos no se pueden cambiar.</p>
      ) : (
        <div className="pk-card pk-inicio">
          <div>
            <strong>{lista.length}{grupo.cupos ? ` de ${grupo.cupos}` : ""} participantes</strong>
            <p>
              {faltan > 0 ? `Faltan ${faltan} para completar el grupo.`
                : lista.length < 2 ? "Agrega al menos 2 participantes."
                : listoParaIniciar ? "Todo listo. Puedes presionar Iniciar." : `Falta: ${pendientesInicio(grupo, lista.length).filter((x) => !x.hecho).map((x) => x.texto.replace(/ \(.*\)$/, "").toLowerCase()).join(", ")}.`}
            </p>
          </div>
          <div className="pk-actions">
            {lista.length > 1 && onSortear && <button className="pk-btn pk-btn-ghost" onClick={onSortear}><FiAperture /> Sortear con ruleta</button>}
            <button className="pk-btn" onClick={() => iniciarPasanaku(grupo)} disabled={!listoParaIniciar}><FiPlay /> Iniciar pasanaku</button>
          </div>
        </div>
      )}

      {sinCuenta > 0 && (
        <div className="pk-aviso pk-aviso-accion">
          <span>{sinCuenta} participante(s) todavía no tienen usuario y contraseña para entrar.</span>
          <button type="button" className="pk-btn" onClick={crearAccesosPendientes} disabled={guardando}><FiKey /> {guardando ? "Creando..." : "Crear todos los accesos"}</button>
        </div>
      )}

      {!bloqueado && (
        <div className="pk-card pk-agregar">
          <div className="pk-modos">
            {[["existente", "Agregar a alguien que ya tiene cuenta"], ["nueva", "Crear persona nueva"]].map(([id, texto]) => (
              <button type="button" key={id} className={`pk-modo ${modo === id ? "activa" : ""}`} onClick={() => setModo(id)}>{texto}</button>
            ))}
          </div>

          {modo === "existente" ? (
            <>
              <label className="pk-buscar">
                <FiSearch />
                <input placeholder="Buscar por nombre o usuario..." value={buscarPersona} onChange={(e) => setBuscarPersona(e.target.value)} />
              </label>
              {disponibles.length === 0 ? (
                <p className="pk-nota-linea">{personas.length === 0 ? "Todavía no hay personas registradas: crea la primera en “Crear persona nueva”." : "No hay más personas disponibles con esa búsqueda."}</p>
              ) : (
                <>
                <ul className="pk-existentes">
                  {paginaPersonas.visibles.map((u) => (
                    <li key={u.id}>
                      <div>
                        <strong>{u.nombre}{u.id === miId ? " (tú)" : ""}</strong>
                        <small>{u.usuario}</small>
                      </div>
                      <span className={`pk-chip ${u.rol === "Administrador" ? "pk-chip-rev" : ""}`}>{u.rol}</span>
                      <button type="button" className="pk-btn pk-btn-agregar" title={`Agregar a ${u.nombre}`} aria-label={`Agregar a ${u.nombre}`} onClick={() => agregarExistente(u)} disabled={guardando}><FiPlus /><span className="pk-txt-ancho"> Agregar</span></button>
                    </li>
                  ))}
                </ul>
                <MostrarMas pagina={paginaPersonas} />
                </>
              )}
            </>
          ) : (
            <form onSubmit={agregar} className="pk-agregar">
              <div className="pk-inline">
                <input placeholder="Nombre" value={nombre} onChange={(e) => cambiarNombre(e.target.value)} required />
                <input placeholder="Usuario" value={usuario} onChange={(e) => { setUsuarioEditado(true); setUsuario(normalizarUsuario(e.target.value)); }} minLength={3} required autoCapitalize="none" />
                <span className="pk-clave">
                  <input type="text" placeholder="Contraseña temporal" value={clave} onChange={(e) => setClave(e.target.value)} minLength={8} required />
                  <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setClave(generarClave())}><FiRefreshCw /> Generar</button>
                  {clave && <button type="button" className="pk-icon" title="Copiar" onClick={() => { navigator.clipboard?.writeText(clave); toast.success("Contraseña copiada"); }}><FiCopy /></button>}
                </span>
                <input placeholder="Teléfono (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                <button className="pk-btn" type="submit" disabled={guardando}><FiPlus /> {guardando ? "Creando..." : "Crear y agregar"}</button>
              </div>
              <small className="pkf-nota">Solo para alguien que todavía no tiene cuenta. Entra con su usuario (único); al ingresar por primera vez tendrá que cambiar la contraseña temporal.</small>
            </form>
          )}
        </div>
      )}

      {cargando ? <Cargando /> : lista.length === 0 ? (
        <p className="pk-vacio">Sin participantes todavía.</p>
      ) : (
        <div className="pk-card pk-part-lista">
          <ul>
            {lista.map((p, i) => {
              const temporal = temporales.find((t) => t.id === p.uid);
              return (
                <li key={p.id} className="pk-part-fila">
                  <span className="pk-turno">{p.turno}</span>
                  <div className="pk-part-nombre">
                    <strong>{p.nombre}</strong>
                    {!tieneAcceso(p) && <button type="button" className="pk-chip pk-chip-rev" onClick={() => crearAccesoRapido(p)} disabled={guardando}><FiKey /> Crear acceso</button>}
                  </div>
                  <div className="pk-acciones-fila">
                    {temporal && (
                      <button type="button" className="pk-icon" title="Copiar usuario y contraseña" aria-label={`Copiar el acceso de ${p.nombre}`} onClick={() => { navigator.clipboard?.writeText(`Usuario: ${usuarioDe(p.uid)}
Contraseña: ${temporal.clave}`); toast.success("Acceso copiado"); }}><FiCopy /></button>
                    )}
                    {p.uid && esJugador(p.uid) && (
                      <button type="button" className="pk-icon" title="Generar nueva contraseña" aria-label={`Nueva contraseña para ${p.nombre}`} onClick={() => setResetPara({ uid: p.uid, nombre: p.nombre, usuario: usuarioDe(p.uid) })}><FiKey /></button>
                    )}
                    {!bloqueado && (
                      <>
                        <button type="button" className="pk-icon" aria-label="Subir turno" onClick={() => mover(i, -1)} disabled={i === 0}><FiArrowUp /></button>
                        <button type="button" className="pk-icon" aria-label="Bajar turno" onClick={() => mover(i, 1)} disabled={i === lista.length - 1}><FiArrowDown /></button>
                        <button type="button" className="pk-icon pk-danger" aria-label={`Quitar a ${p.nombre}`} onClick={() => eliminar(p)}><FiTrash2 /></button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

PanelParticipantes.propTypes = { grupo: PropTypes.object.isRequired, onSortear: PropTypes.func };

export default PanelParticipantes;
