// CAPA DE LÓGICA DE NEGOCIO — funciones puras, sin dependencia de la interfaz
// ni de la base de datos, por lo que pueden probarse de forma aislada.

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ---------- Fechas ----------
export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function hoyISO() {
  return toISO(new Date());
}

export function ayerISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISO(d);
}

export function mesActual() {
  return hoyISO().slice(0, 7);
}

// Desplaza un mes 'YYYY-MM' en +n o -n meses.
export function desplazarMes(mes, n) {
  const [y, m] = mes.split('-').map(Number);
  return toISO(new Date(y, m - 1 + n, 1)).slice(0, 7);
}

export function nombreMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [y, m, d] = texto.split('-').map(Number);
  const f = new Date(y, m - 1, d);
  return f.getFullYear() === y && f.getMonth() === m - 1 && f.getDate() === d;
}

// ---------- Formato ----------
// 1250 -> "Bs 1.250" | 1250.5 -> "Bs 1.250,50"
export function formatoBs(valor) {
  const [entero, dec] = Number(valor).toFixed(2).split('.');
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === '00' ? `Bs ${miles}` : `Bs ${miles},${dec}`;
}

// ---------- Resumen ----------
// Total de ingresos, total de gastos y saldo disponible.
export function resumenMes(movimientos) {
  let ingresos = 0;
  let gastos = 0;
  for (const m of movimientos) {
    if (m.tipo === 'ingreso') ingresos += m.monto;
    else gastos += m.monto;
  }
  return { ingresos, gastos, saldo: ingresos - gastos };
}

// Estado del presupuesto: porcentaje consumido y nivel.
//   normal   -> menos del 80 %
//   alerta   -> desde el 80 %
//   superado -> desde el 100 %
export function estadoPresupuesto(gastado, limite) {
  if (!limite || limite <= 0) {
    return { porcentaje: 0, nivel: 'sin_presupuesto' };
  }
  const porcentaje = (gastado * 100) / limite;
  let nivel = 'normal';
  if (porcentaje >= 100) nivel = 'superado';
  else if (porcentaje >= 80) nivel = 'alerta';
  return { porcentaje, nivel };
}

// ---------- Estadísticas ----------
// Gasto por semana del mes: S1 = días 1-7, S2 = 8-14, S3 = 15-21, S4 = 22-28, S5 = 29-31.
export function gastoPorSemana(movimientos) {
  const semanas = [0, 0, 0, 0, 0];
  for (const m of movimientos) {
    if (m.tipo !== 'gasto') continue;
    const dia = parseInt(m.fecha.slice(8, 10), 10);
    const i = Math.min(Math.floor((dia - 1) / 7), 4);
    semanas[i] += m.monto;
  }
  return semanas;
}

// Gasto acumulado por categoría (ordenado de mayor a menor).
export function gastoPorCategoria(movimientos) {
  const mapa = {};
  for (const m of movimientos) {
    if (m.tipo !== 'gasto') continue;
    if (!mapa[m.categoria_id]) {
      mapa[m.categoria_id] = { nombre: m.categoria, color: m.color, total: 0 };
    }
    mapa[m.categoria_id].total += m.monto;
  }
  return Object.values(mapa).sort((a, b) => b.total - a.total);
}