import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { signOut, updatePassword } from "firebase/auth";
import { deleteDoc, doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { FiCheck } from "react-icons/fi";
import Cerdito3D from "../home/Cerdito3D";
import { validarClave } from "./acciones";
import { hashClave, ITERACIONES } from "./claves";
import { CLAVE_PRUEBA } from "./accesoJugador";
import CampoClave from "./CampoClave";
import { CLAVE_SESION } from "./sesion";
import "./Pasanaku.css";
import "./CambiarClave.css";

// Bienvenida con una contraseña temporal: se invita a crear la propia, pero se puede omitir.
// Vuelve a aparecer en el próximo ingreso mientras no la cambie (desde aquí o desde su perfil).
const CambiarClave = ({ nombre, onListo, onOmitir, onSalir }) => {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [guardando, setGuardando] = useState(false);
  const primerNombre = (nombre || "").trim().split(" ")[0];

  const guardar = async (e) => {
    e.preventDefault();
    const problema = validarClave(clave);
    if (problema) return toast.error(problema);
    if (clave !== repetir) return toast.error("Las contraseñas no coinciden.");
    setGuardando(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, clave);
        await updateDoc(doc(db, "usuario", auth.currentUser.uid), { debeCambiarClave: false });
      } else {
        // Jugador: se guarda solo el hash de su contraseña nueva; las reglas exigen la prueba de la temporal
        const id = localStorage.getItem(CLAVE_SESION);
        const prueba = sessionStorage.getItem(CLAVE_PRUEBA);
        if (!prueba) {
          toast.error("Tu sesión venció. Vuelve a entrar con tu contraseña temporal.");
          onSalir();
          return;
        }
        const datos = (await getDoc(doc(db, "jugadores", id))).data();
        const { hash } = await hashClave(clave, datos.sal, datos.iter || ITERACIONES);
        if (hash === prueba) return toast.error("La contraseña nueva debe ser distinta a la temporal.");
        const lote = writeBatch(db);
        lote.update(doc(db, "claves", id), { hash, previa: prueba });
        lote.update(doc(db, "jugadores", id), { debeCambiarClave: false });
        await lote.commit();
        sessionStorage.removeItem(CLAVE_PRUEBA);
        await deleteDoc(doc(db, "temporales", id)).catch(() => {}); // la temporal deja de existir
      }
      toast.success("Contraseña actualizada");
      onListo();
    } catch (err) {
      console.error("Error al cambiar la contraseña:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.");
        await signOut(auth);
      } else {
        toast.error(`No se pudo cambiar la contraseña (${err.code || "error"}).`);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="cc">
      <span className="cc-deco d1" />
      <span className="cc-deco d2" />
      <div className="cc-tarjeta">
        <div className="cc-cerdo"><Cerdito3D /></div>
        <h1>¡Bienvenido{primerNombre ? <>, <span>{primerNombre}</span></> : ""}!</h1>
        <p className="cc-texto">Entraste con una contraseña temporal. Por tu seguridad, crea una propia que solo tú conozcas (mínimo 8 caracteres).</p>

        <form className="cc-form" onSubmit={guardar}>
          <CampoClave etiqueta="Nueva contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" autoFocus />
          <CampoClave etiqueta="Repite la contraseña" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
          <button type="submit" className="pk-btn cc-guardar" disabled={guardando}><FiCheck /> {guardando ? "Guardando..." : "Guardar mi contraseña"}</button>
        </form>

        <button type="button" className="cc-omitir" onClick={onOmitir} disabled={guardando}>Omitir por ahora</button>
        <p className="cc-nota">Si la omites, te lo recordaremos la próxima vez que entres. También puedes cambiarla cuando quieras en &quot;Mi perfil&quot;.</p>
      </div>
    </div>
  );
};

CambiarClave.propTypes = { nombre: PropTypes.string, onListo: PropTypes.func.isRequired, onOmitir: PropTypes.func.isRequired, onSalir: PropTypes.func.isRequired };

export default CambiarClave;
