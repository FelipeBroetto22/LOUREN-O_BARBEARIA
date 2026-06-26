/**
 * Card — Componente de card com sombra e cantos arredondados
 */
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  noPadding?: boolean;
}

export default function Card({
  children,
  style,
  onPress,
  elevated = false,
  noPadding = false,
}: CardProps) {
  const cardStyle = [
    styles.card,
    elevated ? shadows.lg : shadows.sm,
    noPadding ? undefined : styles.padding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  padding: {
    padding: spacing.md,
  },
});
