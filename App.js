// Navegación por pestañas (Inicio, Historial, Gráficos, Meta), botón flotante (+)
// y formulario de registro. También inicia la base de datos.
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { initDB } from './src/db/database';
import { AppContext } from './src/context/AppContext';
import { colores } from './src/theme';
import ResumenScreen from './src/screens/ResumenScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import EstadisticasScreen from './src/screens/EstadisticasScreen';
import MetaScreen from './src/screens/MetaScreen';
import NuevoMovimientoScreen from './src/screens/NuevoMovimientoScreen';

const Tab = createBottomTabNavigator();

const icono = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function Principal() {
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);

  const abrirNuevo = () => {
    setEditando(null);
    setModalVisible(true);
  };

  const contexto = useMemo(
    () => ({
      refreshKey,
      abrirEditar: (mov) => {
        setEditando(mov);
        setModalVisible(true);
      },
    }),
    [refreshKey]
  );

  const guardado = () => {
    setModalVisible(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <AppContext.Provider value={contexto}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colores.primario },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
              tabBarActiveTintColor: colores.primario,
            }}
          >
            <Tab.Screen
              name="Inicio"
              component={ResumenScreen}
              options={{ title: 'GastoClaro', tabBarLabel: 'Inicio', tabBarIcon: icono('🏠') }}
            />
            <Tab.Screen
              name="Historial"
              component={HistorialScreen}
              options={{ tabBarIcon: icono('📋') }}
            />
            <Tab.Screen
              name="Gráficos"
              component={EstadisticasScreen}
              options={{ tabBarIcon: icono('📊') }}
            />
            <Tab.Screen
              name="Meta"
              component={MetaScreen}
              options={{ title: 'Presupuesto', tabBarLabel: 'Meta', tabBarIcon: icono('🎯') }}
            />
          </Tab.Navigator>
        </NavigationContainer>

        <TouchableOpacity
          style={[estilos.fab, { bottom: insets.bottom + 72 }]}
          onPress={abrirNuevo}
          activeOpacity={0.85}
        >
          <Text style={estilos.fabTexto}>＋</Text>
        </TouchableOpacity>

        <NuevoMovimientoScreen
          visible={modalVisible}
          movimiento={editando}
          onClose={() => setModalVisible(false)}
          onSaved={guardado}
        />
      </View>
    </AppContext.Provider>
  );
}

export default function App() {
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      initDB();
      setListo(true);
    } catch (e) {
      setError(String(e.message || e));
    }
  }, []);

  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={{ color: colores.gasto, textAlign: 'center' }}>
          No se pudo iniciar la base de datos:{'\n'}
          {error}
        </Text>
      </View>
    );
  }
  if (!listo) return <View style={estilos.centro} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Principal />
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabTexto: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
});
