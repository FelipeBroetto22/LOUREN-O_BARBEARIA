/**
 * StickerCard — Figurinha preenchida do álbum
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  fonts,
  fontSizes,
  stickerDimensions,
  shadows,
} from '../../config/theme';
import type { AlbumSticker } from '../../types/album';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STICKER_WIDTH =
  (SCREEN_WIDTH - stickerDimensions.pagePadding * 2 - (stickerDimensions.columns - 1) * stickerDimensions.gap) / stickerDimensions.columns;
const STICKER_HEIGHT = STICKER_WIDTH / stickerDimensions.aspectRatio;

interface StickerCardProps {
  sticker: AlbumSticker;
  onPress?: () => void;
}

export default function StickerCard({ sticker, onPress }: StickerCardProps) {
  // O reference design mostra um selo vermelho na figurinha, vamos simulá-lo
  return (
    <View style={[styles.container, shadows.sm]}>
      <View style={styles.frame}>
        {/* Foto do corte */}
        <Image
          source={{ uri: sticker.image_url }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Número da figurinha (top right) */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>
            {String(sticker.sticker_number).padStart(2, '0')}
          </Text>
        </View>

        {/* Faixa branca na base */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText} numberOfLines={1}>
            Classic Cut
          </Text>
        </View>

        {/* Selo/Ribbon vermelho no canto */}
        <View style={styles.seal}>
          <Ionicons name="ribbon" size={14} color={colors.accent} style={styles.sealIcon} />
        </View>
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4C5A9',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  numberBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,249,235,0.85)',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    zIndex: 10,
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: '#000',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9F7F3',
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#D4C5A9',
  },
  labelText: {
    fontFamily: fonts.bold,
    fontSize: 6,
    color: '#1A1A1A',
  },
  seal: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    zIndex: 11,
  },
  sealIcon: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export { STICKER_WIDTH, STICKER_HEIGHT };
