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
  FlatList,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  return (
    <View style={styles.container}>

      <ScrollView
        style={{ flex: 1 }}
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
        {pages.map((page) => {
          const slots = page.slots;
          const yearStickersCount = slots.filter((s) => s.sticker).length;
          const currentTotalSlots = slots.length;
          const progressPercent = (yearStickersCount / currentTotalSlots) * 100;
          const firstEmptySlotIndex = slots.findIndex((s) => !s.sticker);

          return (
            <View key={page.pageNumber} style={styles.pageContainer}>
              {/* Card de Progresso */}
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    <Text style={styles.progressLabel}>COLECIONADOS EM {page.pageNumber}: </Text>
                    <Text style={styles.progressValue}>{yearStickersCount}</Text>
                    <Text style={styles.progressTotal}> / {currentTotalSlots}</Text>
                  </Text>
                  {yearStickersCount > 0 && (
                    <View style={styles.newBadge}>
                      <Ionicons name="star" size={14} color={colors.accent} />
                    </View>
                  )}
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
                          onPress={
                            onAddSticker && slot.slotIndex === firstEmptySlotIndex
                              ? onAddSticker
                              : undefined
                          }
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, // Fundo atrás do scroll é azul
    paddingTop: spacing.md, // Pequeno espaçamento do topo
  },
  scrollContent: {
    backgroundColor: '#FAF7F2', // Fundo creme do álbum
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: stickerDimensions.pagePadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'] + spacing.xl, // Espaço extra para a tab bar
    flexGrow: 1,
  },
  pageContainer: {
    marginBottom: spacing.xl,
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
