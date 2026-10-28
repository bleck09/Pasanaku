import React from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { FiCopy, FiX, FiKey } from "react-icons/fi";
import "./Pasanaku.css";

// Muestra una sola vez usuario y contraseña temporal (de una o varias personas) para que el administrador los entregue
const Credenciales = ({ datos, onCerrar }) => {
  const lista = Array.isArray(datos) ? datos : [datos];
  const enlace = `${window.location.origin}${import.meta.env.BASE_URL}#/login`;
  const mensaje = (d) => `Pasanaku\nUsuario: ${d.usuario}\nContraseña temporal: ${d.clave}\nEntra aquí: ${enlace}\n(Al entrar tendrás que crear tu propia contraseña)`;
  const textoTodos = lista.length === 1
    ? mensaje(lista[0])
    : lista.map((d) => `${d.nombre}\nUsuario: ${d.usuario}\nContraseña temporal: ${d.clave}`).join("\n\n") + `\n\nEntrar: ${enlace}`;

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Copiado");
    } catch {
      toast.error("No se pudo copiar. Anótalos manualmente.");
    }
  };

  return (
    <div className="pk-card pk-credenciales">
      <div className="pk-ronda-cab">
        <h3><FiKey /> {lista.length === 1 ? `Datos de acceso de ${lista[0].nombre}` : `Datos de acceso (${lista.length} personas)`}</h3>
        <button className="pk-icon" title="Cerrar" onClick={onCerrar}><FiX /></button>
      </div>

      {lista.map((d) => (
        <div key={d.usuario} className="pk-cred-fila">
          {lista.length > 1 && <strong className="pk-cred-nombre">{d.nombre}</strong>}
          <div className="pk-cred-datos">
            <div><span>Usuario</span><strong>{d.usuario}</strong></div>
            <div><span>Contraseña temporal</span><strong>{d.clave}</strong></div>
          </div>
          {lista.length > 1 && <button className="pk-icon" title="Copiar mensaje" onClick={() => copiar(mensaje(d))}><FiCopy /></button>}
        </div>
      ))}

      <p className="pk-nota-linea">
        Entrégalos por un medio privado. Puedes volver a ver la contraseña temporal mientras la persona no entre; <strong>cuando elija la suya, solo ella la conocerá</strong>.
      </p>
      <button className="pk-btn" onClick={() => copiar(textoTodos)}><FiCopy /> {lista.length === 1 ? "Copiar mensaje para enviar" : "Copiar todos"}</button>
    </div>
  );
};

Credenciales.propTypes = {
  datos: PropTypes.oneOfType([
    PropTypes.shape({ nombre: PropTypes.string, usuario: PropTypes.string, clave: PropTypes.string }),
    PropTypes.arrayOf(PropTypes.shape({ nombre: PropTypes.string, usuario: PropTypes.string, clave: PropTypes.string })),
  ]).isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export default Credenciales;
