/**
 * Agendar Screen — Tela de agendamento de serviços
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../src/components/ui/Header';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getServices, createBooking } from '../../src/services/bookingService';
import type { Service } from '../../src/types/booking';

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function AgendarScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm'>('service');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (err) {
        console.error('Erro ao carregar serviços', err);
      }
    };
    loadServices();
  }, []);

  // Gerar próximos 14 dias
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Horários disponíveis
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  const selectedServiceData = services.find((s) => s.id === selectedService);

  const handleConfirm = async () => {
    if (!user || !selectedService || !selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      const [hour, minute] = selectedTime.split(':');
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

      await createBooking(user.id, {
        service_id: selectedService,
        scheduled_at: scheduledAt.toISOString(),
      });

      Alert.alert(
        'Agendamento Confirmado! ✅',
        `${selectedServiceData?.name}\n${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}`,
        [{ text: 'OK', onPress: () => { setStep('service'); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); } }]
      );
    } catch (error: any) {
      Alert.alert('Erro ao agendar', error.message || 'Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="AGENDAR" subtitle="SEU HORÁRIO" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador de etapas */}
        <View style={styles.steps}>
          {['Serviço', 'Data/Hora', 'Confirmar'].map((label, i) => {
            const stepKeys = ['service', 'datetime', 'confirm'] as const;
            const isActive = stepKeys.indexOf(step) >= i;
            const isCurrent = step === stepKeys[i];
            return (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isCurrent && styles.stepCircleCurrent]}>
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {i === 2 && stepKeys.indexOf(step) >= 2 ? '✓' : i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
                {i < 2 && <View style={[styles.stepLine, isActive && styles.stepLineActive]} />}
              </View>
            );
          })}
        </View>

        {/* Step 1: Selecionar serviço */}
        {step === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>ESCOLHA O SERVIÇO</Text>
            {services.map((service) => (
              <Card
                key={service.id}
                onPress={() => setSelectedService(service.id)}
                style={[
                  styles.serviceCard,
                  selectedService === service.id && styles.serviceCardSelected,
                ]}
              >
                <View style={styles.serviceRow}>
                  <View style={[
                    styles.serviceIcon,
                    selectedService === service.id && styles.serviceIconSelected,
                  ]}>
                    <Ionicons
                      name="cut"
                      size={22}
                      color={selectedService === service.id ? colors.textOnPrimary : colors.primary}
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
                    selectedService === service.id && styles.servicePriceSelected,
                  ]}>
                    R$ {Number(service.price).toFixed(2)}
                  </Text>
                </View>
              </Card>
            ))}

            <Button
              title="CONTINUAR"
              onPress={() => setStep('datetime')}
              disabled={!selectedService}
              fullWidth
              size="lg"
              style={styles.continueButton}
            />
          </View>
        )}

        {/* Step 2: Selecionar data e hora */}
        {step === 'datetime' && (
          <View>
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
                <View style={styles.timeGrid}>
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                      >
                        <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.buttonRow}>
              <Button
                title="VOLTAR"
                onPress={() => setStep('service')}
                variant="outline"
                size="md"
                style={styles.halfButton}
              />
              <Button
                title="CONTINUAR"
                onPress={() => setStep('confirm')}
                disabled={!selectedDate || !selectedTime}
                size="md"
                style={styles.halfButton}
              />
            </View>
          </View>
        )}

        {/* Step 3: Confirmar agendamento */}
        {step === 'confirm' && selectedServiceData && selectedDate && selectedTime && (
          <View>
            <Text style={styles.sectionTitle}>CONFIRMAR AGENDAMENTO</Text>

            <Card elevated style={styles.confirmCard}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.confirmGradient}
              >
                <Ionicons name="checkmark-circle" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.confirmService}>{selectedServiceData.name}</Text>

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
                  <Text style={styles.confirmDetailText}>{selectedServiceData.duration_minutes} minutos</Text>
                </View>

                <View style={styles.confirmPriceRow}>
                  <Text style={styles.confirmPriceLabel}>TOTAL</Text>
                  <Text style={styles.confirmPrice}>R$ {Number(selectedServiceData.price).toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </Card>

            <View style={styles.buttonRow}>
              <Button
                title="VOLTAR"
                onPress={() => setStep('datetime')}
                variant="outline"
                size="md"
                style={styles.halfButton}
              />
              <Button
                title="CONFIRMAR"
                onPress={handleConfirm}
                loading={isLoading}
                variant="accent"
                size="md"
                style={styles.halfButton}
              />
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

  // Steps indicator
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCircleCurrent: { backgroundColor: colors.accent },
  stepNumber: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.textTertiary },
  stepNumberActive: { color: colors.textOnPrimary },
  stepLabel: { fontFamily: fonts.light, fontSize: 9, color: colors.textTertiary, marginLeft: 4, letterSpacing: 0.5 },
  stepLabelActive: { color: colors.primary },
  stepLine: { width: 20, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },

  // Section
  sectionTitle: {
    fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.primary,
    letterSpacing: 2, marginBottom: spacing.md,
  },

  // Service Cards
  serviceCard: { marginBottom: spacing.sm },
  serviceCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center' },
  serviceIcon: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(13,44,104,0.08)', alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  serviceIconSelected: { backgroundColor: colors.primary },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.textPrimary },
  serviceDesc: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  servicePrice: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.primary },
  servicePriceSelected: { color: colors.accent },

  // Continue Button
  continueButton: { marginTop: spacing.lg },

  // Date picker
  datesScroll: { marginBottom: spacing.md },
  dateItem: {
    width: 64, paddingVertical: spacing.md, marginRight: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
  },
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
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight, minWidth: 72, alignItems: 'center',
  },
  timeSlotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textPrimary },
  timeTextSelected: { color: colors.textOnPrimary },

  // Buttons row
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  halfButton: { flex: 1 },

  // Confirm card
  confirmCard: { borderWidth: 0, overflow: 'hidden', marginBottom: spacing.md },
  confirmGradient: { padding: spacing.xl, alignItems: 'center', borderRadius: borderRadius.lg },
  confirmService: {
    fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary,
    letterSpacing: 1, marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  confirmDetail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  confirmDetailText: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.8)' },
  confirmPriceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  confirmPriceLabel: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
  confirmPrice: { fontFamily: fonts.bold, fontSize: fontSizes['3xl'], color: colors.textOnPrimary },
});
