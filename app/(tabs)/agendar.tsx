/**
 * Agendar Screen — Fluxo de 4 etapas: Barbeiro → Serviço → Data/Hora → Confirmar
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../src/components/ui/Header';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getServices, createBooking, getBookedSlots } from '../../src/services/bookingService';
import { getBarbers, getBlockedSlots } from '../../src/services/barberService';
import type { Service } from '../../src/types/booking';
import type { Barber } from '../../src/types/barber';

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const ALL_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

type Step = 'barber' | 'service' | 'datetime' | 'confirm';

export default function AgendarScreen({ navigation }: any) {
  const { user } = useAuth();

  // Selection state
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('barber');

  // Data
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);

  // Loading
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const avatarInitials =
    user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'LB';

  // Load barbers on mount
  useEffect(() => {
    getBarbers()
      .then(setBarbers)
      .catch(console.error)
      .finally(() => setLoadingBarbers(false));
  }, []);

  // Load services when barbeiro selected
  useEffect(() => {
    if (!selectedBarber) return;
    setLoadingServices(true);
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoadingServices(false));
  }, [selectedBarber]);

  // Load occupied + blocked slots when date or barber changes
  useEffect(() => {
    if (!selectedDate || !selectedBarber) return;
    setSelectedTime(null);
    setLoadingSlots(true);

    Promise.all([
      getBookedSlots(selectedDate, selectedBarber.id),
      getBlockedSlots(selectedBarber.id, selectedDate),
    ])
      .then(([booked, blocked]) => {
        setBookedSlots(booked);
        setBlockedSlots(blocked);
      })
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedBarber]);

  // Generate next 14 days (excluding Sunday)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const isSlotUnavailable = (time: string) =>
    bookedSlots.includes(time) || blockedSlots.includes(time);

  const handleConfirm = async () => {
    if (!user || !selectedBarber || !selectedService || !selectedDate || !selectedTime) return;

    setIsConfirming(true);
    try {
      const [hour, minute] = selectedTime.split(':');
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

      await createBooking(user.id, {
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        scheduled_at: scheduledAt.toISOString(),
      });

      Alert.alert(
        'Agendamento Confirmado! ✅',
        `${selectedService.name} com ${selectedBarber.display_name}\n${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}`,
        [
          { text: 'Ver Histórico', onPress: () => navigation.navigate('Historico') },
          {
            text: 'Início',
            onPress: () => {
              setStep('barber');
              setSelectedBarber(null);
              setSelectedService(null);
              setSelectedDate(null);
              setSelectedTime(null);
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro ao agendar', error.message || 'Tente novamente mais tarde.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Step labels for indicator
  const stepLabels: { key: Step; label: string }[] = [
    { key: 'barber', label: 'Barbeiro' },
    { key: 'service', label: 'Serviço' },
    { key: 'datetime', label: 'Data/Hora' },
    { key: 'confirm', label: 'Confirmar' },
  ];
  const stepOrder: Step[] = ['barber', 'service', 'datetime', 'confirm'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <View style={styles.container}>
      <Header
        title="AGENDAR"
        subtitle="SEU HORÁRIO"
        avatarUrl={user?.avatar_url}
        avatarInitials={avatarInitials}
        onAvatarPress={() => navigation.navigate('Perfil')}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Indicador de etapas */}
        <View style={styles.steps}>
          {stepLabels.map(({ key, label }, i) => {
            const isActive = currentStepIndex >= i;
            const isCurrent = step === key;
            return (
              <View key={key} style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCurrent && styles.stepCircleCurrent,
                ]}>
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {currentStepIndex > i ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
                {i < stepLabels.length - 1 && (
                  <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
                )}
              </View>
            );
          })}
        </View>

        {/* ── STEP 1: BARBEIRO ─────────────────────────────── */}
        {step === 'barber' && (
          <View>
            <Text style={styles.sectionTitle}>ESCOLHA SEU BARBEIRO</Text>
            {loadingBarbers ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>Carregando barbeiros...</Text>
              </View>
            ) : barbers.length === 0 ? (
              <View style={styles.loadingCenter}>
                <Ionicons name="person-outline" size={48} color={colors.borderLight} />
                <Text style={styles.loadingText}>Nenhum barbeiro disponível</Text>
              </View>
            ) : (
              barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  onPress={() => setSelectedBarber(barber)}
                  activeOpacity={0.85}
                >
                  <Card
                    style={[
                      styles.barberCard,
                      selectedBarber?.id === barber.id && styles.barberCardSelected,
                    ]}
                  >
                    <View style={styles.barberRow}>
                      {/* Avatar */}
                      {barber.avatar_url ? (
                        <Image source={{ uri: barber.avatar_url }} style={styles.barberAvatar} />
                      ) : (
                        <View style={[styles.barberAvatar, styles.barberAvatarFallback]}>
                          <Text style={styles.barberAvatarInitials}>
                            {barber.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View style={styles.barberInfo}>
                        <Text style={styles.barberName}>{barber.display_name}</Text>
                        {barber.specialty && (
                          <View style={styles.specialtyRow}>
                            <Ionicons name="cut-outline" size={12} color={colors.textTertiary} />
                            <Text style={styles.barberSpecialty}>{barber.specialty}</Text>
                          </View>
                        )}
                        {barber.bio && (
                          <Text style={styles.barberBio} numberOfLines={2}>{barber.bio}</Text>
                        )}
                      </View>

                      {selectedBarber?.id === barber.id && (
                        <View style={styles.selectedCheck}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}

            <Button
              title="CONTINUAR"
              onPress={() => setStep('service')}
              disabled={!selectedBarber}
              fullWidth
              size="lg"
              style={styles.continueButton}
            />
          </View>
        )}

        {/* ── STEP 2: SERVIÇO ──────────────────────────────── */}
        {step === 'service' && (
          <View>
            {/* Barbeiro selecionado (resumo) */}
            <TouchableOpacity
              style={styles.selectedBarberSummary}
              onPress={() => setStep('barber')}
            >
              <Ionicons name="person" size={14} color={colors.primary} />
              <Text style={styles.selectedBarberSummaryText}>
                {selectedBarber?.display_name}
              </Text>
              <Text style={styles.selectedBarberChange}>trocar</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>ESCOLHA O SERVIÇO</Text>
            {loadingServices ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              services.map((service) => (
                <Card
                  key={service.id}
                  onPress={() => setSelectedService(service)}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === service.id && styles.serviceCardSelected,
                  ]}
                >
                  <View style={styles.serviceRow}>
                    <View style={[
                      styles.serviceIcon,
                      selectedService?.id === service.id && styles.serviceIconSelected,
                    ]}>
                      <Ionicons
                        name="cut"
                        size={22}
                        color={selectedService?.id === service.id ? colors.textOnPrimary : colors.primary}
                      />
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDesc}>{service.description}</Text>
                      <View style={styles.serviceMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                        <Text style={styles.serviceMetaText}>{service.duration_minutes} min</Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.servicePrice,
                      selectedService?.id === service.id && styles.servicePriceSelected,
                    ]}>
                      R$ {Number(service.price).toFixed(2)}
                    </Text>
                  </View>
                </Card>
              ))
            )}
            <View style={styles.buttonRow}>
              <Button title="VOLTAR" onPress={() => setStep('barber')} variant="outline" size="md" style={styles.halfButton} />
              <Button title="CONTINUAR" onPress={() => setStep('datetime')} disabled={!selectedService} size="md" style={styles.halfButton} />
            </View>
          </View>
        )}

        {/* ── STEP 3: DATA E HORA ──────────────────────────── */}
        {step === 'datetime' && (
          <View>
            {/* Resumo */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Ionicons name="person" size={12} color={colors.primary} />
                <Text style={styles.summaryChipText}>{selectedBarber?.display_name}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Ionicons name="cut" size={12} color={colors.primary} />
                <Text style={styles.summaryChipText}>{selectedService?.name}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>ESCOLHA A DATA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
              {dates.map((date, i) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isSunday = date.getDay() === 0;
                return (
                  <TouchableOpacity
                    key={i}
                    disabled={isSunday}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.dateItem,
                      isSelected && styles.dateItemSelected,
                      isSunday && styles.dateItemDisabled,
                    ]}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateDaySelected, isSunday && styles.dateDayDisabled]}>
                      {DAYS[date.getDay()]}
                    </Text>
                    <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected, isSunday && styles.dateNumberDisabled]}>
                      {date.getDate()}
                    </Text>
                    <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected, isSunday && styles.dateDayDisabled]}>
                      {date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedDate && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>ESCOLHA O HORÁRIO</Text>
                {loadingSlots ? (
                  <View style={styles.slotsLoading}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.slotsLoadingText}>Verificando disponibilidade...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.surface }]} />
                        <Text style={styles.legendText}>Disponível</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                        <Text style={styles.legendText}>Selecionado</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.borderLight }]} />
                        <Text style={styles.legendText}>Indisponível</Text>
                      </View>
                    </View>
                    <View style={styles.timeGrid}>
                      {ALL_TIME_SLOTS.map((time) => {
                        const isSelected = selectedTime === time;
                        const isUnavailable = isSlotUnavailable(time);
                        return (
                          <TouchableOpacity
                            key={time}
                            onPress={() => setSelectedTime(time)}
                            disabled={isUnavailable}
                            style={[
                              styles.timeSlot,
                              isSelected && styles.timeSlotSelected,
                              isUnavailable && styles.timeSlotBooked,
                            ]}
                          >
                            <Text style={[
                              styles.timeText,
                              isSelected && styles.timeTextSelected,
                              isUnavailable && styles.timeTextBooked,
                            ]}>
                              {time}
                            </Text>
                            {isUnavailable && <Text style={styles.bookedLabel}>—</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.buttonRow}>
              <Button title="VOLTAR" onPress={() => setStep('service')} variant="outline" size="md" style={styles.halfButton} />
              <Button title="CONTINUAR" onPress={() => setStep('confirm')} disabled={!selectedDate || !selectedTime} size="md" style={styles.halfButton} />
            </View>
          </View>
        )}

        {/* ── STEP 4: CONFIRMAR ────────────────────────────── */}
        {step === 'confirm' && selectedBarber && selectedService && selectedDate && selectedTime && (
          <View>
            <Text style={styles.sectionTitle}>CONFIRMAR AGENDAMENTO</Text>

            <Card elevated style={styles.confirmCard}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.confirmGradient}
              >
                <Ionicons name="checkmark-circle" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.confirmService}>{selectedService.name}</Text>

                <View style={styles.confirmDetail}>
                  <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.confirmDetailText}>{selectedBarber.display_name}</Text>
                </View>

                <View style={styles.confirmDetail}>
                  <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.confirmDetailText}>
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </Text>
                </View>

                <View style={styles.confirmDetail}>
                  <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.confirmDetailText}>{selectedTime}</Text>
                </View>

                <View style={styles.confirmDetail}>
                  <Ionicons name="hourglass-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.confirmDetailText}>{selectedService.duration_minutes} minutos</Text>
                </View>

                <View style={styles.confirmPriceRow}>
                  <Text style={styles.confirmPriceLabel}>TOTAL</Text>
                  <Text style={styles.confirmPrice}>R$ {Number(selectedService.price).toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </Card>

            <View style={styles.buttonRow}>
              <Button title="VOLTAR" onPress={() => setStep('datetime')} variant="outline" size="md" style={styles.halfButton} />
              <Button title="CONFIRMAR" onPress={handleConfirm} loading={isConfirming} variant="accent" size="md" style={styles.halfButton} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentPadding: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  // Steps
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCircleCurrent: { backgroundColor: colors.accent },
  stepNumber: { fontFamily: fonts.bold, fontSize: 9, color: colors.textTertiary },
  stepNumberActive: { color: colors.textOnPrimary },
  stepLabel: { fontFamily: fonts.light, fontSize: 8, color: colors.textTertiary, marginLeft: 3, letterSpacing: 0.3 },
  stepLabelActive: { color: colors.primary },
  stepLine: { width: 14, height: 2, backgroundColor: colors.border, marginHorizontal: 3 },
  stepLineActive: { backgroundColor: colors.primary },

  // Misc
  sectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.primary, letterSpacing: 2, marginBottom: spacing.md },
  loadingCenter: { alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { fontFamily: fonts.light, fontSize: fontSizes.md, color: colors.textTertiary, marginTop: spacing.sm },
  continueButton: { marginTop: spacing.lg },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  halfButton: { flex: 1 },

  // Summary chips
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(13,44,104,0.06)', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  summaryChipText: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.primary },

  // Barber cards
  barberCard: { marginBottom: spacing.sm },
  barberCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  barberRow: { flexDirection: 'row', alignItems: 'center' },
  barberAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: spacing.md },
  barberAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  barberAvatarInitials: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.textOnPrimary },
  barberInfo: { flex: 1 },
  barberName: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textPrimary },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  barberSpecialty: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textSecondary },
  barberBio: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 4, lineHeight: 16 },
  selectedCheck: { marginLeft: spacing.sm },

  // Selected barber summary (on step 2+)
  selectedBarberSummary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginBottom: spacing.md, paddingVertical: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  selectedBarberSummaryText: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.primary },
  selectedBarberChange: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary, letterSpacing: 0.5 },

  // Services
  serviceCard: { marginBottom: spacing.sm },
  serviceCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center' },
  serviceIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: 'rgba(13,44,104,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  serviceIconSelected: { backgroundColor: colors.primary },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.textPrimary },
  serviceDesc: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  servicePrice: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.primary },
  servicePriceSelected: { color: colors.accent },

  // Date picker
  datesScroll: { marginBottom: spacing.md },
  dateItem: { width: 64, paddingVertical: spacing.md, marginRight: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  dateItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateItemDisabled: { opacity: 0.3 },
  dateDay: { fontFamily: fonts.semibold, fontSize: 9, color: colors.textTertiary, letterSpacing: 1 },
  dateDaySelected: { color: 'rgba(255,255,255,0.7)' },
  dateDayDisabled: { color: colors.textTertiary },
  dateNumber: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.textPrimary, marginVertical: 2 },
  dateNumberSelected: { color: colors.textOnPrimary },
  dateNumberDisabled: { color: colors.textTertiary },
  dateMonth: { fontFamily: fonts.light, fontSize: 8, color: colors.textTertiary, letterSpacing: 1 },
  dateMonthSelected: { color: 'rgba(255,255,255,0.6)' },

  // Time grid
  slotsLoading: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  slotsLoadingText: { fontFamily: fonts.light, fontSize: fontSizes.sm, color: colors.textTertiary },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.borderLight },
  legendText: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, minWidth: 80, alignItems: 'center' },
  timeSlotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeSlotBooked: { backgroundColor: colors.borderLight, borderColor: colors.border, opacity: 0.5 },
  timeText: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textPrimary },
  timeTextSelected: { color: colors.textOnPrimary },
  timeTextBooked: { color: colors.textTertiary },
  bookedLabel: { fontFamily: fonts.light, fontSize: 8, color: colors.textTertiary, letterSpacing: 0.5 },

  // Confirm
  confirmCard: { borderWidth: 0, overflow: 'hidden', marginBottom: spacing.md },
  confirmGradient: { padding: spacing.xl, alignItems: 'center', borderRadius: borderRadius.lg },
  confirmService: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary, letterSpacing: 1, marginTop: spacing.sm, marginBottom: spacing.lg },
  confirmDetail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  confirmDetailText: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.8)' },
  confirmPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  confirmPriceLabel: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
  confirmPrice: { fontFamily: fonts.bold, fontSize: fontSizes['3xl'], color: colors.textOnPrimary },
});
