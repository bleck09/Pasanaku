import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

// Iconos
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowLeft, FiArrowRight, FiClock, FiWifiOff, FiAlertCircle } from "react-icons/fi";
import Cerdito3D from "../home/Cerdito3D";
import { normalizarUsuario } from "../menuPrincipal/acciones";
import { hashClave } from "../menuPrincipal/claves";
import { CLAVE_PRUEBA, probarClave } from "../menuPrincipal/accesoJugador";
import { CLAVE_SESION, OMITIR_CLAVE } from "../menuPrincipal/sesion";
import "./Login.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState(null); // ventana de error al ingresar
  const navigate = useNavigate();

  const cerrarAviso = () => {
    const incorrecto = aviso?.icono === "clave";
    setAviso(null);
    if (incorrecto) {
      const campo = document.getElementById("password");
      if (campo) { campo.value = ""; campo.focus(); }
    }
  };

  // Solo las cuentas con correo real (administradores) pueden recuperarla por correo;
  // los jugadores piden al administrador que les cambie la contraseña.
  const olvideClave = async () => {
    const entrada = document.getElementById("usuario")?.value.trim() || "";
    if (!entrada.includes("@")) {
      toast("Si eres jugador, pídele al administrador que te cambie la contraseña. Si eres administrador, escribe tu correo arriba y vuelve a pulsar.", { duration: 7000 });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, entrada.toLowerCase());
    } catch {
      // se responde igual para no revelar si el correo existe
    }
    toast.success("Si ese correo tiene cuenta, te enviamos un mensaje para crear una contraseña nueva.", { duration: 7000 });
  };

  // Correo → Firebase Authentication (administrador). Usuario → jugador con contraseña propia (colección "jugadores").
  const iniciarSesion = async (entrada, password) => {
    localStorage.removeItem(OMITIR_CLAVE);
    if (entrada.includes("@")) {
      localStorage.removeItem(CLAVE_SESION);
      const { user } = await signInWithEmailAndPassword(auth, entrada.toLowerCase(), password);
      return { uid: user.uid, esJugador: false };
    }

    const incorrecto = Object.assign(new Error("incorrecto"), { code: "auth/invalid-credential" });
    const id = normalizarUsuario(entrada);
    const snap = id ? await getDoc(doc(db, "jugadores", id)) : null;
    if (!snap?.exists()) {
      await hashClave(password); // tarda lo mismo para no revelar si el usuario existe
      throw incorrecto;
    }
    const perfil = snap.data();
    const prueba = await probarClave(id, password, perfil);
    if (!prueba) throw incorrecto;
    sessionStorage.setItem(CLAVE_PRUEBA, prueba);

    await signOut(auth); // por si había una sesión de administrador abierta
    localStorage.setItem(CLAVE_SESION, id);
    return { uid: id, esJugador: true, nombre: perfil.nombre };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    // Se entra con usuario (ej. wendy) o con correo (administradores)
    const entrada = e.target.usuario.value.trim();
    const password = e.target.password.value.trim();

    try {
      // 1. Autenticar: correo → Firebase Authentication (administrador); usuario → contraseña propia verificada en el servidor
      const sesion = await iniciarSesion(entrada, password);

      if (!sesion.esJugador) try {
        // 2. Buscar datos del perfil en Firestore (Colección "usuario")
        const userDocRef = doc(db, "usuario", sesion.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.nombre) {
            localStorage.setItem("userName", data.nombre); 
          }
          if (data.rol) {
            localStorage.setItem("userRole", data.rol); 
          }
        }
      } catch (firestoreError) {
        console.error("Error al obtener perfil de Firestore:", firestoreError);
      }

      // 3. Entrar al sistema (sin aviso: la pantalla de carga ya indica que se está iniciando)
      navigate("/menuPrincipal", { replace: true });

    } catch (error) {
      const incorrecto = ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(error.code);
      setAviso(
        incorrecto ? { icono: "clave", titulo: "Usuario o contraseña incorrectos", texto: "Revisa tus datos y vuelve a intentarlo. Si olvidaste tu contraseña, pídele al administrador que te asigne una nueva." }
          : error.code === "auth/too-many-requests" ? { icono: "reloj", titulo: "Demasiados intentos", texto: "Por seguridad, espera unos minutos antes de intentarlo otra vez." }
          : error.code === "auth/network-request-failed" ? { icono: "red", titulo: "Sin conexión", texto: "No pudimos conectarnos. Verifica tu internet e inténtalo de nuevo." }
          : { icono: "alerta", titulo: "Algo salió mal", texto: "No se pudo iniciar sesión. Inténtalo otra vez en un momento." },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Adornos del fondo */}
      <span className="lg-deco d1" aria-hidden="true" />
      <span className="lg-deco d2" aria-hidden="true" />
      <span className="lg-deco d3" aria-hidden="true" />

      <Link to="/" className="lg-volver" aria-label="Volver al inicio"><FiArrowLeft /> <span>Inicio</span></Link>

      <main className="lg-centro">
        <div className="lg-logo"><Cerdito3D /></div>
        <h1>Bienvenido de nuevo</h1>
        <p className="lg-sub">Ingresa para continuar</p>

        <form onSubmit={handleSubmit} className="lg-form">
          <div className="lg-campo">
            <label htmlFor="usuario">Usuario o correo</label>
            <div className="lg-input">
              <FiUser className="lg-icono" />
              <input id="usuario" type="text" name="usuario" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="tu usuario" required disabled={loading} />
            </div>
          </div>

          <div className="lg-campo">
            <label htmlFor="password">Contraseña</label>
            <div className="lg-input">
              <FiLock className="lg-icono" />
              <input id="password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="••••••••" required disabled={loading} />
              <button type="button" className="lg-ojo" onClick={() => setShowPassword(!showPassword)} disabled={loading} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="button" className="lg-olvide" onClick={olvideClave} disabled={loading}>¿Olvidaste tu contraseña?</button>

          <button type="submit" disabled={loading} className="lg-entrar">
            {loading ? (
              <span className="loading-state"><span className="spinner"></span> Verificando...</span>
            ) : (
              <>Ingresar <span className="lg-flecha"><FiArrowRight /></span></>
            )}
          </button>
        </form>

        {aviso && (
        <div className="lg-aviso-fondo" onClick={cerrarAviso} role="presentation">
          <div className="lg-aviso" role="alertdialog" aria-modal="true" aria-labelledby="lg-aviso-titulo" onClick={(e) => e.stopPropagation()}>
            <span className={`lg-aviso-icono ${aviso.icono}`}>
              {aviso.icono === "reloj" ? <FiClock /> : aviso.icono === "red" ? <FiWifiOff /> : aviso.icono === "clave" ? <FiLock /> : <FiAlertCircle />}
            </span>
            <h2 id="lg-aviso-titulo">{aviso.titulo}</h2>
            <p>{aviso.texto}</p>
            <button type="button" className="lg-entrar lg-aviso-boton" onClick={cerrarAviso} autoFocus>{aviso.icono === "clave" ? "Intentar de nuevo" : "Entendido"}</button>
          </div>
        </div>
      )}

      <p className="lg-ayuda">¿Aún no tienes cuenta? Pídele a tu administrador que te registre en su pasanaku.</p>
      </main>

      <footer className="lg-pie">Pasanaku · Ahorro rotativo</footer>
    </div>
  );
};

export default Login;
