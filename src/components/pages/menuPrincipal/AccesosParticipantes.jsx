import React, { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiCopy, FiEye, FiEyeOff, FiKey, FiLock, FiMessageCircle, FiSend } from "react-icons/fi";
import Avatar from "./Avatar";

const enlaceApp = () => `${window.location.origin}${import.meta.env.BASE_URL}#/login`;

const mensajeAcceso = (grupo, nombre, usuario, clave) =>
  `Hola ${nombre}, ya estás en el pasanaku "${grupo.nombre}".\nEntra aquí: ${enlaceApp()}\nUsuario: ${usuario}\nContraseña: ${clave}\n(La primera vez te pedirá elegir tu propia contraseña.)`;

// Número de WhatsApp: si tiene 8 dígitos se asume Bolivia (+591)
const numeroWhatsApp = (telefono) => {
  const digitos = (telefono || "").replace(/\D/g, "");
  if (digitos.length < 7) return "";
  return digitos.length === 8 ? `591${digitos}` : digitos;
};

const copiar = async (texto, aviso) => {
  try { await navigator.clipboard.writeText(texto); toast.success(aviso); }
  catch { toast.error("No se pudo copiar."); }
};

// Solo para el administrador: usuario y contraseña temporal de cada participante, para entregárselos.
// La contraseña solo se ve mientras la persona no la haya cambiado; después es privada.
const AccesosParticipantes = ({ grupo, lista, jugadores, temporales, usuarioDe, guardando, onCrear, onNueva }) => {
  const [visibles, setVisibles] = useState(() => new Set());
  const alternar = (id) => setVisibles((previo) => { const nuevo = new Set(previo); if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id); return nuevo; });

  const filas = lista.map((p) => {
    const jugador = jugadores.find((j) => j.id === p.uid);
    const temporal = temporales.find((t) => t.id === p.uid);
    return { p, usuario: p.uid ? usuarioDe(p.uid) : "", esJugador: Boolean(jugador), clave: temporal?.clave || "" };
  });
  const conClave = filas.filter((f) => f.clave);

  const copiarTodos = () => copiar(
    conClave.map((f) => `${f.p.nombre}\nUsuario: ${f.usuario}\nContraseña: ${f.clave}`).join("\n\n"),
    `Copiados los accesos de ${conClave.length} persona(s)`,
  );

  return (
    <div className="pk-accesos">
      <div className="pk-accesos-cab">
        <p>Datos para entregar a cada persona. La contraseña se ve hasta que ella elige la suya.</p>
        {conClave.length > 1 && <button type="button" className="pk-btn pk-btn-ghost" onClick={copiarTodos}><FiCopy /> Copiar todos</button>}
      </div>

      <div className="pk-accesos-lista">
        {filas.map(({ p, usuario, esJugador, clave }) => {
          const ver = visibles.has(p.id);
          const whatsapp = numeroWhatsApp(p.telefono);
          return (
            <div key={p.id} className="pk-acceso">
              <div className="pk-acceso-cab">
                <Avatar nombre={p.nombre} tam={38} />
                <strong>{p.nombre}</strong>
                <span className="pk-turno" title={`Turno ${p.turno}`}>{p.turno}</span>
              </div>

              {!p.uid ? (
                <div className="pk-acceso-vacio">
                  <span>Todavía no tiene usuario ni contraseña.</span>
                  <button type="button" className="pk-btn" onClick={() => onCrear(p)} disabled={guardando}><FiKey /> Crear acceso</button>
                </div>
              ) : !esJugador ? (
                <p className="pk-acceso-nota"><FiLock /> Entra con su correo y su contraseña (cuenta de administrador).</p>
              ) : (
                <>
                  <div className="pk-acceso-campos">
                    <div className="pk-acceso-campo">
                      <span>Usuario</span>
                      <code>{usuario}</code>
                      <button type="button" className="pk-icon" title="Copiar usuario" aria-label={`Copiar usuario de ${p.nombre}`} onClick={() => copiar(usuario, "Usuario copiado")}><FiCopy /></button>
                    </div>
                    <div className="pk-acceso-campo">
                      <span>Contraseña</span>
                      {clave ? (
                        <>
                          <code>{ver ? clave : "•".repeat(Math.min(clave.length, 10))}</code>
                          <button type="button" className="pk-icon" title={ver ? "Ocultar" : "Mostrar"} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => alternar(p.id)}>{ver ? <FiEyeOff /> : <FiEye />}</button>
                          <button type="button" className="pk-icon" title="Copiar contraseña" aria-label={`Copiar contraseña de ${p.nombre}`} onClick={() => copiar(clave, "Contraseña copiada")}><FiCopy /></button>
                        </>
                      ) : (
                        <em><FiLock /> La cambió la persona: solo ella la conoce</em>
                      )}
                    </div>
                  </div>
                  <div className="pk-acceso-acciones">
                    {clave && <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => copiar(mensajeAcceso(grupo, p.nombre, usuario, clave), "Mensaje copiado")}><FiSend /> Copiar mensaje</button>}
                    {clave && whatsapp && (
                      <a className="pk-btn pk-btn-ghost pk-btn-mini" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeAcceso(grupo, p.nombre, usuario, clave))}`}><FiMessageCircle /> WhatsApp</a>
                    )}
                    <button type="button" className="pk-btn pk-btn-ghost pk-btn-mini" onClick={() => onNueva({ uid: p.uid, nombre: p.nombre, usuario })}><FiKey /> {clave ? "Cambiar contraseña" : "Nueva contraseña"}</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

AccesosParticipantes.propTypes = {
  grupo: PropTypes.object.isRequired,
  lista: PropTypes.array.isRequired,
  jugadores: PropTypes.array.isRequired,
  temporales: PropTypes.array.isRequired,
  usuarioDe: PropTypes.func.isRequired,
  guardando: PropTypes.bool,
  onCrear: PropTypes.func.isRequired,
  onNueva: PropTypes.func.isRequired,
};

export default AccesosParticipantes;
