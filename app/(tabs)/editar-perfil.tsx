/**
 * Editar Perfil — Tela para atualizar nome, telefone e avatar do usuário
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { updateProfile } from '../../src/services/authService';
import { uploadAvatar } from '../../src/services/imageService';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';

export default function EditarPerfilScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickAvatar = async () => {
    Alert.alert(
      'Foto do Perfil',
      'Como deseja escolher sua foto?',
      [
        {
          text: 'Câmera',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert('Permissão negada', 'Precisamos acessar sua câmera.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });
            if (!result.canceled && result.assets[0]) {
              await doUploadAvatar(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Alert.alert('Permissão negada', 'Precisamos acessar suas fotos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });
            if (!result.canceled && result.assets[0]) {
              await doUploadAvatar(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const doUploadAvatar = async (uri: string) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(uri, user.id);
      setAvatarUri(publicUrl);
      await updateProfile(user.id, { avatar_url: publicUrl });
      await refreshProfile();
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error);
      Alert.alert('Erro no Avatar', `Falha ao enviar foto:\\n${errorMsg}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshProfile();
      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const errorMsg = error?.message || JSON.stringify(error);
      Alert.alert('Erro no Perfil', `Não foi possível salvar:\\n${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'LB';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDITAR PERFIL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarEditBtn}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Ionicons name="hourglass-outline" size={16} color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>
            {isUploadingAvatar ? 'Enviando foto...' : 'Toque para alterar a foto'}
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Input
            label="Nome Completo"
            icon="person-outline"
            placeholder="Seu nome completo"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
          />

          <Input
            label="Telefone"
            icon="call-outline"
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Email (somente leitura) */}
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <View style={styles.readOnlyValueRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.readOnlyValue}>{user?.id ? '••••••••' : '-'}</Text>
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyBadgeText}>Não editável</Text>
              </View>
            </View>
          </View>

          <Button
            title="SALVAR ALTERAÇÕES"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
            size="lg"
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.textOnPrimary,
    letterSpacing: 3,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  avatarInitials: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.textOnPrimary,
    letterSpacing: 1,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.sm,
  },
  avatarHint: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  // Form
  form: {
    flex: 1,
  },
  readOnlyField: {
    marginBottom: spacing.md,
  },
  readOnlyLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  readOnlyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyValue: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
  },
  readOnlyBadge: {
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  readOnlyBadgeText: {
    fontFamily: fonts.light,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
