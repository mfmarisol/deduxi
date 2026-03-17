const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const now = new Date();
export const currentPeriodo = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`;
export const currentPeriodoCode = now.toISOString().slice(0, 7); // e.g. "2026-03"
export const currentYear = now.getFullYear();
