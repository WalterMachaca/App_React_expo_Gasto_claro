// Gráficos: distribución de gastos por categoría y gasto semanal del mes.
import React, { useState, useCallback, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { AppContext } from '../context/AppContext';
import { getMovimientos } from '../db/database';
import {
  mesActual,
  desplazarMes,
  nombreMes,
  resumenMes,
  gastoPorCategoria,
  gastoPorSemana,
  formatoBs,
} from '../utils/calculos';
import { colores, tarjeta } from '../theme';

export default function EstadisticasScreen() {
  const { refreshKey } = useContext(AppContext);
  const { width } = useWindowDimensions();
  const [mes, setMes] = useState(mesActual());
  const [movs, setMovs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setMovs(getMovimientos({ mes }));
    }, [mes, refreshKey])
  );

  const { gastos } = resumenMes(movs);
  const categorias = gastoPorCategoria(movs);
  const semanas = gastoPorSemana(movs);
  const sumaCategorias = categorias.reduce((a, c) => a + c.total, 0);
  const coincide = Math.abs(sumaCategorias - gastos) < 0.005;
  const anchoGrafico = width - 32 - 32;

  const datosPastel = categorias.map((c) => ({
    name: c.nombre,
    population: c.total,
    color: c.color,
    legendFontColor: colores.texto,
    legendFontSize: 12,
  }));

  const config = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(27, 158, 90, ${opacity})`,
    labelColor: () => colores.textoSuave,
  };

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View style={estilos.navMes}>
        <TouchableOpacity onPress={() => setMes(desplazarMes(mes, -1))} hitSlop={10}>
          <Text style={estilos.flecha}>◀</Text>
        </TouchableOpacity>
        <Text style={estilos.nombreMes}>{nombreMes(mes)}</Text>
        <TouchableOpacity onPress={() => setMes(desplazarMes(mes, 1))} hitSlop={10}>
          <Text style={estilos.flecha}>▶</Text>
        </TouchableOpacity>
      </View>

      {gastos === 0 ? (
        <View style={tarjeta}>
          <Text style={estilos.vacio}>No hay gastos registrados en este mes.</Text>
        </View>
      ) : (
        <>
          <View style={tarjeta}>
            <Text style={estilos.titulo}>Gastos por categoría</Text>
            <PieChart
              data={datosPastel}
              width={anchoGrafico}
              height={190}
              chartConfig={config}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
            <Text style={estilos.verificacion}>
              Total de gastos: {formatoBs(gastos)} · Suma de categorías: {formatoBs(sumaCategorias)}{' '}
              {coincide ? '✓' : '✗'}
            </Text>
            <Text style={estilos.destacado}>
              Mayor gasto: {categorias[0].nombre} ({formatoBs(categorias[0].total)})
            </Text>
          </View>

          <View style={tarjeta}>
            <Text style={estilos.titulo}>Gasto semanal</Text>
            <BarChart
              data={{ labels: ['S1', 'S2', 'S3', 'S4', 'S5'], datasets: [{ data: semanas }] }}
              width={anchoGrafico}
              height={220}
              yAxisLabel="Bs "
              yAxisSuffix=""
              chartConfig={config}
              fromZero
              showValuesOnTopOfBars
              style={{ borderRadius: 8 }}
            />
            <Text style={estilos.nota}>S1 = días 1–7, S2 = 8–14, S3 = 15–21, S4 = 22–28, S5 = 29–31.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  navMes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  flecha: { fontSize: 20, color: colores.primario, paddingHorizontal: 8 },
  nombreMes: { fontSize: 18, fontWeight: '700', color: colores.texto },
  titulo: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 8 },
  vacio: { color: colores.textoSuave, textAlign: 'center' },
  verificacion: { fontSize: 12, color: colores.textoSuave, marginTop: 8 },
  destacado: { fontSize: 14, fontWeight: '700', color: colores.texto, marginTop: 6 },
  nota: { fontSize: 11, color: colores.textoSuave, marginTop: 6 },
});