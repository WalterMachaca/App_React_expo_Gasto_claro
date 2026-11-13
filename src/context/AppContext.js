import { createContext } from 'react';

// Comparte con las pantallas: refreshKey (para recargar datos tras guardar)
// y abrirEditar (para abrir el formulario con un movimiento existente).
export const AppContext = createContext({
  refreshKey: 0,
  abrirEditar: () => {},
});