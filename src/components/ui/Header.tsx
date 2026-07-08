/**
 * Header — Cabeçalho com logo, título e avatar do usuário logado
 */
import React from 'react';
import { View, Text, Image, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, shadows, borderRadius } from '../../config/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  /** URL do avatar do usuário logado — exibe no canto direito */
  avatarUrl?: string | null;
  /** Iniciais de fallback quando não há avatar */
  avatarInitials?: string;
  /** Ação ao tocar no avatar */
  onAvatarPress?: () => void;
}

export default function Header({
  title = 'LOURENÇO',
  subtitle,
  showLogo = true,
  rightAction,
  transparent = false,
  avatarUrl,
  avatarInitials = 'LB',
  onAvatarPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const showAvatar = avatarUrl !== undefined; // prop passada explicitamente

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

        <View style={styles.right}>
          {/* rightAction customizado (badges, botões etc.) */}
          {rightAction && rightAction}

          {/* Avatar do usuário */}
          {showAvatar && (
            <TouchableOpacity
              onPress={onAvatarPress}
              activeOpacity={0.8}
              disabled={!onAvatarPress}
              style={styles.avatarWrapper}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitialsText}>
                    {avatarInitials}
                  </Text>
                </View>
              )}
              {/* Anel do avatar */}
              <View style={styles.avatarRing} pointerEvents="none" />
            </TouchableOpacity>
          )}
        </View>
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
    flex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: spacing.sm,
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
    gap: spacing.sm,
  },
  // Avatar
  avatarWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  avatarRing: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
