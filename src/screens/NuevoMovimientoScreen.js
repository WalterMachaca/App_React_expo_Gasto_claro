// Formulario para registrar o editar un movimiento.
// Flujo en tres pasos: monto -> categoría -> Guardar (tipo = gasto y fecha = hoy por defecto).
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCategorias,
  guardarMovimiento,
  actualizarMovimiento,
  getGastoMes,
  getPresupuestoGeneral,
} from '../db/database';
import { estadoPresupuesto, fechaValida, hoyISO, ayerISO } from '../utils/calculos';
import { mensajeNivel } from '../components/BarraPresupuesto';
import { colores } from '../theme';

export default function NuevoMovimientoScreen({ visible, movimiento, onClose, onSaved }) {
  const [tipo, setTipo] = useState('gasto');
  const [monto, setMonto] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyISO());

  // Al abrir el formulario se cargan los valores (nuevo o edición).
  useEffect(() => {
    if (!visible) return;
    const t = movimiento ? movimiento.tipo : 'gasto';
    const cats = getCategorias(t);
    setTipo(t);
    setCategorias(cats);
    setCategoriaId(movimiento ? movimiento.categoria_id : cats[0]?.id ?? null);
    setMonto(movimiento ? String(movimiento.monto) : '');
    setDescripcion(movimiento?.descripcion ?? '');
    setFecha(movimiento ? movimiento.fecha : hoyISO());
  }, [visible, movimiento]);

  const cambiarTipo = (t) => {
    const cats = getCategorias(t);
    setTipo(t);
    setCategorias(cats);
    setCategoriaId(cats[0]?.id ?? null);
  };

  const guardar = () => {
    const valor = parseFloat(monto.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (!categoriaId) {
      Alert.alert('Falta la categoría', 'Elige una categoría.');
      return;
    }
    if (!fechaValida(fecha)) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD, por ejemplo 2026-09-15.');
      return;
    }

    const datos = {
      tipo,
      monto: valor,
      descripcion: descripcion.trim(),
      fecha,
      categoria_id: categoriaId,
    };

    try {
      const mes = fecha.slice(0, 7);
      const presupuesto = getPresupuestoGeneral(mes);
      const gastoAntes = getGastoMes(mes);

      if (movimiento) actualizarMovimiento(movimiento.id, datos);
      else guardarMovimiento(datos);

      const gastoDespues = getGastoMes(mes);
      onSaved();

      // Alerta solo cuando el gasto cruza el 80 % o el 100 % del presupuesto.
      if (tipo === 'gasto' && presupuesto) {
        const antes = estadoPresupuesto(gastoAntes, presupuesto.limite).nivel;
        const despues = estadoPresupuesto(gastoDespues, presupuesto.limite).nivel;
        if (antes !== despues && (despues === 'alerta' || despues === 'superado')) {
          setTimeout(() => Alert.alert('Presupuesto', mensajeNivel(despues)), 350);
        }
      }
    } catch (e) {
      Alert.alert('No se pudo guardar', String(e.message || e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo}>{movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={estilos.cerrar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <View style={estilos.selector}>
              {['gasto', 'ingreso'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    estilos.opcionTipo,
                    tipo === t && { backgroundColor: t === 'gasto' ? colores.gasto : colores.ingreso },
                  ]}
                  onPress={() => cambiarTipo(t)}
                >
                  <Text style={[estilos.textoTipo, tipo === t && { color: '#fff' }]}>
                    {t === 'gasto' ? 'Gasto' : 'Ingreso'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={estilos.etiqueta}>1. Monto (Bs)</Text>
            <TextInput
              style={estilos.montoInput}
              value={monto}
              onChangeText={setMonto}
              placeholder="0"
              placeholderTextColor={colores.textoSuave}
              keyboardType="decimal-pad"
              autoFocus={!movimiento}
            />

            <Text style={estilos.etiqueta}>2. Categoría</Text>
            <View style={estilos.chips}>
              {categorias.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    estilos.chip,
                    categoriaId === c.id && { backgroundColor: c.color, borderColor: c.color },
                  ]}
                  onPress={() => setCategoriaId(c.id)}
                >
                  <Text style={[estilos.chipTexto, categoriaId === c.id && { color: '#fff' }]}>
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={estilos.etiqueta}>Descripción (opcional)</Text>
            <TextInput
              style={estilos.input}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ej. Pasaje, almuerzo, fotocopias…"
              placeholderTextColor={colores.textoSuave}
            />

            <Text style={estilos.etiqueta}>Fecha (AAAA-MM-DD)</Text>
            <TextInput
              style={estilos.input}
              value={fecha}
              onChangeText={setFecha}
              placeholder="2026-09-15"
              placeholderTextColor={colores.textoSuave}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <View style={estilos.atajos}>
              <TouchableOpacity style={estilos.atajo} onPress={() => setFecha(hoyISO())}>
                <Text style={estilos.atajoTexto}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.atajo} onPress={() => setFecha(ayerISO())}>
                <Text style={estilos.atajoTexto}>Ayer</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={estilos.guardar} onPress={guardar}>
              <Text style={estilos.guardarTexto}>3. Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colores.primario,
  },
  titulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cerrar: { color: '#fff', fontSize: 22 },
  selector: {
    flexDirection: 'row',
    backgroundColor: colores.borde,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  opcionTipo: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  textoTipo: { fontWeight: '700', color: colores.texto },
  etiqueta: { fontWeight: '700', color: colores.texto, marginTop: 14, marginBottom: 6 },
  montoInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    fontSize: 32,
    fontWeight: '800',
    color: colores.texto,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    fontSize: 16,
    color: colores.texto,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipTexto: { color: colores.texto, fontWeight: '600' },
  atajos: { flexDirection: 'row', marginTop: 8 },
  atajo: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colores.borde,
    marginRight: 8,
  },
  atajoTexto: { color: colores.texto, fontWeight: '600' },
  guardar: {
    backgroundColor: colores.primario,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  guardarTexto: { color: '#fff', fontSize: 18, fontWeight: '800' },
});