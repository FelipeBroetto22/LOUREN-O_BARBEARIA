/**
 * Histórico — Todos os agendamentos do usuário com opção de cancelar
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUserBookings, cancelBooking } from '../../src/services/bookingService';
import Card from '../../src/components/ui/Card';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { Booking, BookingStatus } from '../../src/types/booking';

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  confirmed: {
    label: 'Confirmado',
    color: colors.primary,
    bg: 'rgba(13,44,104,0.08)',
    icon: 'checkmark-circle',
  },
  completed: {
    label: 'Concluído',
    color: colors.success,
    bg: 'rgba(16,185,129,0.08)',
    icon: 'checkmark-done-circle',
  },
  cancelled: {
    label: 'Cancelado',
    color: colors.accent,
    bg: 'rgba(176,18,31,0.08)',
    icon: 'close-circle',
  },
};

export default function HistoricoScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserBookings(user.id);
      setBookings(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [user]);

  useEffect(() => {
    loadBookings().finally(() => setIsLoading(false));
  }, [loadBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancelar Agendamento',
      `Deseja cancelar o agendamento de ${booking.service?.name} em ${new Date(
        booking.scheduled_at
      ).toLocaleDateString('pt-BR')} às ${new Date(booking.scheduled_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await cancelBooking(booking.id);
              setBookings((prev) =>
                prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
              );
              Alert.alert('Cancelado', 'Agendamento cancelado com sucesso.');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível cancelar.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const isFuture = (scheduledAt: string) => new Date(scheduledAt) > new Date();

  const renderItem = ({ item }: { item: Booking }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    const future = isFuture(item.scheduled_at);
    const date = new Date(item.scheduled_at);
    const isCancelling = cancellingId === item.id;

    return (
      <Card style={styles.card}>
        {/* Cabeçalho do Card */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceIconWrapper}>
            <Ionicons name="cut" size={22} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.serviceName}>{item.service?.name || 'Serviço'}</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.dateText}>
                {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Rodapé do Card */}
        <View style={styles.cardFooter}>
          {/* Badge de status */}
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={14} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>

          <View style={styles.cardFooterRight}>
            {/* Preço */}
            <Text style={styles.price}>
              R$ {Number(item.service?.price || 0).toFixed(2)}
            </Text>

            {/* Botão cancelar (apenas futuros confirmados) */}
            {future && item.status === 'confirmed' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>HISTÓRICO</Text>
          <Text style={styles.headerSub}>AGENDAMENTOS</Text>
        </View>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{bookings.length}</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
              <Text style={styles.emptySubtitle}>
                Seus agendamentos aparecerão aqui após você agendar um serviço.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Main', { screen: 'Agendar' })}
              >
                <Text style={styles.emptyButtonText}>AGENDAR AGORA</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textOnPrimary,
    letterSpacing: 3,
  },
  headerSub: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.full,
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerCountText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card
  card: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  serviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(13,44,104,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  dateText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.3,
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.primary,
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    minWidth: 70,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    ...shadows.xl,
  },
  emptyButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
    letterSpacing: 2,
  },
});
