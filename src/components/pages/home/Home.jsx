import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiShield, FiUsers, FiStar, FiChevronDown } from "react-icons/fi";
import { MdSavings, MdGroups, MdEmojiEvents } from "react-icons/md";
import Cerdito3D from "./Cerdito3D";
import "./Home.css";

const PASOS = [
  { icono: <MdGroups />, titulo: "Forman el grupo", texto: "Definen la cuota, la frecuencia y quiénes participan." },
  { icono: <MdSavings />, titulo: "Aportan cada ronda", texto: "Todos pagan su cuota y se ve quién ya cumplió." },
  { icono: <MdEmojiEvents />, titulo: "Uno cobra el pozo", texto: "Según el turno, un integrante recibe todo lo reunido." },
];

// Página de inicio: directa y corta. Una portada con el botón de ingreso y, más abajo, qué es un pasanaku y cómo funciona
const Home = () => (
  <div className="lp">
    <div className="lp-azul">
      <span className="lp-deco d1" aria-hidden="true" />
      <span className="lp-deco d2" aria-hidden="true" />
      <header className="lp-nav">
        <span className="lp-marca"><MdSavings /> <span><b>PASA</b>NAKU</span></span>
        <Link to="/login" className="lp-nav-login">Ingresar</Link>
      </header>

      <section className="lp-hero">
        <div className="lp-ilustracion">
          <span className="lp-fondo" aria-hidden="true" />
          <Cerdito3D />
          <span className="lp-chip c1" aria-hidden="true"><FiUsers /> Con tu grupo</span>
          <span className="lp-chip c2" aria-hidden="true">Tú eliges la cuota</span>
        </div>

        <div className="lp-texto">
          <h1>Ahorra <span>juntos</span>,<br />cobra en tu turno</h1>
          <p>Organiza tu pasanaku sin papeles: turnos, aportes y entregas del pozo en un solo lugar.</p>
          <Link to="/login" className="lp-boton">Comenzar <FiArrowRight /></Link>
          <a href="#que-es" className="lp-mas">Qué es un pasanaku <FiChevronDown /></a>
        </div>
      </section>

      <svg className="lp-ola" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
        <path className="atras" d="M0,70 C220,10 430,20 650,70 C880,122 1130,122 1440,40 L1440,140 L0,140 Z" />
        <path className="frente" d="M0,92 C240,142 470,30 720,70 C970,110 1200,140 1440,78 L1440,140 L0,140 Z" />
      </svg>
    </div>

    <section id="que-es" className="lp-info">
      <h2>¿Qué es un <span>pasanaku</span>?</h2>
      <p className="lp-info-texto">
        Una tradición boliviana de ahorro entre amigos: cada integrante aporta una cuota fija y, por turnos, uno recibe el pozo completo. Esta plataforma lleva el control para que todos vean cómo va el grupo.
      </p>

      <div className="lp-pasos">
        {PASOS.map((p, i) => (
          <div key={p.titulo} className="lp-paso">
            <span className="lp-paso-num">{i + 1}</span>
            <span className="lp-paso-icono">{p.icono}</span>
            <div><strong>{p.titulo}</strong><small>{p.texto}</small></div>
          </div>
        ))}
      </div>

      <div className="lp-pildoras">
        <span><FiShield /> Transparente</span>
        <span><FiUsers /> En grupo</span>
        <span><FiStar /> Sin intereses</span>
      </div>

      <Link to="/login" className="lp-boton lp-boton-final">Entrar a mi cuenta <FiArrowRight /></Link>
    </section>

    <footer className="lp-pie">&copy; {new Date().getFullYear()} Pasanaku · Ahorro rotativo</footer>
  </div>
);

export default Home;
