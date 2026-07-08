/**
 * StickerSlot — Slot vazio do álbum
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const isActionable = !!onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.container}
      disabled={!isActionable}
    >
      <View style={[styles.slot, isActionable && styles.slotActionable]}>
        {/* Número do slot no topo direito */}
        <Text style={styles.numberText}>
          {String(slotNumber).padStart(2, '0')}
        </Text>

        {isActionable ? (
          <View style={styles.centerAction}>
            <Ionicons name="add" size={20} color={colors.accent} />
            <Text style={styles.addText}>ADICIONAR</Text>
            <Text style={styles.addText}>FOTO</Text>
          </View>
        ) : (
          <Image
            source={require('../../../assets/images/logo-icon.png')}
            style={styles.watermark}
            resizeMode="contain"
          />
        )}

        {/* Pilula "SEM FOTO" na base */}
        <View style={styles.pillContainer}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>SEM FOTO</Text>
          </View>
        </View>
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4C5A9', // Cor borda do slot vazio
    backgroundColor: '#F9F7F3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotActionable: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E4DE',
    borderStyle: 'solid',
  },
  watermark: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    opacity: 0.1,
    tintColor: '#D4C5A9', // Cor do logo no fundo
  },
  numberText: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
  },
  centerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8, // Compensate for pill
  },
  addText: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: colors.accent,
    textAlign: 'center',
    marginTop: 1,
  },
  pillContainer: {
    position: 'absolute',
    bottom: 6,
    width: '100%',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: colors.surface,
  },
});
