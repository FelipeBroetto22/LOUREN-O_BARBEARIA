/**
 * Memórias Screen — ÁLBUM DE FIGURINHAS (o diferencial do app)
 * Design baseado no álbum da Copa do Mundo com figurinhas de cortes.
 * Layout preparado para impressão física futura (proporção 68×98mm).
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import Header from '../../src/components/ui/Header';
import AlbumGrid from '../../src/components/album/AlbumGrid';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { organizeIntoPages, getUserStickers, addSticker } from '../../src/services/albumService';
import { compressAndUpload } from '../../src/services/imageService';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { AlbumSticker } from '../../src/types/album';

export default function MemoriasScreen() {
  const { user } = useAuth();
  const [stickers, setStickers] = useState<AlbumSticker[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (user) {
      getUserStickers(user.id)
        .then(setStickers)
        .catch(console.error);
    }
  }, [user]);

  const pages = organizeIntoPages(stickers);

  // Selecionar foto da galeria ou câmera
  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4], // Proporção de figurinha
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

  // Adicionar figurinha ao álbum
  const handleAddSticker = useCallback(async () => {
    if (!selectedImage || !user) return;

    setIsUploading(true);
    try {
      const imageUrl = await compressAndUpload(selectedImage, user.id);
      
      const newSticker = await addSticker(user.id, {
        image_url: imageUrl,
        caption: caption || 'Novo Corte',
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
  }, [selectedImage, user, stickers, caption]);

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

  return (
    <View style={styles.container}>
      <Header
        title="MEMÓRIAS"
        subtitle="SEU ÁLBUM"
        rightAction={
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{stickers.length} figurinhas</Text>
          </View>
        }
      />

      {/* Álbum */}
      <AlbumGrid
        pages={pages}
        userName={user?.full_name || 'Cliente'}
        totalStickers={stickers.length}
        onAddSticker={handleOpenAddMenu}
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
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setSelectedImage(null); }}>
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

          {/* Caption input */}
          <View style={styles.modalForm}>
            <Input
              label="Descrição do Corte"
              icon="create-outline"
              placeholder="Ex: Degradê com barba"
              value={caption}
              onChangeText={setCaption}
            />

            <Button
              title="COLAR NO ÁLBUM"
              onPress={handleAddSticker}
              loading={isUploading}
              variant="accent"
              fullWidth
              size="lg"
              icon={<Ionicons name="checkmark-circle" size={20} color={colors.textOnAccent} />}
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
    paddingVertical: spacing.lg,
  },
  previewFrame: {
    width: 200,
    height: 267, // 3:4 ratio
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

  // Modal Form
  modalForm: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
