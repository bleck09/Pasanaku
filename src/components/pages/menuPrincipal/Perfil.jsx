import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ref } from "firebase/storage";
import { ocupado, subirConProgreso } from "./ocupado";
import { auth, db, storage } from "../../../firebase";
import { FiAtSign, FiCamera, FiGrid, FiLock, FiShield, FiTrash2, FiUser } from "react-icons/fi";
import Avatar from "./Avatar";
import { validarClave } from "./acciones";
import { hashClave, ITERACIONES } from "./claves";
import { probarClave } from "./accesoJugador";
import { extensionDe } from "./imagenes";
import EditorFoto from "./EditorFoto";
import { portadaDe } from "./portadas";
import QRPerfil from "./QRPerfil";
import CampoClave from "./CampoClave";
import "./Pasanaku.css";

// Perfil de la persona que inició sesión, en secciones: foto, contraseña y QR para cobrar (administrador y jugadores)
const Perfil = ({ id, nombre, usuario, rol, foto, onFoto }) => {
  const [seccion, setSeccion] = useState("info"); // info | clave | qr
  const [porEditar, setPorEditar] = useState(null); // imagen elegida que se está ajustando
  const [subiendo, setSubiendo] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [guardando, setGuardando] = useState(false);
  const esAdmin = rol === "administrador";

  const guardarFoto = async (fotoUrl) => {
    await setDoc(doc(db, "perfiles", id), { fotoUrl, actualizado: Date.now() }, { merge: true });
    if (esAdmin) await updateDoc(doc(db, "usuario", id), { fotoUrl });
    onFoto(fotoUrl);
  };

  const elegirFoto = (e) => {
    const original = e.target.files[0];
    e.target.value = "";
    if (!original) return;
    if (!original.type.startsWith("image/")) return toast.error("Elige una imagen.");
    setPorEditar(original);
  };

  const subirFoto = async (recortada) => {
    setPorEditar(null);
    setSubiendo(true);
    const trabajo = ocupado.iniciar({ titulo: "Subiendo tu foto...", texto: "Guardando la imagen." });
    try {
      const archivo = ref(storage, `perfiles/${id}_${Date.now()}.${extensionDe(recortada)}`);
      const url = await subirConProgreso(archivo, recortada, trabajo.progreso);
      trabajo.texto("Guardando tu foto...");
      await guardarFoto(url);
      toast.success("Foto actualizada");
    } catch (err) {
      console.error("Foto de perfil:", err);
      toast.error(err.code === "storage/unauthorized" || err.code === "permission-denied"
        ? "Firebase no permite guardar la foto (faltan publicar las reglas nuevas)."
        : `No se pudo actualizar la foto (${err.code || "error"}).`, { duration: 7000 });
    } finally {
      await trabajo.terminar();
      setSubiendo(false);
    }
  };

  const quitarFoto = async () => {
    setSubiendo(true);
    const trabajo = ocupado.iniciar({ titulo: "Quitando tu foto...", texto: "Un momento." });
    try {
      await guardarFoto("");
      toast.success("Foto quitada");
    } catch (err) {
      toast.error(`No se pudo quitar la foto (${err.code || "error"}).`);
    } finally {
      await trabajo.terminar();
      setSubiendo(false);
    }
  };

  const cambiarClave = async (e) => {
    e.preventDefault();
    const problema = validarClave(nueva);
    if (problema) return toast.error(problema);
    if (nueva !== repetir) return toast.error("Las contraseñas nuevas no coinciden.");
    if (nueva === actual) return toast.error("La contraseña nueva debe ser distinta a la actual.");
    setGuardando(true);
    const trabajo = ocupado.iniciar({ titulo: "Guardando tu contraseña...", texto: "Un momento." });
    try {
      if (esAdmin) {
        await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, actual));
        await updatePassword(auth.currentUser, nueva);
        await updateDoc(doc(db, "usuario", auth.currentUser.uid), { debeCambiarClave: false }).catch(() => {});
      } else {
        const datos = (await getDoc(doc(db, "jugadores", id))).data();
        const prueba = datos ? await probarClave(id, actual, datos) : null;
        if (!prueba) {
          toast.error("La contraseña actual no es correcta.");
          return;
        }
        // se conserva la misma sal; las reglas exigen la prueba de la contraseña actual para aceptar el cambio
        const { hash } = await hashClave(nueva, datos.sal, datos.iter || ITERACIONES);
        const lote = writeBatch(db);
        lote.update(doc(db, "claves", id), { hash, previa: prueba });
        if (datos.debeCambiarClave) lote.update(doc(db, "jugadores", id), { debeCambiarClave: false });
        await lote.commit();
        if (datos.debeCambiarClave) await deleteDoc(doc(db, "temporales", id)).catch(() => {});
      }
      toast.success("Contraseña actualizada");
      setActual(""); setNueva(""); setRepetir("");
    } catch (err) {
      console.error("Cambiar contraseña:", err);
      toast.error(["auth/wrong-password", "auth/invalid-credential"].includes(err.code)
        ? "La contraseña actual no es correcta."
        : `No se pudo cambiar la contraseña (${err.code || "error"}).`, { duration: 6000 });
    } finally {
      await trabajo.terminar();
      setGuardando(false);
    }
  };

  return (
    <div className="pk-view pk-perfil-vista">
      <div className="pk-card pf-hero">
        <div className="pf-portada" style={{ background: portadaDe(nombre) }}>
          <span className="pf-circ c1" /><span className="pf-circ c2" />
        </div>
        <div className="pf-cuerpo">
          <div className="pf-avatar">
            <Avatar nombre={nombre} foto={foto} tam={116} className="pk-avatar-grande" />
            <label className={`pf-camara ${subiendo ? "off" : ""}`} title={foto ? "Cambiar foto" : "Poner mi foto"}>
              <FiCamera />
              <input type="file" accept="image/*" onChange={elegirFoto} disabled={subiendo} />
            </label>
          </div>
          <h1>{nombre}</h1>
          <div className="pf-chips">
            {usuario && <span className="pf-chip"><FiAtSign /> {usuario}</span>}
            <span className={`pf-chip ${esAdmin ? "admin" : "jugador"}`}>{esAdmin ? <FiShield /> : <FiUser />} {esAdmin ? "Administrador" : "Jugador"}</span>
          </div>
          <div className="pf-acciones">
            <label className={`pk-btn ${subiendo ? "pk-btn-off" : ""}`}>
              <FiCamera /> {subiendo ? "Subiendo..." : foto ? "Cambiar foto" : "Poner mi foto"}
              <input type="file" accept="image/*" onChange={elegirFoto} disabled={subiendo} style={{ display: "none" }} />
            </label>
            {foto && <button type="button" className="pk-btn pk-btn-ghost" onClick={quitarFoto} disabled={subiendo}><FiTrash2 /> Quitar</button>}
          </div>
        </div>
      </div>

      <div className="pf-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={seccion === "info"} className={seccion === "info" ? "activo" : ""} onClick={() => setSeccion("info")}><FiUser /> Información</button>
        <button type="button" role="tab" aria-selected={seccion === "clave"} className={seccion === "clave" ? "activo" : ""} onClick={() => setSeccion("clave")}><FiLock /> Seguridad</button>
        <button type="button" role="tab" aria-selected={seccion === "qr"} className={seccion === "qr" ? "activo" : ""} onClick={() => setSeccion("qr")}><FiGrid /> Mi QR</button>
      </div>

      {seccion === "info" && (
        <div className="pk-card pk-perfil-seccion pf-info">
          <h3>Información general</h3>
          <dl>
            <div><dt>Nombre</dt><dd>{nombre}</dd></div>
            <div><dt>{esAdmin ? "Correo" : "Usuario"}</dt><dd>{usuario || "—"}</dd></div>
            <div><dt>Rol</dt><dd>{esAdmin ? "Administrador" : "Jugador"}</dd></div>
          </dl>
          <p className="pkf-nota">Así te ven los demás en los grupos. Al elegir una foto podrás moverla y acercarla para decidir qué parte se muestra en el círculo.</p>
        </div>
      )}

      {seccion === "clave" && (
        <form className="pk-card pk-form pk-perfil-seccion" onSubmit={cambiarClave}>
          <h3><FiLock /> Cambiar contraseña</h3>
          <CampoClave etiqueta="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
          <CampoClave etiqueta="Contraseña nueva" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
          <CampoClave etiqueta="Repite la contraseña nueva" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
          <small className="pkf-nota">Nadie puede ver tu contraseña: se guarda cifrada. Si la olvidas, el administrador te asigna una temporal.</small>
          <div className="pk-actions">
            <button type="submit" className="pk-btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar contraseña"}</button>
          </div>
        </form>
      )}

      {seccion === "qr" && <QRPerfil id={id} />}

      {porEditar && <EditorFoto archivo={porEditar} onListo={subirFoto} onCerrar={() => setPorEditar(null)} />}
    </div>
  );
};

Perfil.propTypes = {
  id: PropTypes.string.isRequired, nombre: PropTypes.string, usuario: PropTypes.string, rol: PropTypes.string,
  foto: PropTypes.string, onFoto: PropTypes.func.isRequired,
};

export default Perfil;
