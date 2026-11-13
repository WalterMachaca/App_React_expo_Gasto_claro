// Historial de movimientos con búsqueda y filtros por categoría y período.
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { getMovimientos, getCategorias, eliminarMovimiento } from '../db/database';
import { mesActual, desplazarMes } from '../utils/calculos';
import ItemMovimiento from '../components/ItemMovimiento';
import { colores } from '../theme';

const PERIODOS = [
  { clave: 'actual', nombre: 'Este mes' },
  { clave: 'anterior', nombre: 'Mes anterior' },
  { clave: 'todo', nombre: 'Todo' },
];

function Chip({ texto, activo, onPress }) {
  return (
    <TouchableOpacity
      style={[estilos.chip, activo && estilos.chipActivo]}
      onPress={onPress}
    >
      <Text style={[estilos.chipTexto, activo && { color: '#fff' }]}>{texto}</Text>
    </TouchableOpacity>
  );
}

export default function HistorialScreen() {
  const { refreshKey, abrirEditar } = useContext(AppContext);
  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [periodo, setPeriodo] = useState('actual');
  const [categorias, setCategorias] = useState([]);
  const [movs, setMovs] = useState([]);

  const cargar = useCallback(() => {
    let mes;
    if (periodo === 'actual') mes = mesActual();
    else if (periodo === 'anterior') mes = desplazarMes(mesActual(), -1);
    setCategorias(getCategorias());
    setMovs(getMovimientos({ mes, categoriaId, texto }));
  }, [periodo, categoriaId, texto]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar, refreshKey])
  );

  const confirmarEliminar = (m) => {
    Alert.alert('Eliminar movimiento', `¿Eliminar «${m.descripcion || m.categoria}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          eliminarMovimiento(m.id);
          cargar();
        },
      },
    ]);
  };

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.filtros}>
        <TextInput
          style={estilos.buscar}
          value={texto}
          onChangeText={setTexto}
          placeholder="🔍 Buscar por descripción o categoría"
          placeholderTextColor={colores.textoSuave}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {PERIODOS.map((p) => (
            <Chip key={p.clave} texto={p.nombre} activo={periodo === p.clave} onPress={() => setPeriodo(p.clave)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <Chip texto="Todas" activo={categoriaId === null} onPress={() => setCategoriaId(null)} />
          {categorias.map((c) => (
            <Chip
              key={c.id}
              texto={c.nombre}
              activo={categoriaId === c.id}
              onPress={() => setCategoriaId(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={movs}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={estilos.vacio}>No hay movimientos con esos filtros.</Text>}
        renderItem={({ item }) => (
          <ItemMovimiento
            item={item}
            onPress={() => abrirEditar(item)}
            onEliminar={() => confirmarEliminar(item)}
          />
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  filtros: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: colores.borde },
  buscar: {
    backgroundColor: colores.fondo,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: colores.texto,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colores.borde,
    marginRight: 8,
  },
  chipActivo: { backgroundColor: colores.primario },
  chipTexto: { color: colores.texto, fontWeight: '600', fontSize: 13 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 40 },
});