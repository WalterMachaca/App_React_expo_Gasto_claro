import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colores } from '../theme';

const COLOR_NIVEL = {
  normal: colores.primario,
  alerta: colores.alerta,
  superado: colores.gasto,
  sin_presupuesto: colores.borde,
};

const MENSAJE_NIVEL = {
  alerta: '⚠️ Alcanzaste el 80 % de tu presupuesto mensual.',
  superado: '🚨 Superaste tu presupuesto mensual.',
};

export function mensajeNivel(nivel) {
  return MENSAJE_NIVEL[nivel] || null;
}

export default function BarraPresupuesto({ porcentaje, nivel }) {
  const ancho = Math.min(100, Math.max(0, porcentaje));
  return (
    <View>
      <View style={estilos.fondo}>
        <View
          style={[estilos.relleno, { width: `${ancho}%`, backgroundColor: COLOR_NIVEL[nivel] }]}
        />
      </View>
      <Text style={estilos.texto}>{Math.round(porcentaje)} % consumido</Text>
      {MENSAJE_NIVEL[nivel] ? (
        <Text style={[estilos.aviso, { color: COLOR_NIVEL[nivel] }]}>{MENSAJE_NIVEL[nivel]}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { height: 12, backgroundColor: colores.borde, borderRadius: 6, overflow: 'hidden' },
  relleno: { height: 12, borderRadius: 6 },
  texto: { marginTop: 6, color: colores.textoSuave, fontSize: 13 },
  aviso: { marginTop: 6, fontWeight: '700', fontSize: 14 },
});