// Presupuesto mensual, avance con alertas y respaldo de datos en JSON.
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { getGastoMes, getPresupuestoGeneral, setPresupuestoGeneral, exportarDatos } from '../db/database';
import { mesActual, nombreMes, estadoPresupuesto, formatoBs } from '../utils/calculos';
import BarraPresupuesto from '../components/BarraPresupuesto';
import { colores, tarjeta } from '../theme';

export default function MetaScreen() {
  const { refreshKey } = useContext(AppContext);
  const mes = mesActual();
  const [limite, setLimite] = useState(null);
  const [entrada, setEntrada] = useState('');
  const [gastado, setGastado] = useState(0);

  const cargar = useCallback(() => {
    const p = getPresupuestoGeneral(mes);
    setLimite(p ? p.limite : null);
    setEntrada(p ? String(p.limite) : '');
    setGastado(getGastoMes(mes));
  }, [mes]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar, refreshKey])
  );

  const guardar = () => {
    const valor = parseFloat(entrada.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un presupuesto mayor a cero.');
      return;
    }
    try {
      setPresupuestoGeneral(mes, valor);
      cargar();
      const nivel = estadoPresupuesto(gastado, valor).nivel;
      const extra =
        nivel === 'alerta'
          ? '\n\n⚠️ Ya consumiste más del 80 % de este límite.'
          : nivel === 'superado'
          ? '\n\n🚨 Ya superaste este límite.'
          : '';
      Alert.alert('Presupuesto guardado', `Tu límite de ${nombreMes(mes)} es ${formatoBs(valor)}.${extra}`);
    } catch (e) {
      Alert.alert('No se pudo guardar', String(e.message || e));
    }
  };

  // RF10: genera el respaldo en JSON y abre el menú de compartir
  // (WhatsApp, correo, Google Drive, etc.).
  const respaldar = async () => {
    try {
      const datos = exportarDatos();
      await Share.share({
        title: 'Respaldo GastoClaro',
        message: JSON.stringify(datos, null, 2),
      });
    } catch (e) {
      Alert.alert('No se pudo generar el respaldo', String(e.message || e));
    }
  };

  const estado = estadoPresupuesto(gastado, limite);

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View style={tarjeta}>
        <Text style={estilos.titulo}>Presupuesto de {nombreMes(mes)}</Text>
        <Text style={estilos.etiqueta}>Límite mensual (Bs)</Text>
        <TextInput
          style={estilos.input}
          value={entrada}
          onChangeText={setEntrada}
          placeholder="Ej. 1200"
          placeholderTextColor={colores.textoSuave}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={estilos.boton} onPress={guardar}>
          <Text style={estilos.botonTexto}>Guardar presupuesto</Text>
        </TouchableOpacity>
      </View>

      {limite ? (
        <View style={tarjeta}>
          <Text style={estilos.titulo}>Avance</Text>
          <Text style={estilos.detalle}>
            {formatoBs(gastado)} de {formatoBs(limite)} · Te quedan {formatoBs(Math.max(0, limite - gastado))}
          </Text>
          <BarraPresupuesto porcentaje={estado.porcentaje} nivel={estado.nivel} />
        </View>
      ) : null}

      <View style={tarjeta}>
        <Text style={estilos.titulo}>Respaldo de datos</Text>
        <Text style={estilos.detalle}>
          Genera un archivo JSON con tus movimientos, categorías y presupuestos, y envíalo a donde quieras guardarlo.
        </Text>
        <TouchableOpacity style={[estilos.boton, estilos.botonSec]} onPress={respaldar}>
          <Text style={[estilos.botonTexto, { color: colores.primario }]}>Generar respaldo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  titulo: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 8 },
  etiqueta: { color: colores.textoSuave, marginBottom: 6 },
  detalle: { color: colores.textoSuave, marginBottom: 10, fontSize: 14 },
  input: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    fontSize: 24,
    fontWeight: '700',
    color: colores.texto,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  boton: { backgroundColor: colores.primario, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  botonSec: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colores.primario },
  botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
});