/**
 * Root Layout — Carrega fontes, splash screen e providers globais.
 * Roteamento por role: 'client' → ClientTabs | 'barber' → BarberTabs
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import {
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_300Light,
  Poppins_400Regular,
} from '@expo-google-fonts/poppins';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/config/theme';

// Auth Screens
import LoginScreen from './(auth)/login';
import RegisterScreen from './(auth)/register';

// Client Tab Navigator
import ClientTabNavigator from './(tabs)/_layout';

// Barber Tab Navigator
import BarberTabNavigator from './(barber)/_layout';

// Extra screens (client stack)
import EditarPerfilScreen from './(tabs)/editar-perfil';
import HistoricoScreen from './(tabs)/historico';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isAuthenticated ? (
        /* ── Auth Flow ─────────────────────────────────────── */
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user?.role === 'barber' ? (
        /* ── Barber Flow ────────────────────────────────────── */
        <Stack.Screen name="BarberMain" component={BarberTabNavigator} />
      ) : (
        /* ── Client Flow ────────────────────────────────────── */
        <>
          <Stack.Screen name="Main" component={ClientTabNavigator} />
          <Stack.Screen
            name="EditarPerfil"
            component={EditarPerfilScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Historico"
            component={HistoricoScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
        Poppins_300Light,
        Poppins_400Regular,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
