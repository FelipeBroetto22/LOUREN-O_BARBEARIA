/**
 * Memórias Screen — ÁLBUM DE FIGURINHAS
 * Design baseado no álbum da Copa do Mundo com figurinhas de cortes.
 * Caption de até 180 caracteres (descrição do corte + resenha).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import Header from '../../src/components/ui/Header';
import AlbumGrid from '../../src/components/album/AlbumGrid';
import Button from '../../src/components/ui/Button';
import { organizeIntoPages, getUserStickers, addSticker } from '../../src/services/albumService';
import { compressAndUpload } from '../../src/services/imageService';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { AlbumSticker } from '../../src/types/album';

const MAX_CAPTION = 180;

export default function MemoriasScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stickers, setStickers] = useState<AlbumSticker[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const avatarInitials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'LB';

  const loadStickers = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserStickers(user.id);
      setStickers(data);
    } catch (err) {
      console.error('Erro ao carregar figurinhas:', err);
    }
  }, [user]);

  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStickers();
    setRefreshing(false);
  }, [loadStickers]);

  const pages = organizeIntoPages(stickers);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    };

    let result;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisamos da câmera para tirar a foto do corte.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowAddModal(true);
    }
  }, []);

  const handleAddSticker = useCallback(async () => {
    if (!selectedImage || !user) return;

    setIsUploading(true);
    try {
      const imageUrl = await compressAndUpload(selectedImage, user.id);

      const newSticker = await addSticker(user.id, {
        image_url: imageUrl,
        caption: caption.trim() || 'Corte',
      });

      setStickers((prev) => [...prev, newSticker]);
      setShowAddModal(false);
      setSelectedImage(null);
      setCaption('');

      Alert.alert('Figurinha colada! 🎉', `Figurinha #${newSticker.sticker_number} adicionada ao seu álbum!`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao adicionar figurinha.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedImage, user, caption]);

  const handleOpenAddMenu = useCallback(() => {
    Alert.alert(
      'Nova Figurinha ✂️',
      'Como deseja adicionar a foto do seu corte?',
      [
        { text: 'Câmera', onPress: () => pickImage('camera') },
        { text: 'Galeria', onPress: () => pickImage('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [pickImage]);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedImage(null);
    setCaption('');
  };

  const captionRemaining = MAX_CAPTION - caption.length;
  const captionColor =
    captionRemaining < 0
      ? colors.accent
      : captionRemaining < 30
      ? colors.warning
      : colors.textTertiary;

  return (
    <View style={styles.container}>
      <Header
        title="MEMÓRIAS"
        subtitle="SEU ÁLBUM"
        avatarUrl={user?.avatar_url}
        avatarInitials={avatarInitials}
        onAvatarPress={() => navigation?.navigate('Perfil')}
        rightAction={
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{stickers.length} fig.</Text>
          </View>
        }
      />

      {/* Álbum */}
      <AlbumGrid
        pages={pages}
        userName={user?.full_name || 'Cliente'}
        totalStickers={stickers.length}
        onAddSticker={handleOpenAddMenu}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* FAB — Colar Figurinha */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddMenu}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={colors.textOnAccent} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal — Adicionar Figurinha */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>COLAR FIGURINHA</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Preview da foto */}
          {selectedImage && (
            <View style={styles.previewContainer}>
              <View style={styles.previewFrame}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                {/* Sobreposição do número */}
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>
                    #{String(stickers.length + 1).padStart(2, '0')}
                  </Text>
                </View>

                {/* Brilho */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewShine}
                />
              </View>
            </View>
          )}

          {/* Caption com contador de chars */}
          <View style={styles.modalForm}>
            <View style={styles.captionLabelRow}>
              <Text style={styles.captionLabel}>DESCRIÇÃO DO CORTE</Text>
              <Text style={[styles.captionCounter, { color: captionColor }]}>
                {caption.length}/{MAX_CAPTION}
              </Text>
            </View>

            <View style={styles.captionInputWrapper}>
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.textTertiary}
                style={styles.captionIcon}
              />
              <TextInput
                style={styles.captionInput}
                placeholder={'Ex: Degradê com barba, papo sobre futebol...\nMáximo 180 caracteres.'}
                placeholderTextColor={colors.textTertiary}
                value={caption}
                onChangeText={(text) => {
                  if (text.length <= MAX_CAPTION) setCaption(text);
                }}
                multiline
                numberOfLines={4}
                maxLength={MAX_CAPTION}
                textAlignVertical="top"
              />
            </View>

            {caption.length > 0 && (
              <Text style={styles.captionHint}>
                💡 Resenha do corte e papo ficam registrados na figurinha!
              </Text>
            )}

            <Button
              title="COLAR NO ÁLBUM"
              onPress={handleAddSticker}
              loading={isUploading}
              variant="accent"
              fullWidth
              size="lg"
              icon={<Ionicons name="checkmark-circle" size={20} color={colors.textOnAccent} />}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.albumBg,
  },
  headerStats: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  headerStatsText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    ...shadows.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.primary,
    letterSpacing: 2,
  },

  // Preview
  previewContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  previewFrame: {
    width: 180,
    height: 240,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.stickerBorderGold,
    overflow: 'hidden',
    backgroundColor: colors.albumBg,
    ...shadows.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewBadgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  previewShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '50%',
  },

  // Caption
  modalForm: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    flex: 1,
  },
  captionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  captionLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  captionCounter: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
  },
  captionInputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 100,
    alignItems: 'flex-start',
  },
  captionIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  captionInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  captionHint: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
