// Pantalla de inicio: saldo, ingresos/gastos del mes, presupuesto y últimos movimientos.
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { getMovimientos, getPresupuestoGeneral } from '../db/database';
import { resumenMes, estadoPresupuesto, formatoBs, mesActual, nombreMes } from '../utils/calculos';
import BarraPresupuesto from '../components/BarraPresupuesto';
import ItemMovimiento from '../components/ItemMovimiento';
import { colores, tarjeta } from '../theme';

export default function ResumenScreen() {
  const { refreshKey, abrirEditar } = useContext(AppContext);
  const [movs, setMovs] = useState([]);
  const [limite, setLimite] = useState(null);
  const mes = mesActual();

  useFocusEffect(
    useCallback(() => {
      setMovs(getMovimientos({ mes }));
      const p = getPresupuestoGeneral(mes);
      setLimite(p ? p.limite : null);
    }, [refreshKey, mes])
  );

  const { ingresos, gastos, saldo } = resumenMes(movs);
  const estado = estadoPresupuesto(gastos, limite);

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View style={[tarjeta, estilos.saldo]}>
        <Text style={estilos.etiquetaClara}>Saldo disponible · {nombreMes(mes)}</Text>
        <Text style={[estilos.saldoValor, saldo < 0 && { color: '#FFD6D6' }]}>{formatoBs(saldo)}</Text>
        <View style={estilos.fila}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.etiquetaClara}>Ingresos</Text>
            <Text style={estilos.subValor}>{formatoBs(ingresos)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.etiquetaClara}>Gastos</Text>
            <Text style={estilos.subValor}>{formatoBs(gastos)}</Text>
          </View>
        </View>
      </View>

      <View style={tarjeta}>
        <Text style={estilos.seccion}>Presupuesto del mes</Text>
        {limite ? (
          <>
            <Text style={estilos.detalle}>
              {formatoBs(gastos)} de {formatoBs(limite)}
            </Text>
            <BarraPresupuesto porcentaje={estado.porcentaje} nivel={estado.nivel} />
          </>
        ) : (
          <Text style={estilos.detalle}>
            Aún no definiste un presupuesto. Hazlo en la pestaña «Meta».
          </Text>
        )}
      </View>

      <Text style={estilos.seccion}>Últimos movimientos</Text>
      {movs.length === 0 ? (
        <Text style={estilos.detalle}>
          Todavía no hay movimientos este mes. Toca el botón + para registrar el primero.
        </Text>
      ) : (
        movs.slice(0, 5).map((m) => (
          <ItemMovimiento key={m.id} item={m} onPress={() => abrirEditar(m)} />
        ))
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  saldo: { backgroundColor: colores.primario },
  etiquetaClara: { color: '#D5F0E2', fontSize: 13 },
  saldoValor: { color: '#fff', fontSize: 34, fontWeight: '800', marginVertical: 6 },
  fila: { flexDirection: 'row', marginTop: 10 },
  subValor: { color: '#fff', fontSize: 17, fontWeight: '700' },
  seccion: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 8 },
  detalle: { color: colores.textoSuave, marginBottom: 8, fontSize: 14 },
});