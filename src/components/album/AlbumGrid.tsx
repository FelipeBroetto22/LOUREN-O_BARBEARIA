/**
 * AlbumGrid — Grade do álbum com paginação horizontal (estilo virar página)
 * Cada página tem 6 slots (2 colunas × 3 linhas) no estilo álbum de figurinhas da Copa.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
}

export default function AlbumGrid({
  pages,
  userName,
  totalStickers,
  onAddSticker,
}: AlbumGridProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      {/* Capa do Álbum (Header) */}
      <View style={styles.albumHeader}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.albumHeaderGradient}
        >
          <Image
            source={require('../../../assets/images/logo-icon.png')}
            style={styles.albumLogo}
            resizeMode="contain"
          />
          <Text style={styles.albumTitle}>ÁLBUM DE MEMÓRIAS</Text>
          <Text style={styles.albumSubtitle}>LOURENÇO BARBEARIA</Text>
          <View style={styles.albumStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalStickers}</Text>
              <Text style={styles.statLabel}>FIGURINHAS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pages.length}</Text>
              <Text style={styles.statLabel}>PÁGINAS</Text>
            </View>
          </View>
          <Text style={styles.ownerName}>{userName.toUpperCase()}</Text>
        </LinearGradient>
      </View>

      {/* Páginas do Álbum (scroll horizontal paginado) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.pagesScroll}
      >
        {pages.map((page) => (
          <View key={page.pageNumber} style={styles.page}>
            {/* Número da página */}
            <View style={styles.pageHeader}>
              <View style={styles.pageNumberLine} />
              <Text style={styles.pageNumber}>
                PÁGINA {String(page.pageNumber).padStart(2, '0')}
              </Text>
              <View style={styles.pageNumberLine} />
            </View>

            {/* Grade de figurinhas 2×3 */}
            <View style={styles.stickerGrid}>
              {page.slots.map((slot) => (
                <View key={slot.slotIndex} style={styles.slotWrapper}>
                  {slot.sticker ? (
                    <StickerCard sticker={slot.sticker} />
                  ) : (
                    <StickerSlot
                      slotNumber={slot.slotIndex + 1}
                      onPress={onAddSticker}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Indicador de páginas (dots) */}
      <View style={styles.pagination}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.albumBg,
  },
  // Album Header (Capa)
  albumHeader: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.lg,
  },
  albumHeaderGradient: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  albumLogo: {
    width: 56,
    height: 56,
    tintColor: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  albumTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textOnPrimary,
    letterSpacing: 3,
    textAlign: 'center',
  },
  albumSubtitle: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    marginTop: 2,
  },
  albumStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  statNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textOnPrimary,
  },
  statLabel: {
    fontFamily: fonts.light,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ownerName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginTop: spacing.md,
  },
  // Pages
  pagesScroll: {
    flex: 1,
    marginTop: spacing.md,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: stickerDimensions.pagePadding,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pageNumberLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stickerBorder,
    opacity: 0.5,
  },
  pageNumber: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    opacity: 0.3,
    letterSpacing: 2,
    marginHorizontal: spacing.md,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotWrapper: {
    width: '48%',
  },
  // Pagination Dots
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.stickerBorder,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
