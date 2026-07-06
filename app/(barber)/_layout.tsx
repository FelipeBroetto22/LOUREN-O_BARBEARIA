/**
 * Barber Tab Navigator — Painel do barbeiro
 */
import React from 'react';
import { StyleSheet, Platform, View, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, shadows } from '../../src/config/theme';
import { useAuth } from '../../src/contexts/AuthContext';

import BarberAgendaScreen from './agenda';
import BarberClientesScreen from './clientes';
import BarberConfigScreen from './configuracoes';

const Tab = createBottomTabNavigator();

export default function BarberTabNavigator() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'calendar';

          switch (route.name) {
            case 'BarberAgenda':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'BarberClientes':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'BarberConfig':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: fontSizes.xs,
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...shadows.md,
        },
      })}
    >
      <Tab.Screen
        name="BarberAgenda"
        component={BarberAgendaScreen}
        options={{ tabBarLabel: 'Agenda' }}
      />
      <Tab.Screen
        name="BarberClientes"
        component={BarberClientesScreen}
        options={{ tabBarLabel: 'Clientes' }}
      />
      <Tab.Screen
        name="BarberConfig"
        component={BarberConfigScreen}
        options={{ tabBarLabel: 'Config.' }}
      />
    </Tab.Navigator>
  );
}
