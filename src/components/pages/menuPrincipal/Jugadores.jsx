import React, { useState } from "react";
import toast from "react-hot-toast";
import { FiUserPlus, FiRefreshCw, FiCopy, FiKey, FiEye, FiArrowLeft, FiSearch, FiEdit2, FiLayers, FiChevronRight } from "react-icons/fi";
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import Modal from "./Modal";
import { crearCuentaJugador, generarClave, mensajeErrorCuenta, normalizarUsuario, sugerirUsuario } from "./acciones";
import Credenciales from "./Credenciales";
import ResetClaveModal from "./ResetClaveModal";
import { estadoGrupo, useColeccion } from "./pasanakuUtils";
import { portadaDe } from "./portadas";
import Avatar from "./Avatar";
import { usePerfiles } from "./perfiles";
import MostrarMas from "./MostrarMas";
import { usePaginado } from "./usePaginado";
import Cargando from "./Cargando";
import "./Pasanaku.css";

const VACIO = { nombre: "", usuario: "", clave: "" };

const Jugadores = () => {
  const { docs: jugadores, cargando } = useColeccion("jugadores");
  const { docs: cuentas } = useColeccion("usuario"); // cuentas con Firebase Authentication (administradores)
  const { docs: temporales } = useColeccion("temporales"); // contraseñas temporales aún no cambiadas
  const { docs: participantes } = useColeccion("participantes");
  const { docs: grupos } = useColeccion("pasanakus");
  const [pestana, setPestana] = useState("todos"); // todos | jugador | administrador
  const [editar, setEditar] = useState(null); // persona cuyo nombre se edita
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [usuarioEditado, setUsuarioEditado] = useState(false); // si el admin cambió el usuario sugerido
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);
  const [resetPara, setResetPara] = useState(null);
  const [creando, setCreando] = useState(false); // la creación es una hoja aparte
  const [q, setQ] = useState("");
  const [verJuega, setVerJuega] = useState(null); // persona cuyos pasanakus se muestran en una ventana
  const fotos = usePerfiles();

  const lista = [
    ...cuentas
      .filter((c) => c.rol?.toLowerCase() === "administrador")
      .map((c) => ({ id: c.id, nombre: c.nombre, usuario: c.correo || c.email, rol: "administrador" })),
    ...jugadores.map((j) => ({ id: j.id, nombre: j.nombre, usuario: j.usuario || j.id, rol: "jugador", temporal: j.debeCambiarClave })),
  ].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  const cambiarNombre = (nombre) =>
    setForm({ ...form, nombre, usuario: usuarioEditado ? form.usuario : sugerirUsuario(nombre, jugadores) });

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const nombre = form.nombre.trim();
      const { usuario } = await crearCuentaJugador({ nombre, usuario: form.usuario, clave: form.clave });
      setCredenciales({ nombre, usuario, clave: form.clave });
      setForm(VACIO);
      setUsuarioEditado(false);
      setCreando(false);
    } catch (err) {
      toast.error(mensajeErrorCuenta(err));
    } finally {
      setGuardando(false);
    }
  };

  const texto = q.trim().toLowerCase();
  const deEstaPestana = lista.filter((u) => pestana === "todos" || u.rol === pestana);
  const visibles = deEstaPestana.filter((u) => !texto || [u.nombre, u.usuario].some((t) => (t || "").toLowerCase().includes(texto)));
  const pagina = usePaginado(visibles, `${pestana}|${texto}`);
  const esJugadores = pestana !== "administrador"; // con "Todos" también se ven las contraseñas de jugadores

  const guardarNombre = async (e) => {
    e.preventDefault();
    const nombre = nombreNuevo.trim();
    if (!nombre) return toast.error("Escribe un nombre.");
    setGuardandoNombre(true);
    try {
      await updateDoc(doc(db, editar.rol === "jugador" ? "jugadores" : "usuario", editar.id), { nombre });
      // el nombre también está copiado en cada participación; se actualiza para que se vea igual en todos los pasanakus
      const snap = await getDocs(query(collection(db, "participantes"), where("uid", "==", editar.id)));
      const lote = writeBatch(db);
      snap.forEach((d) => lote.update(d.ref, { nombre }));
      await lote.commit();
      toast.success("Nombre actualizado");
      setEditar(null);
    } catch (err) {
      console.error("Editar nombre:", err);
      toast.error(`No se pudo guardar el nombre (${err.code || "error"}).`);
    } finally {
      setGuardandoNombre(false);
    }
  };
  // Pasanakus en los que juega cada persona (el administrador también puede jugar)
  const pasanakusDe = (id) => participantes
    .filter((p) => p.uid === id)
    .map((p) => {
      const g = grupos.find((x) => x.id === p.pasanakuId);
      return { id: p.id, texto: `${g?.nombre || "Pasanaku"} · turno ${p.turno}`, nombre: g?.nombre || "Pasanaku", turno: p.turno, cupos: g?.cupos, estado: g ? estadoGrupo(g) : "" };
    });

  const modales = (
    <>
      {credenciales && <Credenciales datos={credenciales} onCerrar={() => setCredenciales(null)} />}
      {verJuega && (
        <Modal titulo={verJuega.nombre} subtitulo={`Pasanakus en los que juega (${pasanakusDe(verJuega.id).length})`} ancho={460} onCerrar={() => setVerJuega(null)}>
          <ul className="pk-juega-lista">
            {pasanakusDe(verJuega.id).map((j) => (
              <li key={j.id}>
                <span className="pk-fila-icono" style={{ background: portadaDe(j.nombre) }}>{j.nombre.trim().charAt(0).toUpperCase()}</span>
                <div><strong>{j.nombre}</strong><small>Turno {j.turno}{j.cupos ? ` de ${j.cupos}` : ""}</small></div>
                <span className={`pk-chip ${j.estado === "En curso" ? "pk-chip-ok" : j.estado === "Armando" ? "pk-chip-rev" : ""}`}>{j.estado === "Armando" ? "Aún no inicia" : j.estado}</span>
              </li>
            ))}
            {pasanakusDe(verJuega.id).length === 0 && <li className="pk-vacio">Todavía no juega en ningún pasanaku.</li>}
          </ul>
        </Modal>
      )}
      {editar && (
        <Modal titulo="Editar nombre" subtitulo={`Usuario: ${editar.usuario}`} ancho={460} onCerrar={() => setEditar(null)}>
          <form className="pk-form" onSubmit={guardarNombre}>
            <label>Nombre<input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} required autoFocus /></label>
            <small className="pkf-nota">Se actualiza en todos los pasanakus donde juega. El usuario para entrar no cambia.</small>
            <div className="pk-actions">
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setEditar(null)}>Cancelar</button>
              <button type="submit" className="pk-btn" disabled={guardandoNombre}>{guardandoNombre ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </Modal>
      )}
      {resetPara && <ResetClaveModal persona={resetPara} onCerrar={() => setResetPara(null)} onListo={(c) => { setResetPara(null); setCredenciales(c); }} />}
    </>
  );

  if (creando) {
    return (
      <div className="pk-view pk-hoja">
        <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setCreando(false)} style={{ marginBottom: "1rem" }}><FiArrowLeft /> Jugadores</button>
        <div className="pk-header">
          <div>
            <h1>Nuevo jugador</h1>
            <p>Crea su acceso. Le darás el usuario y una contraseña temporal; al ingresar tendrá que elegir la suya.</p>
          </div>
        </div>

        <form className="pk-card pk-form pk-hoja-form" onSubmit={crear}>
          <label>Nombre<input value={form.nombre} onChange={(e) => cambiarNombre(e.target.value)} placeholder="Ej: Wendy Pérez" required autoFocus /></label>
          <label>Usuario (con este entra; debe ser único)
            <input
              value={form.usuario}
              onChange={(e) => { setUsuarioEditado(true); setForm({ ...form, usuario: normalizarUsuario(e.target.value) }); }}
              placeholder="se sugiere según el nombre" minLength={3} required autoCapitalize="none"
            />
          </label>
          <label>Contraseña temporal
            <span className="pk-clave">
              <input type="text" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} minLength={4} required />
              <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setForm({ ...form, clave: generarClave() })}><FiRefreshCw /> Generar</button>
              {form.clave && <button type="button" className="pk-icon" title="Copiar" onClick={() => { navigator.clipboard?.writeText(form.clave); toast.success("Contraseña copiada"); }}><FiCopy /></button>}
            </span>
          </label>
          <div className="pk-actions">
            <button type="button" className="pk-btn pk-btn-ghost" onClick={() => setCreando(false)}>Cancelar</button>
            <button className="pk-btn" type="submit" disabled={guardando}><FiUserPlus /> {guardando ? "Creando..." : "Crear cuenta"}</button>
          </div>
        </form>
        {modales}
      </div>
    );
  }

  return (
    <div className="pk-view">
      <div className="pk-header">
        <div>
          <h1>Jugadores</h1>
          <p>Las cuentas de quienes participan. Las contraseñas están cifradas: no se pueden ver, solo cambiar.</p>
        </div>
        <button className="pk-btn" onClick={() => { setForm(VACIO); setUsuarioEditado(false); setCreando(true); }}><FiUserPlus /> Nuevo jugador</button>
      </div>

      {modales}

      {cargando ? <Cargando /> : lista.length === 0 ? (
        <p className="pk-vacio">Aún no hay jugadores. Crea el primero.</p>
      ) : (
        <>
          <div className="pk-barra-filtros">
            <div className="pk-segmento">
              <button type="button" className={pestana === "todos" ? "activo" : ""} onClick={() => setPestana("todos")}>Todos ({lista.length})</button>
              <button type="button" className={pestana === "jugador" ? "activo" : ""} onClick={() => setPestana("jugador")}>Jugadores ({lista.filter((u) => u.rol === "jugador").length})</button>
              <button type="button" className={pestana === "administrador" ? "activo" : ""} onClick={() => setPestana("administrador")}>Administradores ({lista.filter((u) => u.rol === "administrador").length})</button>
            </div>
            <label className="pk-buscar"><FiSearch /><input placeholder="Buscar por nombre o usuario..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
          </div>

          <div className="pk-personas-movil">
            {pagina.visibles.map((u) => {
              const juega = pasanakusDe(u.id);
              const temporal = u.rol === "jugador" ? temporales.find((t) => t.id === u.id) : null;
              return (
                <div key={u.id} className="pk-persona-fila">
                  <Avatar nombre={u.nombre} foto={fotos.get(u.id)} tam={40} />
                  <div className="pk-persona-info">
                    <strong>{u.nombre}</strong>
                    <small>{u.usuario}{pestana === "todos" ? ` · ${u.rol}` : ""}</small>
                    <button type="button" className="pk-juega-boton" onClick={() => setVerJuega(u)} disabled={juega.length === 0}>
                      <FiLayers /> {juega.length === 0 ? "Sin pasanakus" : `${juega.length} pasanaku${juega.length === 1 ? "" : "s"}`}{juega.length > 0 && <FiChevronRight />}
                    </button>
                  </div>
                  <div className="pk-persona-acciones">
                    {temporal && <button type="button" className="pk-icon" title="Ver contraseña temporal" aria-label="Ver contraseña temporal" onClick={() => setCredenciales({ nombre: u.nombre, usuario: u.usuario, clave: temporal.clave })}><FiEye /></button>}
                    {u.rol === "jugador" && <button type="button" className="pk-icon" title="Generar nueva contraseña" aria-label="Generar nueva contraseña" onClick={() => setResetPara({ uid: u.id, nombre: u.nombre, usuario: u.usuario })}><FiKey /></button>}
                    <button type="button" className="pk-icon" title="Editar nombre" aria-label="Editar nombre" onClick={() => { setNombreNuevo(u.nombre || ""); setEditar(u); }}><FiEdit2 /></button>
                  </div>
                </div>
              );
            })}
            {visibles.length === 0 && <p className="pk-vacio">{texto ? "Nadie coincide con la búsqueda." : pestana === "administrador" ? "No hay administradores." : "Aún no hay jugadores."}</p>}
          </div>

          <div className="pk-card pk-tabla-wrap pk-vista-escritorio">
            <table className="pk-tabla pk-tabla-personas">
              <thead><tr><th>Persona</th><th>Usuario</th>{pestana === "todos" && <th>Rol</th>}<th>Juega en</th>{esJugadores && <th>Contraseña</th>}<th /></tr></thead>
              <tbody>
                {pagina.visibles.map((u) => {
                  const juega = pasanakusDe(u.id);
                  return (
                    <tr key={u.id}>
                      <td><span className="pk-persona"><Avatar nombre={u.nombre} foto={fotos.get(u.id)} tam={38} /><strong>{u.nombre}</strong></span></td>
                      <td>{u.usuario}</td>
                      {pestana === "todos" && <td><span className={`pk-chip ${u.rol === "administrador" ? "pk-chip-ok" : ""}`} style={{ cursor: "default", textTransform: "capitalize" }}>{u.rol}</span></td>}
                      <td>
                        {juega.length === 0 ? <span style={{ color: "var(--text-dim)" }}>Ninguno todavía</span>
                          : <span className="pk-juega">{juega.map((j) => <span key={j.id} className="pk-chip pk-chip-ok" style={{ cursor: "default" }}>{j.texto}</span>)}</span>}
                      </td>
                      {esJugadores && (
                        <td>
                          {u.rol !== "jugador" ? <span style={{ color: "var(--text-dim)" }}>—</span>
                            : temporales.some((t) => t.id === u.id)
                            ? <button type="button" className="pk-chip pk-chip-rev" onClick={() => setCredenciales({ nombre: u.nombre, usuario: u.usuario, clave: temporales.find((t) => t.id === u.id).clave })}><FiEye /> Ver temporal</button>
                            : <span className="pk-chip" style={{ cursor: "default" }} title="La eligió la persona y solo ella la conoce">Propia (privada)</span>}
                        </td>
                      )}
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="pk-icon" title="Editar nombre" onClick={() => { setNombreNuevo(u.nombre || ""); setEditar(u); }}><FiEdit2 /></button>
                        {u.rol === "jugador" && (
                          <button className="pk-btn pk-btn-ghost pk-btn-mini" style={{ marginLeft: 8 }} onClick={() => setResetPara({ uid: u.id, nombre: u.nombre, usuario: u.usuario })}><FiKey /> Generar nueva contraseña</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibles.length === 0 && <p className="pk-vacio">{texto ? "Nadie coincide con la búsqueda." : pestana === "administrador" ? "No hay administradores." : "Aún no hay jugadores."}</p>}
          </div>
          <MostrarMas pagina={pagina} />
          {pestana !== "jugador" && <p className="pk-nota-linea">La contraseña de un administrador la cambia él mismo desde «Mi perfil».</p>}
        </>
      )}
    </div>
  );
};

export default Jugadores;
