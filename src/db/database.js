// CAPA DE DATOS — almacenamiento local con SQLite (expo-sqlite)
// Las restricciones del esquema (monto > 0, tipo válido, categoría obligatoria)
// impiden guardar datos inválidos aunque falle la validación de las pantallas.
import * as SQLite from 'expo-sqlite';

let db = null;

function getDB() {
  if (!db) {
    db = SQLite.openDatabaseSync('gastoclaro.db');
  }
  return db;
}

const CATEGORIAS_INICIALES = [
  ['Alimentación', '#F59E0B', 'gasto'],
  ['Transporte', '#3B82F6', 'gasto'],
  ['Educación', '#8B5CF6', 'gasto'],
  ['Entretenimiento', '#EC4899', 'gasto'],
  ['Otros', '#6B7280', 'gasto'],
  ['Sueldo / Mesada', '#1B9E5A', 'ingreso'],
  ['Otros ingresos', '#14B8A6', 'ingreso'],
];

// Crea las tablas (si no existen) y carga las categorías predeterminadas.
export function initDB() {
  const d = getDB();
  d.execSync('PRAGMA foreign_keys = ON;');
  d.execSync(`
    CREATE TABLE IF NOT EXISTS categorias (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      color  TEXT NOT NULL,
      tipo   TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso'))
    );
    CREATE TABLE IF NOT EXISTS movimientos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo         TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso')),
      monto        REAL NOT NULL CHECK (monto > 0),
      descripcion  TEXT,
      fecha        TEXT NOT NULL,
      categoria_id INTEGER NOT NULL REFERENCES categorias(id)
    );
    CREATE TABLE IF NOT EXISTS presupuestos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      mes          TEXT NOT NULL,
      limite       REAL NOT NULL CHECK (limite > 0),
      categoria_id INTEGER REFERENCES categorias(id)
    );
  `);

  const fila = d.getFirstSync('SELECT COUNT(*) AS n FROM categorias');
  if (fila.n === 0) {
    for (const [nombre, color, tipo] of CATEGORIAS_INICIALES) {
      d.runSync('INSERT INTO categorias (nombre, color, tipo) VALUES (?, ?, ?)', [
        nombre,
        color,
        tipo,
      ]);
    }
  }
}

// ---------- Categorías ----------
export function getCategorias(tipo) {
  const d = getDB();
  if (tipo) {
    return d.getAllSync('SELECT * FROM categorias WHERE tipo = ? ORDER BY id', [tipo]);
  }
  return d.getAllSync('SELECT * FROM categorias ORDER BY id');
}

// ---------- Movimientos ----------
export function guardarMovimiento({ tipo, monto, descripcion, fecha, categoria_id }) {
  return getDB().runSync(
    'INSERT INTO movimientos (tipo, monto, descripcion, fecha, categoria_id) VALUES (?, ?, ?, ?, ?)',
    [tipo, monto, descripcion || null, fecha, categoria_id]
  );
}

export function actualizarMovimiento(id, { tipo, monto, descripcion, fecha, categoria_id }) {
  return getDB().runSync(
    'UPDATE movimientos SET tipo = ?, monto = ?, descripcion = ?, fecha = ?, categoria_id = ? WHERE id = ?',
    [tipo, monto, descripcion || null, fecha, categoria_id, id]
  );
}

export function eliminarMovimiento(id) {
  return getDB().runSync('DELETE FROM movimientos WHERE id = ?', [id]);
}

// Filtros opcionales: mes ('YYYY-MM'), categoriaId y texto de búsqueda.
export function getMovimientos({ mes, categoriaId, texto } = {}) {
  let sql = `
    SELECT m.*, c.nombre AS categoria, c.color AS color
    FROM movimientos m
    JOIN categorias c ON c.id = m.categoria_id
    WHERE 1 = 1`;
  const params = [];
  if (mes) {
    sql += ' AND substr(m.fecha, 1, 7) = ?';
    params.push(mes);
  }
  if (categoriaId) {
    sql += ' AND m.categoria_id = ?';
    params.push(categoriaId);
  }
  if (texto && texto.trim()) {
    sql += ' AND (m.descripcion LIKE ? OR c.nombre LIKE ?)';
    const t = `%${texto.trim()}%`;
    params.push(t, t);
  }
  sql += ' ORDER BY m.fecha DESC, m.id DESC';
  return getDB().getAllSync(sql, params);
}

// Total de gastos del mes.
export function getGastoMes(mes) {
  const fila = getDB().getFirstSync(
    "SELECT COALESCE(SUM(monto), 0) AS total FROM movimientos WHERE tipo = 'gasto' AND substr(fecha, 1, 7) = ?",
    [mes]
  );
  return fila.total;
}

// Gasto acumulado por categoría en un mes.
export function getGastoPorCategoria(mes) {
  return getDB().getAllSync(
    `SELECT c.id, c.nombre, c.color, SUM(m.monto) AS total
     FROM movimientos m
     JOIN categorias c ON c.id = m.categoria_id
     WHERE m.tipo = 'gasto' AND substr(m.fecha, 1, 7) = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [mes]
  );
}

// ---------- Presupuesto ----------
// Presupuesto general del mes (sin categoría asociada).
export function getPresupuestoGeneral(mes) {
  return getDB().getFirstSync(
    'SELECT * FROM presupuestos WHERE mes = ? AND categoria_id IS NULL',
    [mes]
  );
}

export function setPresupuestoGeneral(mes, limite) {
  const d = getDB();
  d.withTransactionSync(() => {
    d.runSync('DELETE FROM presupuestos WHERE mes = ? AND categoria_id IS NULL', [mes]);
    d.runSync('INSERT INTO presupuestos (mes, limite, categoria_id) VALUES (?, ?, NULL)', [
      mes,
      limite,
    ]);
  });
}

// ---------- Respaldo (RF10) ----------
export function exportarDatos() {
  const d = getDB();
  return {
    app: 'GastoClaro',
    version: 1,
    fecha_exportacion: new Date().toISOString(),
    categorias: d.getAllSync('SELECT * FROM categorias'),
    movimientos: d.getAllSync('SELECT * FROM movimientos ORDER BY fecha, id'),
    presupuestos: d.getAllSync('SELECT * FROM presupuestos'),
  };
}