import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colores } from '../theme';
import { formatoBs } from '../utils/calculos';

export default function ItemMovimiento({ item, onPress, onEliminar }) {
  const esGasto = item.tipo === 'gasto';
  return (
    <TouchableOpacity style={estilos.fila} onPress={onPress} activeOpacity={0.7}>
      <View style={[estilos.punto, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {item.descripcion || item.categoria}
        </Text>
        <Text style={estilos.sub}>
          {item.categoria} · {item.fecha}
        </Text>
      </View>
      <Text style={[estilos.monto, { color: esGasto ? colores.gasto : colores.ingreso }]}>
        {esGasto ? '-' : '+'}
        {formatoBs(item.monto)}
      </Text>
      {onEliminar ? (
        <TouchableOpacity onPress={onEliminar} style={estilos.borrar} hitSlop={8}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  punto: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  titulo: { fontSize: 15, fontWeight: '600', color: colores.texto },
  sub: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  monto: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  borrar: { marginLeft: 12 },
});