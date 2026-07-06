/**
 * Home Screen — Tela inicial com próximos agendamentos e atalhos
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import Header from '../../src/components/ui/Header';
import Card from '../../src/components/ui/Card';
import { colors, fonts, fontSizes, spacing, shadows, borderRadius } from '../../src/config/theme';
import { getUpcomingBookings } from '../../src/services/bookingService';
import { getUserStickers } from '../../src/services/albumService';
import type { Booking } from '../../src/types/booking';
import type { AlbumSticker } from '../../src/types/album';

// Endereço da barbearia para Google Maps
const BARBERSHOP_ADDRESS = 'Lourenço Barbearia, Brasil';
const BARBERSHOP_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BARBERSHOP_ADDRESS)}`;

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [lastSticker, setLastSticker] = useState<AlbumSticker | null>(null);

  const firstName = user?.full_name?.split(' ')[0] || 'Cliente';

  const loadData = async () => {
    if (!user) return;
    try {
      const [bookings, stickers] = await Promise.all([
        getUpcomingBookings(user.id),
        getUserStickers(user.id),
      ]);
      setNextBooking(bookings.length > 0 ? bookings[0] : null);
      setLastSticker(stickers.length > 0 ? stickers[stickers.length - 1] : null);
    } catch (error) {
      console.error('Erro ao carregar dados da Home:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenMaps = async () => {
    const canOpen = await Linking.canOpenURL(BARBERSHOP_MAPS_URL);
    if (canOpen) {
      await Linking.openURL(BARBERSHOP_MAPS_URL);
    } else {
      Alert.alert('Localização', 'Não foi possível abrir o mapa. Procure "Lourenço Barbearia" no Google Maps.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="LOURENÇO"
        subtitle="BARBEARIA"
        avatarUrl={user?.avatar_url}
        avatarInitials={user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'LB'}
        onAvatarPress={() => navigation.navigate('Perfil')}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Saudação */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Olá,</Text>
          <Text style={styles.greetingName}>{firstName}! ✂️</Text>
        </View>

        {/* Card de Próximo Agendamento */}
        <Card elevated style={styles.nextBookingCard}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextBookingGradient}
          >
            <View style={styles.nextBookingHeader}>
              <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nextBookingLabel}>PRÓXIMO AGENDAMENTO</Text>
            </View>

            {nextBooking ? (
              <View style={styles.nextBookingInfo}>
                <Text style={styles.nextBookingServiceText}>{nextBooking.service?.name}</Text>
                <View style={styles.nextBookingDetailsRow}>
                  <View style={styles.nextBookingDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.nextBookingDetailText}>
                      {new Date(nextBooking.scheduled_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={styles.nextBookingDetailItem}>
                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.nextBookingDetailText}>
                      {new Date(nextBooking.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewHistoryButton}
                  onPress={() => navigation.navigate('Historico')}
                >
                  <Text style={styles.viewHistoryText}>Ver todos os agendamentos</Text>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyBooking}>
                <Ionicons name="cut-outline" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyBookingText}>
                  Nenhum agendamento próximo
                </Text>
                <TouchableOpacity
                  style={styles.bookNowButton}
                  onPress={() => navigation.navigate('Agendar')}
                >
                  <Text style={styles.bookNowText}>AGENDAR AGORA</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Card>

        {/* Atalhos rápidos */}
        <Text style={styles.sectionTitle}>ATALHOS</Text>
        <View style={styles.shortcuts}>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('Agendar')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.shortcutIcon}
            >
              <Ionicons name="cut" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <Text style={styles.shortcutLabel}>AGENDAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('Memórias')}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              style={styles.shortcutIcon}
            >
              <Ionicons name="albums" size={24} color={colors.textOnAccent} />
            </LinearGradient>
            <Text style={styles.shortcutLabel}>ÁLBUM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('Historico')}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="time" size={24} color={colors.textOnAccent} />
            </View>
            <Text style={styles.shortcutLabel}>HISTÓRICO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shortcutItem} onPress={handleOpenMaps}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="location" size={24} color={colors.textOnAccent} />
            </View>
            <Text style={styles.shortcutLabel}>LOCAL</Text>
          </TouchableOpacity>
        </View>

        {/* Seção Último Corte (preview do álbum) */}
        <Text style={styles.sectionTitle}>ÚLTIMO CORTE</Text>
        <Card elevated style={styles.lastCutCard}>
          {lastSticker ? (
            <TouchableOpacity
              style={styles.lastCutContent}
              onPress={() => navigation.navigate('Memórias')}
              activeOpacity={0.85}
            >
              <Image source={{ uri: lastSticker.image_url }} style={styles.lastCutImage} />
              <View style={styles.lastCutInfo}>
                <Text style={styles.lastCutCaption} numberOfLines={1}>{lastSticker.caption}</Text>
                <Text style={styles.lastCutDate}>
                  {new Date(lastSticker.created_at).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={styles.lastCutCta}>Ver álbum completo →</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.lastCutEmpty}>
              <Image
                source={require('../../assets/images/logo-icon.png')}
                style={styles.lastCutWatermark}
                resizeMode="contain"
              />
              <Text style={styles.lastCutEmptyText}>
                Seu álbum de memórias está vazio
              </Text>
              <Text style={styles.lastCutEmptySubtext}>
                Após seu primeiro corte, sua figurinha aparecerá aqui!
              </Text>
            </View>
          )}
        </Card>

        {/* Informações da barbearia */}
        <Text style={styles.sectionTitle}>HORÁRIO DE FUNCIONAMENTO</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Segunda a Sexta: 09:00 - 20:00</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Sábado: 09:00 - 18:00</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="close-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.infoText}>Domingo: Fechado</Text>
          </View>
          <TouchableOpacity style={styles.mapsRow} onPress={handleOpenMaps}>
            <Ionicons name="location-outline" size={18} color={colors.warning} />
            <Text style={styles.mapsText}>Ver localização no mapa</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.warning} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Greeting
  greeting: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  greetingText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  greetingName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
    marginTop: -2,
  },
  // Next Booking
  nextBookingCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 0,
    marginBottom: spacing.xl,
  },
  nextBookingGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  nextBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nextBookingLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  emptyBooking: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyBookingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
  },
  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textOnPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  bookNowText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    letterSpacing: 1,
  },
  nextBookingInfo: {
    paddingVertical: spacing.xs,
  },
  nextBookingServiceText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textOnPrimary,
    marginBottom: spacing.sm,
  },
  nextBookingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextBookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextBookingDetailText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  viewHistoryText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  // Section Title
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  // Shortcuts
  shortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  shortcutItem: {
    alignItems: 'center',
    flex: 1,
  },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  shortcutLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  // Last Cut
  lastCutCard: {
    marginBottom: spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  lastCutEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  lastCutWatermark: {
    width: 48,
    height: 48,
    opacity: 0.1,
    tintColor: colors.primary,
    marginBottom: spacing.sm,
  },
  lastCutEmptyText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  lastCutEmptySubtext: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  lastCutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  lastCutImage: {
    width: 60,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  lastCutInfo: {
    flex: 1,
  },
  lastCutCaption: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  lastCutDate: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  lastCutCta: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  // Info Card
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  mapsText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.warning,
    letterSpacing: 0.3,
  },
});
