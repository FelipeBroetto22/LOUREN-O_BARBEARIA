/**
 * StickerSlot — Slot vazio do álbum (com monograma em opacidade baixa)
 * Estilo de figurinha "por colar" do álbum da Copa.
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import {
  colors,
  fonts,
  fontSizes,
  stickerDimensions,
} from '../../config/theme';
import { STICKER_WIDTH, STICKER_HEIGHT } from './StickerCard';

interface StickerSlotProps {
  slotNumber: number;
  onPress?: () => void;
}

export default function StickerSlot({ slotNumber, onPress }: StickerSlotProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
      disabled={!onPress}
    >
      <View style={styles.slot}>
        {/* Monograma em opacidade baixa */}
        <Image
          source={require('../../../assets/images/logo-icon.png')}
          style={styles.watermark}
          resizeMode="contain"
        />

        {/* Número do slot */}
        <View style={styles.numberContainer}>
          <Text style={styles.numberText}>
            #{String(slotNumber).padStart(2, '0')}
          </Text>
        </View>

        {/* Interrogação central */}
        <Text style={styles.questionMark}>?</Text>

        {/* Texto "por colar" */}
        <Text style={styles.emptyText}>POR COLAR</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    marginBottom: stickerDimensions.gap,
  },
  slot: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.slotBorder,
    borderStyle: 'dashed',
    backgroundColor: colors.slotEmpty,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    opacity: 0.06,
    tintColor: colors.primary,
  },
  numberContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(13, 44, 104, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.primary,
    opacity: 0.3,
    letterSpacing: 0.5,
  },
  questionMark: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.primary,
    opacity: 0.1,
  },
  emptyText: {
    fontFamily: fonts.semibold,
    fontSize: 8,
    color: colors.primary,
    opacity: 0.2,
    letterSpacing: 2,
    marginTop: 4,
  },
});
