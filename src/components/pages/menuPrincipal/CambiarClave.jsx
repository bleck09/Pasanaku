import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { signOut, updatePassword } from "firebase/auth";
import { deleteDoc, doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { FiLock } from "react-icons/fi";
import { validarClave } from "./acciones";
import { hashClave, ITERACIONES } from "./claves";
import { CLAVE_PRUEBA } from "./accesoJugador";
import { CLAVE_SESION } from "./sesion";
import "./Pasanaku.css";

// Pantalla obligatoria la primera vez que entra alguien con contraseña temporal
const CambiarClave = ({ onListo, onSalir }) => {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [guardando, setGuardando] = useState(false);

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "'Montserrat', sans-serif" }}>
      <form className="pk-card pk-form" onSubmit={guardar} style={{ width: "100%" }}>
        <h3><FiLock /> Crea tu contraseña</h3>
        <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Entraste con una contraseña temporal. Elige la contraseña que quieras (mínimo 8 caracteres) para continuar.
        </p>
        <label>Nueva contraseña<input type="password" value={clave} onChange={(e) => setClave(e.target.value)} minLength={8} required autoFocus autoComplete="new-password" /></label>
        <label>Repite la contraseña<input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} minLength={8} required autoComplete="new-password" /></label>
        <div className="pk-actions">
          <button type="button" className="pk-btn pk-btn-ghost" onClick={onSalir}>Salir</button>
          <button type="submit" className="pk-btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
};

CambiarClave.propTypes = { onListo: PropTypes.func.isRequired, onSalir: PropTypes.func.isRequired };

export default CambiarClave;
