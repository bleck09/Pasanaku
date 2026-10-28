import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../firebase";
import { FiCamera, FiGrid, FiLock, FiTrash2, FiUser } from "react-icons/fi";
import Avatar from "./Avatar";
import { validarClave } from "./acciones";
import { hashClave, ITERACIONES } from "./claves";
import { probarClave } from "./accesoJugador";
import { comprimirImagen, extensionDe } from "./imagenes";
import QRPerfil from "./QRPerfil";
import "./Pasanaku.css";

// Perfil de la persona que inició sesión, en secciones: foto, contraseña y QR para cobrar (administrador y jugadores)
const Perfil = ({ id, nombre, usuario, rol, foto, onFoto }) => {
  const [seccion, setSeccion] = useState("foto"); // foto | clave | qr
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

  const cambiarFoto = async (e) => {
    const original = e.target.files[0];
    e.target.value = "";
    if (!original) return;
    if (!original.type.startsWith("image/")) return toast.error("Elige una imagen.");
    setSubiendo(true);
    try {
      const liviana = await comprimirImagen(original, 512, 0.85);
      const archivo = ref(storage, `perfiles/${id}_${Date.now()}.${extensionDe(liviana)}`);
      await uploadBytes(archivo, liviana, { contentType: liviana.type });
      await guardarFoto(await getDownloadURL(archivo));
      toast.success("Foto actualizada");
    } catch (err) {
      console.error("Foto de perfil:", err);
      toast.error(err.code === "storage/unauthorized" || err.code === "permission-denied"
        ? "Firebase no permite guardar la foto (faltan publicar las reglas nuevas)."
        : `No se pudo actualizar la foto (${err.code || "error"}).`, { duration: 7000 });
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = async () => {
    setSubiendo(true);
    try {
      await guardarFoto("");
      toast.success("Foto quitada");
    } catch (err) {
      toast.error(`No se pudo quitar la foto (${err.code || "error"}).`);
    } finally {
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
    try {
      if (esAdmin) {
        await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, actual));
        await updatePassword(auth.currentUser, nueva);
      } else {
        const datos = (await getDoc(doc(db, "jugadores", id))).data();
        const prueba = datos ? await probarClave(id, actual, datos) : null;
        if (!prueba) {
          toast.error("La contraseña actual no es correcta.");
          return;
        }
        // se conserva la misma sal; las reglas exigen la prueba de la contraseña actual para aceptar el cambio
        const { hash } = await hashClave(nueva, datos.sal, datos.iter || ITERACIONES);
        await updateDoc(doc(db, "claves", id), { hash, previa: prueba });
      }
      toast.success("Contraseña actualizada");
      setActual(""); setNueva(""); setRepetir("");
    } catch (err) {
      console.error("Cambiar contraseña:", err);
      toast.error(["auth/wrong-password", "auth/invalid-credential"].includes(err.code)
        ? "La contraseña actual no es correcta."
        : `No se pudo cambiar la contraseña (${err.code || "error"}).`, { duration: 6000 });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pk-view pk-perfil-vista">
      <div className="pk-card pk-perfil-cab">
        <Avatar nombre={nombre} foto={foto} tam={76} className="pk-avatar-grande" />
        <div className="pk-perfil-cab-info">
          <h2>{nombre}</h2>
          <span className="pk-chip pk-chip-ok" style={{ cursor: "default" }}><FiUser /> {esAdmin ? "Administrador" : "Jugador"}</span>
          {usuario && <small className="pkf-nota">Usuario: <strong>{usuario}</strong></small>}
        </div>
      </div>

      <div className="pk-segmento pk-perfil-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={seccion === "foto"} className={seccion === "foto" ? "activo" : ""} onClick={() => setSeccion("foto")}><FiCamera /> Mi foto</button>
        <button type="button" role="tab" aria-selected={seccion === "clave"} className={seccion === "clave" ? "activo" : ""} onClick={() => setSeccion("clave")}><FiLock /> Contraseña</button>
        <button type="button" role="tab" aria-selected={seccion === "qr"} className={seccion === "qr" ? "activo" : ""} onClick={() => setSeccion("qr")}><FiGrid /> Mi QR</button>
      </div>

      {seccion === "foto" && (
        <div className="pk-card pk-perfil-seccion">
          <h3>Mi foto</h3>
          <p className="pkf-nota">Así te ven los demás en los grupos. Si no pones foto, se muestra un círculo con tus iniciales.</p>
          <div className="pk-acciones-fila">
            <label className={`pk-btn ${subiendo ? "pk-btn-off" : ""}`} style={{ cursor: "pointer" }}>
              <FiCamera /> {subiendo ? "Subiendo..." : foto ? "Cambiar foto" : "Poner mi foto"}
              <input type="file" accept="image/*" onChange={cambiarFoto} disabled={subiendo} style={{ display: "none" }} />
            </label>
            {foto && <button type="button" className="pk-btn pk-btn-ghost" onClick={quitarFoto} disabled={subiendo}><FiTrash2 /> Quitar</button>}
          </div>
        </div>
      )}

      {seccion === "clave" && (
        <form className="pk-card pk-form pk-perfil-seccion" onSubmit={cambiarClave}>
          <h3><FiLock /> Cambiar contraseña</h3>
          <label>Contraseña actual<input type="password" value={actual} onChange={(e) => setActual(e.target.value)} required autoComplete="current-password" /></label>
          <label>Contraseña nueva<input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} minLength={8} required autoComplete="new-password" /></label>
          <label>Repite la contraseña nueva<input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} minLength={8} required autoComplete="new-password" /></label>
          <small className="pkf-nota">Nadie puede ver tu contraseña: se guarda cifrada. Si la olvidas, el administrador te asigna una temporal.</small>
          <div className="pk-actions">
            <button type="submit" className="pk-btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar contraseña"}</button>
          </div>
        </form>
      )}

      {seccion === "qr" && <QRPerfil id={id} />}
    </div>
  );
};

Perfil.propTypes = {
  id: PropTypes.string.isRequired, nombre: PropTypes.string, usuario: PropTypes.string, rol: PropTypes.string,
  foto: PropTypes.string, onFoto: PropTypes.func.isRequired,
};

export default Perfil;
