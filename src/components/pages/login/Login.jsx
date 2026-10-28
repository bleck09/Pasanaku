import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

// Iconos
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Cerdito3D from "../home/Cerdito3D";
import { normalizarUsuario } from "../menuPrincipal/acciones";
import { hashClave, verificarClave } from "../menuPrincipal/claves";
import { CLAVE_SESION } from "../menuPrincipal/sesion";
import "./Login.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!(await verificarClave(password, perfil))) throw incorrecto;

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
      navigate("/menuPrincipal");

    } catch (error) {
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        toast.error("Credenciales incorrectas. Revisa tu correo o contraseña.", {
          style: { background: "#FFFFFF", color: "#1F2D3D", border: "1px solid #D4504F" },
          iconTheme: { primary: "#D4504F", secondary: "#FFFFFF" }
        });
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.", {
          style: { background: "#FFFFFF", color: "#1F2D3D", border: "1px solid #D4504F" }
        });
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Sin conexión. Verifica tu internet.", {
          style: { background: "#FFFFFF", color: "#1F2D3D", border: "1px solid #D4504F" }
        });
      } else {
        toast.error("Ocurrió un error inesperado.", {
          style: { background: "#FFFFFF", color: "#1F2D3D", border: "1px solid #D4504F" }
        });
      }
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

        <p className="lg-ayuda">¿Aún no tienes cuenta? Pídele a tu administrador que te registre en su pasanaku.</p>
      </main>

      <footer className="lg-pie">Pasanaku · Ahorro rotativo</footer>
    </div>
  );
};

export default Login;
