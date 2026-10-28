import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase";

export const FRECUENCIAS = {
  semanal: "Cada semana (un día fijo)",
  bisemanal: "Cada 2 semanas (un día fijo)",
  mensual: "Cada mes (un día fijo, ej. el 15)",
  finDeMes: "Fin de cada mes",
  quincenal: "Dos veces al mes (el 15 y fin de mes)",
};

export const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const money = (n) =>
  `Bs. ${Number(n || 0).toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const parseFecha = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const ultimoDia = (y, m) => new Date(y, m + 1, 0).getDate();

// Descripción legible de la frecuencia: "Cada domingo", "El 15 de cada mes"...
export const describirFrecuencia = (grupo) => {
  const inicio = grupo.fechaInicio ? parseFecha(grupo.fechaInicio) : null;
  const dia = DIAS_SEMANA[grupo.diaSemana ?? inicio?.getDay() ?? 0];
  switch (grupo.frecuencia) {
    case "semanal": return `Cada ${dia}`;
    case "bisemanal": return `Cada 2 semanas, el ${dia}`;
    case "finDeMes": return "Fin de cada mes";
    case "quincenal": return "El 15 y fin de cada mes";
    default: return `El ${grupo.diaMes ?? inicio?.getDate() ?? 1} de cada mes`;
  }
};

// Fecha de la ronda `ronda` (1 = primera ocurrencia en o después de fechaInicio)
export const fechaRonda = (grupo, ronda) => {
  if (!grupo?.fechaInicio) return null;
  const inicio = parseFecha(grupo.fechaInicio);

  if (grupo.frecuencia === "semanal" || grupo.frecuencia === "bisemanal") {
    const dia = grupo.diaSemana ?? inicio.getDay();
    const primera = new Date(inicio);
    primera.setDate(primera.getDate() + ((dia - inicio.getDay() + 7) % 7));
    primera.setDate(primera.getDate() + (grupo.frecuencia === "semanal" ? 7 : 14) * (ronda - 1));
    return primera;
  }

  // Frecuencias mensuales: se recorren los meses juntando los días que cumplen
  let y = inicio.getFullYear();
  let m = inicio.getMonth();
  let encontradas = 0;
  for (let i = 0; i < 1200; i++, m++) {
    const ult = ultimoDia(y + Math.floor(m / 12), m % 12);
    const dias = grupo.frecuencia === "finDeMes" ? [ult]
      : grupo.frecuencia === "quincenal" ? [15, ult]
      : [Math.min(grupo.diaMes ?? inicio.getDate(), ult)];
    for (const d of dias) {
      const fecha = new Date(y + Math.floor(m / 12), m % 12, d);
      if (fecha < inicio) continue;
      if (++encontradas === ronda) return fecha;
    }
  }
  return null;
};

export const formatFecha = (fecha) =>
  fecha ? fecha.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Un pasanaku ya iniciado no admite cambios de participantes (los creados antes del botón Iniciar se deducen por la ronda)
export const estaIniciado = (grupo) => grupo.iniciado ?? grupo.rondaActual > 1;

// "En curso" | "Armando" | "Finalizado"
export const estadoGrupo = (grupo) => (grupo.estado === "finalizado" ? "Finalizado" : estaIniciado(grupo) ? "En curso" : "Armando");

export const pagoId = (grupoId, ronda, participanteId) => `${grupoId}_${ronda}_${participanteId}`;
export const entregaId = (grupoId, ronda) => `${grupoId}_${ronda}`;

// Último momento para pagar la cuota de una ronda sin multa: la fecha de la ronda más los días de gracia
export const limiteSinMulta = (grupo, ronda) => {
  const f = fechaRonda(grupo, ronda);
  if (!f) return null;
  const d = new Date(f);
  d.setDate(d.getDate() + (Number(grupo.diasGracia) || 0));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

// Multa de una persona en una ronda: se cobra si la cuota se completó (o se envió) después del límite,
// o si todavía no se completó y el límite ya pasó. Sin multa configurada, siempre es 0.
export const multaDe = (grupo, mios, ronda, ahora = Date.now()) => {
  const multa = Number(grupo.multa) || 0;
  if (!(multa > 0)) return 0;
  const limite = limiteSinMulta(grupo, ronda);
  if (limite === null) return 0;
  let acumulado = 0;
  let completadoEn = null;
  [...mios].sort((x, y) => (x.fecha || 0) - (y.fecha || 0)).forEach((p) => {
    acumulado += p.monto || 0;
    if (completadoEn === null && acumulado >= grupo.cuota) completadoEn = p.fecha || 0;
  });
  const tarde = completadoEn !== null ? completadoEn > limite : ahora > limite;
  return tarde ? multa : 0;
};

// Estado de lo que un participante ha pagado en una ronda. Puede pagar en partes: cada pago
// tiene su monto y comprobante, y solo cuentan los confirmados por el administrador.
// El cuarto parámetro puede ser el pasanaku (aplica la multa por retraso si la tiene) o solo el monto de la cuota.
export const multaId = (grupoId, participanteId, ronda) => `${grupoId}_${participanteId}_${ronda}`;

// `decisiones` son las multas que el administrador ya confirmó o perdonó. Una multa calculada solo se cobra cuando está confirmada.
export const resumenPago = (pagos, participanteId, ronda, cuotaOGrupo, decisiones = []) => {
  const grupo = typeof cuotaOGrupo === "object" && cuotaOGrupo !== null ? cuotaOGrupo : null;
  const cuotaBase = grupo ? grupo.cuota : cuotaOGrupo;
  const mios = pagos
    .filter((p) => p.participanteId === participanteId && p.ronda === ronda)
    .sort((x, y) => (y.fecha || 0) - (x.fecha || 0));
  const propuesta = grupo ? multaDe(grupo, mios, ronda) : 0;
  const decision = grupo ? decisiones.find((d) => d.pasanakuId === grupo.id && d.participanteId === participanteId && d.ronda === ronda) : null;
  const multa = decision?.estado === "confirmada" ? Number(decision.monto ?? grupo.multa) || 0 : 0;
  const cuota = cuotaBase + multa;
  const pagado = mios.filter((p) => p.estado !== "revision").reduce((suma, p) => suma + (p.monto || 0), 0);
  const revision = mios.filter((p) => p.estado === "revision").reduce((suma, p) => suma + (p.monto || 0), 0);
  const completo = pagado >= cuota;
  const estado = completo ? "pagado" : pagado > 0 ? "parcial" : revision > 0 ? "revision" : "pendiente";
  return {
    mios,
    pagado,
    revision,
    completo,
    estado,
    multa, // multa confirmada que se está cobrando
    multaPropuesta: decision ? 0 : propuesta, // multa por retraso que el administrador aún no confirma
    multaPerdonada: decision?.estado === "perdonada",
    cuotaBase,
    cuotaTotal: cuota,
    falta: Math.max(0, cuota - pagado), // lo que aún no está confirmado
    porPagar: Math.max(0, cuota - pagado - revision), // lo que todavía puede enviar
  };
};

// Un aporte en "revision" aún no cuenta: el admin debe confirmar el comprobante
export const esConfirmado = (pago) => pago.estado !== "revision";

// Suscripción en vivo a una colección (opcionalmente filtrada por `campo` == `grupoId`; null = vacía)
export const useColeccion = (nombre, grupoId, campo = "pasanakuId") => {
  const [docs, setDocs] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (grupoId === null) {
      setDocs([]);
      setCargando(false);
      return undefined;
    }
    const ref = grupoId
      ? query(collection(db, nombre), where(campo, "==", grupoId))
      : collection(db, nombre);
    setCargando(true);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCargando(false);
      },
      () => setCargando(false)
    );
    return unsub;
  }, [nombre, grupoId, campo]);

  return { docs, cargando };
};

// "26 oct 2026 · 17:42"
export const fechaHora = (ms) => {
  if (!ms) return "Sin fecha";
  const d = new Date(ms);
  return `${d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
};
