/**
 * Header — Componente de cabeçalho com monograma da marca
 */
import React from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({
  title = 'LOURENÇO',
  subtitle,
  showLogo = true,
  rightAction,
  transparent = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm },
        transparent && styles.transparent,
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.content}>
        <View style={styles.left}>
          {showLogo && (
            <Image
              source={require('../../../assets/images/logo-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {rightAction && <View style={styles.right}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: spacing.sm,
    tintColor: colors.textOnPrimary,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textOnPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: colors.textOnPrimary,
    opacity: 0.8,
    letterSpacing: 1,
    marginTop: -2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
