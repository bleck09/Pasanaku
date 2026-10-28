// Ubicacion.jsx
import React, { useState } from "react";
import { FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import "./Ubicacion.css";

const Ubicacion = () => {
  const [mostrarCard, setMostrarCard] = useState(false);

  const toggleCard = () => setMostrarCard(!mostrarCard);

  const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/PNXY8tamybJ1E3STA";

  return (
    <section className="ubicacion-section">
      <div className="ubicacion-mapa-wrapper">
        {/* Marcador animado */}
        <button className="ubicacion-marcador" onClick={toggleCard}>
          <FaMapMarkerAlt />
        </button>

        {/* Card con información */}
        {mostrarCard && (
          <div className="ubicacion-card">
            <button className="ubicacion-cerrar-card" onClick={toggleCard}>
              <FaTimes />
            </button>
            <h3 className="ubicacion-titulo">Casa de Luis Miguel</h3>
            <img
              src="/Luis/imagenes/Ubicacion.webp"
              alt="Casa de Luis Miguel"
              className="ubicacion-imagen-casa"
            />
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ubicacion-boton-abrir-mapa"
            >
              <FaMapMarkerAlt style={{ marginRight: "8px" }} />
              Ver ubicación
            </a>
          </div>
        )}

        {/* Mapa embebido en satélite, sin interacción */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3818.245607620219!2d-66.2618245789387!3d-17.39399779786254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sbo!4v1702476000000!5m2!1ses-419!2sbo&layer=c"
          width="100%"
          height="400"
          style={{ border: 0, pointerEvents: "none" }}
          loading="lazy"
          title="Mapa Casa de Luis Miguel"
        ></iframe>
      </div>
    </section>
  );
};

export default Ubicacion;
