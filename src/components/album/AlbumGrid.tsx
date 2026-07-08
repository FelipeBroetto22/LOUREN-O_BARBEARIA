/**
 * AlbumGrid — Grade do álbum (estilo scroll vertical)
 * Grade de 5 colunas com 100 slots totais.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StickerCard from './StickerCard';
import StickerSlot from './StickerSlot';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  stickerDimensions,
  shadows,
} from '../../config/theme';
import type { AlbumPageData } from '../../types/album';

interface AlbumGridProps {
  pages: AlbumPageData[];
  userName: string;
  totalStickers: number;
  onAddSticker?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function AlbumGrid({
  pages,
  totalStickers,
  onAddSticker,
  refreshing = false,
  onRefresh,
}: AlbumGridProps) {
  // Como agora é uma página única, pegamos os slots da primeira página
  const slots = pages[0]?.slots || [];

  // Calcular progresso
  const totalSlots = 100;
  const progressPercent = (totalStickers / totalSlots) * 100;

  return (
    <View style={styles.container}>
      {/* Header Fixo Azul */}
      <View style={styles.header}>
        <Ionicons name="menu" size={28} color="#fff" style={styles.menuIcon} />
        <Image
          source={require('../../../assets/images/logo-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>ÁLBUM DE MEMÓRIAS</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {/* Card de Progresso */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              <Text style={styles.progressLabel}>COLECIONADOS: </Text>
              <Text style={styles.progressValue}>{totalStickers}</Text>
              <Text style={styles.progressTotal}> / {totalSlots}</Text>
            </Text>
            <View style={styles.newBadge}>
              <Ionicons name="alert-circle" size={14} color={colors.accent} />
              <Text style={styles.newBadgeText}> Novas Figurinhas</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Grade de Figurinhas */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {slots.map((slot) => (
              <View key={slot.slotIndex}>
                {slot.sticker ? (
                  <StickerCard sticker={slot.sticker} />
                ) : (
                  <StickerSlot
                    slotNumber={slot.slotIndex + 1}
                    // Apenas permitir adicionar na próxima figurinha vazia (a primeira disponível)
                    // Mas para simplificar, se onAddSticker foi passado, o botão pode ser a primeira vazia
                    onPress={
                      onAddSticker && slot.slotIndex === totalStickers
                        ? onAddSticker
                        : undefined
                    }
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, // Fundo atrás do scroll é azul
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.primary,
  },
  menuIcon: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.xl + 10,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#D4C5A9', // Cor dourada do logo
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: '#D4C5A9',
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  scrollContent: {
    backgroundColor: '#FAF7F2', // Fundo creme do álbum
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: stickerDimensions.pagePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    minHeight: '100%', // Preenche a tela
  },
  progressCard: {
    backgroundColor: '#F3EFE7', // Fundo do card
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D4C5A9',
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
  },
  progressLabel: {
    color: '#1A1A1A',
  },
  progressValue: {
    color: colors.accent,
  },
  progressTotal: {
    color: '#6B7280',
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadgeText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.accent,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E8E4DE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderRightWidth: 2,
    borderRightColor: colors.accent, // Detalhe vermelho na ponta da barra
  },
  gridContainer: {
    backgroundColor: '#FAF7F2',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: stickerDimensions.gap,
  },
});
