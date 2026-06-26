/**
 * StickerCard — Figurinha preenchida do álbum (estilo Panini)
 * Renderiza a foto do corte com moldura, número, e dados do serviço.
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  fonts,
  fontSizes,
  spacing,
  stickerDimensions,
  shadows,
} from '../../config/theme';
import type { AlbumSticker } from '../../types/album';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STICKER_WIDTH =
  (SCREEN_WIDTH - stickerDimensions.pagePadding * 2 - stickerDimensions.gap) / stickerDimensions.columns;
const STICKER_HEIGHT = STICKER_WIDTH / stickerDimensions.aspectRatio;

interface StickerCardProps {
  sticker: AlbumSticker;
  onPress?: () => void;
}

export default function StickerCard({ sticker, onPress }: StickerCardProps) {
  const formattedDate = new Date(sticker.taken_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.container, shadows.md]}>
      {/* Moldura externa (borda dourada/creme) */}
      <View style={styles.frame}>
        {/* Número da figurinha */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>
            #{String(sticker.sticker_number).padStart(2, '0')}
          </Text>
        </View>

        {/* Foto do corte */}
        <Image
          source={{ uri: sticker.image_url }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Barra inferior com info */}
        <LinearGradient
          colors={['transparent', 'rgba(13, 44, 104, 0.95)']}
          style={styles.infoBar}
        >
          <Text style={styles.caption} numberOfLines={1}>
            {sticker.caption || 'Corte'}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </LinearGradient>

        {/* Brilho sutil no canto (efeito de figurinha holográfica) */}
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shine}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    marginBottom: stickerDimensions.gap,
  },
  frame: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: colors.stickerBorder,
    backgroundColor: colors.albumBg,
    overflow: 'hidden',
  },
  numberBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 24,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontFamily: fonts.light,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '50%',
    borderTopLeftRadius: 4,
  },
});

export { STICKER_WIDTH, STICKER_HEIGHT };
