/**
 * Barber Agenda Screen — Calendário e agenda do dia do barbeiro
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
  Image,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getBarberBookings,
  completeBooking,
  rescheduleBooking,
  blockSlot,
  getBlockedSlotsForDay,
  unblockSlot,
} from '../../src/services/barberService';
import { cancelBooking } from '../../src/services/bookingService';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { Booking } from '../../src/types/booking';
import type { BlockedSlot } from '../../src/types/barber';

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ALL_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmado', color: colors.primary, bg: 'rgba(13,44,104,0.08)', icon: 'checkmark-circle' as const },
  completed: { label: 'Concluído', color: colors.success, bg: 'rgba(16,185,129,0.08)', icon: 'checkmark-done-circle' as const },
  cancelled: { label: 'Cancelado', color: colors.accent, bg: 'rgba(176,18,31,0.08)', icon: 'close-circle' as const },
};

export default function BarberAgendaScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Remarcar modal
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleBooking_, setRescheduleBooking_] = useState<Booking | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Bloquear horário modal
  const [blockModal, setBlockModal] = useState(false);
  const [blockTime, setBlockTime] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const loadDayData = useCallback(async () => {
    if (!user) return;
    try {
      const [dayBookings, dayBlocked] = await Promise.all([
        getBarberBookings(user.id, selectedDate),
        getBlockedSlotsForDay(user.id, selectedDate),
      ]);
      setBookings(dayBookings);
      setBlockedSlots(dayBlocked);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    setIsLoading(true);
    loadDayData().finally(() => setIsLoading(false));
  }, [loadDayData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDayData();
    setRefreshing(false);
  };

  // Generate week days for the calendar strip (current week ±3)
  const weekDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const handleComplete = (booking: Booking) => {
    Alert.alert('Concluir Atendimento', `Marcar "${booking.service?.name}" de ${booking.client?.full_name} como concluído?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir',
        onPress: async () => {
          try {
            await completeBooking(booking.id);
            setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: 'completed' } : b));
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert('Cancelar Agendamento', `Cancelar "${booking.service?.name}" de ${booking.client?.full_name}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar', style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(booking.id);
            setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const openReschedule = (booking: Booking) => {
    setRescheduleBooking_(booking);
    setRescheduleTime(null);
    setRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking_ || !rescheduleTime) return;
    setIsRescheduling(true);
    try {
      const [h, m] = rescheduleTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(h), parseInt(m), 0, 0);
      await rescheduleBooking(rescheduleBooking_.id, newDate.toISOString());
      setRescheduleModal(false);
      await loadDayData();
      Alert.alert('Remarcado!', `Agendamento remarcado para ${rescheduleTime}.`);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setIsRescheduling(false);
    }
  };

  const openBlock = (time?: string) => {
    setBlockTime(time || null);
    setBlockReason('');
    setBlockModal(true);
  };

  const handleBlock = async () => {
    if (!blockTime || !user) return;
    setIsBlocking(true);
    try {
      const [h, m] = blockTime.split(':');
      const blockDate = new Date(selectedDate);
      blockDate.setHours(parseInt(h), parseInt(m), 0, 0);
      await blockSlot(user.id, { blocked_at: blockDate.toISOString(), reason: blockReason || undefined });
      setBlockModal(false);
      await loadDayData();
      Alert.alert('Horário bloqueado!', `${blockTime} foi bloqueado.`);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (slot: BlockedSlot) => {
    const time = new Date(slot.blocked_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    Alert.alert('Desbloquear', `Desbloquear ${time}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbloquear',
        onPress: async () => {
          try {
            await unblockSlot(slot.id);
            await loadDayData();
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const bookedTimes = bookings.filter(b => b.status !== 'cancelled').map(b => {
    const d = new Date(b.scheduled_at);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const blockedTimes = blockedSlots.map(s => {
    const d = new Date(s.blocked_at);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AGENDA</Text>
            <Text style={styles.headerSub}>{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
          </View>
          <TouchableOpacity
            style={styles.blockFabBtn}
            onPress={() => openBlock()}
          >
            <Ionicons name="ban-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.blockFabBtnText}>Bloquear</Text>
          </TouchableOpacity>
        </View>

        {/* Week strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {weekDays.map((day, i) => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDate(new Date(day))}
                style={[styles.weekDay, isSelected && styles.weekDaySelected]}
              >
                <Text style={[styles.weekDayLabel, isSelected && styles.weekDayLabelSelected]}>
                  {DAYS_SHORT[day.getDay()]}
                </Text>
                <Text style={[styles.weekDayNumber, isSelected && styles.weekDayNumberSelected, isToday && styles.weekDayToday]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              {/* Summary */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryItem, { backgroundColor: 'rgba(13,44,104,0.06)' }]}>
                  <Text style={styles.summaryNumber}>{bookings.filter(b => b.status !== 'cancelled').length}</Text>
                  <Text style={styles.summaryLabel}>AGENDAMENTOS</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: 'rgba(176,18,31,0.06)' }]}>
                  <Text style={[styles.summaryNumber, { color: colors.accent }]}>{blockedSlots.length}</Text>
                  <Text style={styles.summaryLabel}>BLOQUEADOS</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: 'rgba(16,185,129,0.06)' }]}>
                  <Text style={[styles.summaryNumber, { color: colors.success }]}>{bookings.filter(b => b.status === 'completed').length}</Text>
                  <Text style={styles.summaryLabel}>CONCLUÍDOS</Text>
                </View>
              </View>

              {/* Blocked slots list */}
              {blockedSlots.length > 0 && (
                <View style={styles.blockedSection}>
                  <Text style={styles.blockedSectionTitle}>HORÁRIOS BLOQUEADOS</Text>
                  {blockedSlots.map((slot) => (
                    <TouchableOpacity key={slot.id} style={styles.blockedItem} onPress={() => handleUnblock(slot)}>
                      <Ionicons name="ban" size={16} color={colors.accent} />
                      <Text style={styles.blockedTime}>
                        {new Date(slot.blocked_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {slot.reason && <Text style={styles.blockedReason}>{slot.reason}</Text>}
                      <Ionicons name="close-circle-outline" size={16} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {bookings.length > 0 && <Text style={styles.bookingsSectionTitle}>AGENDAMENTOS DO DIA</Text>}
            </>
          }
          renderItem={({ item }) => {
            const status = STATUS_CONFIG[item.status];
            const time = new Date(item.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const isConfirmed = item.status === 'confirmed';
            return (
              <Card style={styles.bookingCard}>
                <View style={styles.bookingRow}>
                  {/* Avatar */}
                  <View style={styles.clientAvatarWrapper}>
                    {item.client?.avatar_url ? (
                      <Image source={{ uri: item.client.avatar_url }} style={styles.clientAvatar} />
                    ) : (
                      <View style={[styles.clientAvatar, styles.clientAvatarFallback]}>
                        <Text style={styles.clientAvatarInitials}>
                          {item.client?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.timeTag]}>
                      <Text style={styles.timeTagText}>{time}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingInfo}>
                    <Text style={styles.clientName}>{item.client?.full_name || 'Cliente'}</Text>
                    <Text style={styles.serviceName}>{item.service?.name}</Text>
                    {item.client?.phone && (
                      <View style={styles.phoneRow}>
                        <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                        <Text style={styles.phoneText}>{item.client.phone}</Text>
                      </View>
                    )}
                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon} size={12} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {isConfirmed && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openReschedule(item)}>
                      <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Remarcar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.success }]} onPress={() => handleComplete(item)}>
                      <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
                      <Text style={[styles.actionBtnText, { color: colors.success }]}>Concluir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.accent }]} onPress={() => handleCancel(item)}>
                      <Ionicons name="close-circle-outline" size={15} color={colors.accent} />
                      <Text style={[styles.actionBtnText, { color: colors.accent }]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={56} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>Dia livre!</Text>
              <Text style={styles.emptySubtitle}>Nenhum agendamento para esta data.</Text>
              <TouchableOpacity style={styles.blockButton} onPress={() => openBlock()}>
                <Ionicons name="ban-outline" size={16} color={colors.textOnPrimary} />
                <Text style={styles.blockButtonText}>Bloquear um horário</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal: Remarcar */}
      <Modal visible={rescheduleModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRescheduleModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRescheduleModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>REMARCAR HORÁRIO</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.modalSubtitle}>
            {rescheduleBooking_?.client?.full_name} — {rescheduleBooking_?.service?.name}
          </Text>
          <Text style={styles.modalSectionLabel}>ESCOLHA O NOVO HORÁRIO</Text>
          <View style={styles.timeSlotsGrid}>
            {ALL_TIME_SLOTS.map((t) => {
              const unavailable = bookedTimes.includes(t) || blockedTimes.includes(t);
              const isSelected = rescheduleTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setRescheduleTime(t)}
                  disabled={unavailable}
                  style={[styles.timeSlotBtn, isSelected && styles.timeSlotBtnSelected, unavailable && styles.timeSlotBtnDisabled]}
                >
                  <Text style={[styles.timeSlotBtnText, isSelected && styles.timeSlotBtnTextSelected, unavailable && styles.timeSlotBtnTextDisabled]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.modalActions}>
            <Button title="CANCELAR" onPress={() => setRescheduleModal(false)} variant="outline" />
            <Button title="CONFIRMAR" onPress={handleReschedule} loading={isRescheduling} disabled={!rescheduleTime} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>

      {/* Modal: Bloquear horário */}
      <Modal visible={blockModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBlockModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBlockModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>BLOQUEAR HORÁRIO</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.modalSectionLabel}>ESCOLHA O HORÁRIO</Text>
          <View style={styles.timeSlotsGrid}>
            {ALL_TIME_SLOTS.map((t) => {
              const unavailable = bookedTimes.includes(t) || blockedTimes.includes(t);
              const isSelected = blockTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setBlockTime(t)}
                  disabled={unavailable}
                  style={[styles.timeSlotBtn, isSelected && styles.timeSlotBtnBlock, unavailable && styles.timeSlotBtnDisabled]}
                >
                  <Text style={[styles.timeSlotBtnText, isSelected && { color: colors.textOnPrimary }, unavailable && styles.timeSlotBtnTextDisabled]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.modalSectionLabel, { marginTop: spacing.lg }]}>MOTIVO (OPCIONAL)</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Ex: Almoço, compromisso pessoal..."
            placeholderTextColor={colors.textTertiary}
            value={blockReason}
            onChangeText={setBlockReason}
          />
          <View style={styles.modalActions}>
            <Button title="CANCELAR" onPress={() => setBlockModal(false)} variant="outline" />
            <Button title="BLOQUEAR" onPress={handleBlock} loading={isBlocking} disabled={!blockTime} variant="accent" style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary, letterSpacing: 3 },
  headerSub: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  blockFabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  blockFabBtnText: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.textOnPrimary },

  // Week strip
  weekStrip: { flexGrow: 0, marginBottom: spacing.xs },
  weekDay: { width: 44, paddingVertical: spacing.sm, marginRight: spacing.xs, borderRadius: borderRadius.md, alignItems: 'center' },
  weekDaySelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  weekDayLabel: { fontFamily: fonts.light, fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  weekDayLabelSelected: { color: colors.textOnPrimary },
  weekDayNumber: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  weekDayNumberSelected: { color: colors.textOnPrimary },
  weekDayToday: { color: colors.accentLight },

  // Content
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },

  // Summary
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryItem: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  summaryNumber: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.primary },
  summaryLabel: { fontFamily: fonts.light, fontSize: 9, color: colors.textTertiary, letterSpacing: 1, marginTop: 2 },

  // Blocked section
  blockedSection: { marginBottom: spacing.md },
  blockedSectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.accent, letterSpacing: 2, marginBottom: spacing.xs },
  blockedItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(176,18,31,0.06)', borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  blockedTime: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.accent },
  blockedReason: { fontFamily: fonts.light, fontSize: fontSizes.sm, color: colors.textTertiary, flex: 1 },

  bookingsSectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.primary, letterSpacing: 2, marginBottom: spacing.xs },

  // Booking card
  bookingCard: { marginBottom: spacing.xs },
  bookingRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  clientAvatarWrapper: { alignItems: 'center', gap: spacing.xs },
  clientAvatar: { width: 48, height: 48, borderRadius: 24 },
  clientAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  clientAvatarInitials: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textOnPrimary },
  timeTag: { backgroundColor: colors.primary, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  timeTagText: { fontFamily: fonts.bold, fontSize: 9, color: colors.textOnPrimary, letterSpacing: 0.5 },
  bookingInfo: { flex: 1 },
  clientName: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textPrimary },
  serviceName: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phoneText: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginTop: spacing.xs },
  statusText: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.5 },
  actionsRow: { flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { fontFamily: fonts.semibold, fontSize: fontSizes.xs },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtitle: { fontFamily: fonts.light, fontSize: fontSizes.md, color: colors.textTertiary, marginTop: 4 },
  blockButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accent, borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.lg },
  blockButtonText: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textOnPrimary },

  // Modals
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  modalTitle: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.primary, letterSpacing: 2 },
  modalSubtitle: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary, marginBottom: spacing.lg },
  modalSectionLabel: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlotBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, minWidth: 78, alignItems: 'center' },
  timeSlotBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeSlotBtnBlock: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeSlotBtnDisabled: { opacity: 0.4 },
  timeSlotBtnText: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textPrimary },
  timeSlotBtnTextSelected: { color: colors.textOnPrimary },
  timeSlotBtnTextDisabled: { color: colors.textTertiary },
  reasonInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.md, fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
