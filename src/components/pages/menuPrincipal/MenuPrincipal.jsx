import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

// Firebase
import { auth, db } from "../../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, terminate, clearIndexedDbPersistence } from "firebase/firestore";

// Íconos
import { FiPieChart, FiLogOut, FiMenu, FiX, FiUser, FiChevronDown, FiLayers, FiGift, FiAperture, FiUserPlus, FiCalendar, FiGrid } from "react-icons/fi";

// Módulos
import Cargando from './Cargando';
// El resumen del administrador trae las gráficas: se descarga solo cuando se abre
const Resumen = lazy(() => import('./Resumen'));
import Grupos from './Grupos';
import CambiarClave from './CambiarClave';
import { ConfirmHost } from './Confirmar';
import Jugadores from './Jugadores';
import MisPasanakus from './MisPasanakus';
import Perfil from './Perfil';
import Ruleta from './Ruleta';
import Entregas from './Entregas';
import CampanaPendientes from './CampanaPendientes';
import MigracionSeguridad from './MigracionSeguridad';
import OcupadoHost from './OcupadoHost';
import Avatar from './Avatar';
import Splash from './Splash';
import AvisoSinConexion from './AvisoSinConexion';
import { CLAVE_SESION, OMITIR_CLAVE } from './sesion';

import './MenuPrincipal.css';
import './Responsive.css';

const MenuPrincipal = () => {
  // En celular las tablas se muestran como tarjetas: cada celda lleva el nombre de su columna (data-label) para poder rotularla
  useEffect(() => {
    const etiquetar = () => {
      document.querySelectorAll("table.pk-tabla").forEach((tabla) => {
        const cabecera = [...tabla.querySelectorAll("thead th")].map((th) => th.textContent.trim());
        tabla.querySelectorAll("tbody tr").forEach((fila) => {
          [...fila.children].forEach((celda, i) => {
            if (cabecera[i] && celda.dataset.label !== cabecera[i]) celda.dataset.label = cabecera[i];
          });
        });
      });
    };
    etiquetar();
    const observador = new MutationObserver(etiquetar);
    observador.observe(document.body, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);

  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [idUsuario, setIdUsuario] = useState(""); // uid del administrador o usuario del jugador
  const [usuarioLogin, setUsuarioLogin] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [activeView, setActiveView] = useState("");
  const [cargando, setCargando] = useState(true);
  const [debeCambiarClave, setDebeCambiarClave] = useState(false);
  const [claveOmitida, setClaveOmitida] = useState(() => localStorage.getItem(OMITIR_CLAVE) === '1');
  const omitirClave = () => { localStorage.setItem(OMITIR_CLAVE, '1'); setClaveOmitida(true); };
  const [destino, setDestino] = useState(null); // { grupoId, participanteId, ronda }: pago a revisar al que se salta desde la campana
  const irARevisar = (d) => { setDestino(d); setActiveView('grupos'); setMenuAbierto(false); };

  // Controles de Menús Desplegables
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilDesplegado, setPerfilDesplegado] = useState(false);

  // Estructura del menú
  // Dos roles: "administrador" (crea y gestiona pasanakus) y "jugador"
  const ADMIN = ['administrador'];
  const JUGADOR = ['jugador'];
  const menuItems = [
    // Administración: lo que solo hace el administrador
    { id: 'resumen', label: 'Resumen', icon: <FiPieChart />, seccion: 'Administración', component: <Resumen onIr={irARevisar} />, roles: ADMIN },
    { id: 'grupos', label: 'Pasanakus', icon: <FiGrid />, seccion: 'Administración', component: <Grupos destino={destino} onDestinoUsado={() => setDestino(null)} />, roles: ADMIN },
    { id: 'jugadores', label: 'Jugadores', icon: <FiUserPlus />, seccion: 'Administración', component: <Jugadores />, roles: ADMIN },
    { id: 'entregas', label: 'Entregas del pozo', icon: <FiGift />, seccion: 'Administración', component: <Entregas />, roles: ADMIN },
    { id: 'ruleta', label: 'Ruleta', icon: <FiAperture />, seccion: 'Administración', component: <Ruleta />, roles: ADMIN },
    // Mi participación: lo que ve cualquier persona que juega (también el administrador cuando juega)
    { id: 'mis', label: 'Mis pasanakus', icon: <FiLayers />, seccion: 'Mi participación', component: <MisPasanakus />, roles: [...ADMIN, ...JUGADOR] },
    { id: 'ruleta-libre', label: 'Ruleta', icon: <FiAperture />, seccion: 'Mi participación', component: <Ruleta simple />, roles: JUGADOR },
    {
      id: 'perfil', label: 'Mi perfil', icon: <FiUser />, seccion: 'Cuenta', roles: [...ADMIN, ...JUGADOR],
      component: <Perfil id={idUsuario} nombre={userName} usuario={usuarioLogin} rol={role} foto={fotoPerfil} onFoto={setFotoPerfil} />,
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "usuario", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const rolSeguro = data.rol ? data.rol.toLowerCase() : "sin rol";
            setDebeCambiarClave(data.debeCambiarClave === true);
            
            setRole(rolSeguro);
            setUserName(data.nombre || "Usuario Desconocido");
            setIdUsuario(user.uid);
            setUsuarioLogin(user.email || "");
            setFotoPerfil(data.fotoUrl || "");

            const allowed = menuItems.filter(item => item.roles.includes(rolSeguro));
            if (allowed.length > 0) setActiveView(allowed[0].id);
          } else {
            toast.error("Tu usuario no tiene perfil asignado.");
          }
        } catch {
          toast.error("Error de conexión con la base de datos.");
        }
      } else {
        // Sin Firebase Authentication: puede ser un jugador con sesión propia (colección "jugadores")
        const id = localStorage.getItem(CLAVE_SESION);
        let jugadorOk = false;
        if (id) {
          try {
            const snap = await getDoc(doc(db, "jugadores", id));
            if (snap.exists()) {
              const data = snap.data();
              setRole("jugador");
              setUserName(data.nombre || id);
              setIdUsuario(id);
              setUsuarioLogin(data.usuario || id);
              setFotoPerfil((await getDoc(doc(db, "perfiles", id)).catch(() => null))?.data()?.fotoUrl || "");
              setDebeCambiarClave(data.debeCambiarClave === true);
              setActiveView("mis");
              jugadorOk = true;
            } else {
              localStorage.removeItem(CLAVE_SESION);
            }
          } catch {
            toast.error("Error de conexión con la base de datos.");
          }
        }
        if (!jugadorOk) navigate("/login");
      }
      setCargando(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      // Se borran también los datos guardados en el celular (por si lo usa otra persona) y se recarga la app
      try { await terminate(db); await clearIndexedDbPersistence(db); } catch { /* si no se pudo borrar, igual se cierra la sesión */ }
      window.location.hash = "#/login";
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const itemsPermitidos = menuItems.filter((item) => item.roles.includes(role));
  // Las opciones se agrupan por sección, en el orden en que aparecen
  const secciones = itemsPermitidos.reduce((lista, item) => {
    const existente = lista.find((x) => x.nombre === item.seccion);
    if (existente) existente.items.push(item); else lista.push({ nombre: item.seccion, items: [item] });
    return lista;
  }, []);
  const vistaActual = menuItems.find((item) => item.id === activeView);
  const fechaHoy = new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
  const primerNombre = (userName || "").split(" ")[0];

  if (cargando) return <Splash />;

  if (debeCambiarClave && !claveOmitida) return <CambiarClave nombre={userName} onListo={() => setDebeCambiarClave(false)} onOmitir={omitirClave} onSalir={handleLogout} />;

  return (
    <div className="app-shell">
      <ConfirmHost />
      <OcupadoHost />
      <AvisoSinConexion />
      {role === 'administrador' && <MigracionSeguridad />}

      {menuAbierto && <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} />}

      {/* ===== Menú lateral ===== */}
      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sb-marca">
          <span className="sb-logo"><FiLayers /></span>
          <div>
            <strong>PASA<span>NAKU</span></strong>
            <small>Ahorro rotativo</small>
          </div>
          <button type="button" className="sb-cerrar" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"><FiX /></button>
        </div>

        <nav className="sb-nav">
          {secciones.map((seccion) => (
            <div className="sb-grupo" key={seccion.nombre}>
              <span className="sb-seccion">{seccion.nombre}</span>
              {seccion.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sb-item ${activeView === item.id ? 'activo' : ''}`}
                  onClick={() => { setActiveView(item.id); setMenuAbierto(false); }}
                >
                  <span className="sb-icono">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button type="button" className="sb-salir" onClick={handleLogout}><FiLogOut /> Cerrar sesión</button>
      </aside>

      {/* ===== Zona principal: barra superior + contenido ===== */}
      <div className="app-main">
        <header className="topbar">
          <button type="button" className="menu-toggle" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><FiMenu /></button>

          <div className="topbar-titulo">
            <h1>Hola, {primerNombre || "bienvenido"}</h1>
            <p>{vistaActual?.label || "Pasanaku"}</p>
          </div>

          <div className="topbar-der">
            {role === 'administrador' && <CampanaPendientes onIr={irARevisar} />}
            <span className="topbar-fecha"><FiCalendar /> {fechaHoy}</span>

            <div className="topbar-perfil">
              <button type="button" className="perfil-boton" onClick={() => setPerfilDesplegado(!perfilDesplegado)}>
                <Avatar nombre={userName} foto={fotoPerfil} tam={42} className="perfil-avatar" />
                <span className="perfil-texto">
                  <strong>{userName}</strong>
                  <small>{role}</small>
                </span>
                <FiChevronDown />
              </button>

              {perfilDesplegado && (
                <>
                  <div className="perfil-fondo" onClick={() => setPerfilDesplegado(false)} />
                  <div className="perfil-menu">
                    <button type="button" className="perfil-opcion" onClick={() => { setActiveView('perfil'); setPerfilDesplegado(false); }}><FiUser /> Mi perfil</button>
                    <button type="button" className="perfil-opcion peligro" onClick={handleLogout}><FiLogOut /> Cerrar sesión</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="app-contenido">
          <Suspense fallback={<Cargando />}>{vistaActual ? vistaActual.component : <div className="pk-vacio">Selecciona una opción del menú</div>}</Suspense>
        </main>
      </div>
    </div>
  );
};

export default MenuPrincipal;
