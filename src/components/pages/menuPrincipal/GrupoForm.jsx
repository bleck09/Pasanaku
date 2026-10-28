import React from "react";
import PropTypes from "prop-types";
import { FiCalendar, FiUsers, FiDollarSign, FiFlag } from "react-icons/fi";
import { describirFrecuencia, fechaRonda, formatFecha, money } from "./pasanakuUtils";

const FRECUENCIAS_UI = [
  { id: "semanal", titulo: "Cada semana", sub: "Un día fijo, ej. los domingos" },
  { id: "bisemanal", titulo: "Cada 2 semanas", sub: "Un día fijo, cada 14 días" },
  { id: "mensual", titulo: "Cada mes", sub: "Un día fijo, ej. el 15" },
  { id: "finDeMes", titulo: "Fin de mes", sub: "El último día de cada mes" },
  { id: "quincenal", titulo: "Quincenal", sub: "El 15 y el fin de mes" },
];
const DIAS = [
  { n: 1, c: "Lun" }, { n: 2, c: "Mar" }, { n: 3, c: "Mié" }, { n: 4, c: "Jue" },
  { n: 5, c: "Vie" }, { n: 6, c: "Sáb" }, { n: 0, c: "Dom" },
];

const GrupoForm = ({ form, setForm, editando, minCupos, onSubmit, onCancelar }) => {
  const set = (campo, valor) => setForm({ ...form, [campo]: valor });
  const cupos = Number(form.cupos) || 0;
  const cuota = Number(form.cuota) || 0;
  const multa = Number(form.multa) || 0;
  const grupoPrev = { ...form, diaSemana: Number(form.diaSemana), diaMes: Number(form.diaMes) };
  const hayPrev = form.fechaInicio && cupos >= 2;
  const fechas = hayPrev ? Array.from({ length: cupos }, (_, i) => fechaRonda(grupoPrev, i + 1)) : [];
  const usaDiaSemana = form.frecuencia === "semanal" || form.frecuencia === "bisemanal";

  return (
    <form className="pk-card pkf" onSubmit={onSubmit}>
      <div className="pkf-fila">
        <label className="pkf-campo">Nombre
          <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej: Pasanaku Oficina 2026" required />
        </label>
        <label className="pkf-campo">Cuota por persona (Bs.)
          <input type="number" min="1" step="any" value={form.cuota} onChange={(e) => set("cuota", e.target.value)} required />
        </label>
        <label className="pkf-campo">Nº de participantes
          <input type="number" min={Math.max(2, minCupos)} max="100" value={form.cupos} onChange={(e) => set("cupos", e.target.value)} required />
        </label>
      </div>

      <div className="pkf-bloque">
        <span className="pkf-titulo">Multa por retraso <small>(opcional)</small></span>
        <div className="pkf-fila pkf-fila-multa">
          <label className="pkf-campo">Monto de la multa (Bs.)
            <input type="number" min="0" step="any" value={form.multa} onChange={(e) => set("multa", e.target.value)} placeholder="0 = sin multa" />
          </label>
          {multa > 0 && (
            <label className="pkf-campo">Días de gracia antes de la multa
              <input type="number" min="0" max="30" step="1" value={form.diasGracia} onChange={(e) => set("diasGracia", e.target.value)} />
            </label>
          )}
        </div>
        <small className="pkf-nota">
          {multa > 0
            ? `Quien pague después de la fecha de cobro${Number(form.diasGracia) > 0 ? ` + ${Number(form.diasGracia)} día${Number(form.diasGracia) === 1 ? "" : "s"} de gracia` : ""}, pagará ${money(multa)} más en esa cuota.`
            : "Si lo dejas en 0, no se cobra multa."}
        </small>
      </div>

      <div className="pkf-bloque">
        <span className="pkf-titulo">¿Cada cuánto se paga?</span>
        <div className="pkf-opciones">
          {FRECUENCIAS_UI.map((f) => (
            <button type="button" key={f.id} className={`pkf-opcion ${form.frecuencia === f.id ? "activa" : ""}`} onClick={() => set("frecuencia", f.id)}>
              <strong>{f.titulo}</strong>
              <small>{f.sub}</small>
            </button>
          ))}
        </div>
      </div>

      {usaDiaSemana && (
        <div className="pkf-bloque">
          <span className="pkf-titulo">¿Qué día de la semana?</span>
          <div className="pkf-dias">
            {DIAS.map((d) => (
              <button type="button" key={d.n} className={`pkf-dia ${Number(form.diaSemana) === d.n ? "activa" : ""}`} onClick={() => set("diaSemana", d.n)}>{d.c}</button>
            ))}
          </div>
        </div>
      )}

      {form.frecuencia === "mensual" && (
        <div className="pkf-bloque">
          <span className="pkf-titulo">¿Qué día del mes? <small>(en meses más cortos se usa el último día)</small></span>
          <div className="pkf-mes">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <button type="button" key={n} className={`pkf-num ${Number(form.diaMes) === n ? "activa" : ""}`} onClick={() => set("diaMes", n)}>{n}</button>
            ))}
          </div>
        </div>
      )}

      <div className="pkf-bloque">
        <span className="pkf-titulo">¿Desde cuándo?</span>
        <input className="pkf-fecha" type="date" value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} required />
        <small className="pkf-nota">La 1ª ronda es la primera fecha que cumpla la frecuencia a partir de este día.</small>
      </div>

      <div className="pkf-resumen">
        <div><FiDollarSign /><span>Pozo por ronda</span><strong>{money(cuota * cupos)}</strong></div>
        <div><FiUsers /><span>Rondas</span><strong>{cupos >= 2 ? `${cupos} (1 por persona)` : "—"}</strong></div>
        <div><FiCalendar /><span>Empieza</span><strong>{hayPrev ? formatFecha(fechas[0]) : "—"}</strong></div>
        <div><FiFlag /><span>Termina</span><strong>{hayPrev ? formatFecha(fechas[fechas.length - 1]) : "—"}</strong></div>
      </div>

      {hayPrev && (
        <div className="pkf-bloque">
          <span className="pkf-titulo">Calendario de pagos · {describirFrecuencia(grupoPrev)}</span>
          <div className="pkf-fechas">
            {fechas.map((f, i) => (
              <span key={i} className="pkf-fecha-chip"><b>{i + 1}</b>{formatFecha(f)}</span>
            ))}
          </div>
        </div>
      )}

      <div className="pk-actions">
        <button type="button" className="pk-btn pk-btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="pk-btn">{editando ? "Guardar cambios" : "Crear pasanaku"}</button>
      </div>
    </form>
  );
};

GrupoForm.propTypes = {
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  editando: PropTypes.bool,
  minCupos: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

export default GrupoForm;
