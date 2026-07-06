/**
 * Barber Configurações Screen — Perfil do barbeiro + gerenciar horários bloqueados
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getBarberById, updateBarberProfile } from '../../src/services/barberService';
import { updateProfile } from '../../src/services/authService';
import { uploadAvatar } from '../../src/services/imageService';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import Card from '../../src/components/ui/Card';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { Barber } from '../../src/types/barber';

export default function BarberConfigScreen() {
  const { user, signOut, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [barber, setBarber] = useState<Barber | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setAvatarUri(user.avatar_url);
    setPhone(user.phone || '');
    getBarberById(user.id).then((b) => {
      if (b) {
        setBarber(b);
        setDisplayName(b.display_name);
        setSpecialty(b.specialty || '');
        setBio(b.bio || '');
      }
    });
  }, [user]);

  const handlePickAvatar = async () => {
    Alert.alert('Foto do Perfil', 'Como deseja escolher?', [
      {
        text: 'Câmera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.9 });
          if (!result.canceled && result.assets[0]) doUpload(result.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.9 });
          if (!result.canceled && result.assets[0]) doUpload(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const doUpload = async (uri: string) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(uri, user.id);
      setAvatarUri(url);
      await updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user || !barber) return;
    if (!displayName.trim()) { Alert.alert('Atenção', 'Nome é obrigatório.'); return; }
    setIsSaving(true);
    try {
      await Promise.all([
        updateBarberProfile(user.id, {
          display_name: displayName.trim(),
          specialty: specialty.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
        updateProfile(user.id, { phone: phone.trim() || undefined }),
      ]);
      await refreshProfile();
      Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair do painel do barbeiro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'B';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
        <Text style={styles.headerSub}>PAINEL DO BARBEIRO</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBtn}>
              {isUploadingAvatar
                ? <Ionicons name="hourglass-outline" size={14} color={colors.textOnPrimary} />
                : <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {isUploadingAvatar ? 'Enviando...' : 'Toque para alterar a foto'}
          </Text>
        </View>

        {/* Informações do Barbeiro */}
        <Text style={styles.sectionTitle}>DADOS PROFISSIONAIS</Text>
        <Card style={styles.formCard}>
          <Input
            label="Nome de exibição"
            icon="person-outline"
            placeholder="Como você aparece para os clientes"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          <Input
            label="Especialidade"
            icon="cut-outline"
            placeholder="Ex: Degradê & Barba"
            value={specialty}
            onChangeText={setSpecialty}
          />
          <Input
            label="Bio"
            icon="information-circle-outline"
            placeholder="Uma linha sobre você..."
            value={bio}
            onChangeText={setBio}
            autoCapitalize="sentences"
          />
          <Input
            label="Telefone"
            icon="call-outline"
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Button
            title="SALVAR ALTERAÇÕES"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
            size="lg"
            style={styles.saveButton}
          />
        </Card>

        {/* Status da conta */}
        <Text style={styles.sectionTitle}>CONTA</Text>
        <Card style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountIconWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Perfil de Barbeiro</Text>
              <Text style={styles.accountValue}>Ativo ✓</Text>
            </View>
          </View>

          <View style={[styles.accountRow, styles.accountRowBorder]}>
            <View style={styles.accountIconWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>Conta vinculada</Text>
            </View>
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="SAIR DO PAINEL"
          onPress={handleLogout}
          variant="ghost"
          fullWidth
          size="md"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.accent} />}
          style={styles.logoutButton}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Image
            source={require('../../assets/images/logo-icon.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>LOURENÇO BARBEARIA</Text>
          <Text style={styles.footerVersion}>Painel do Barbeiro v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerTitle: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary, letterSpacing: 3 },
  headerSub: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },

  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primary },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  avatarHint: { fontFamily: fonts.light, fontSize: fontSizes.sm, color: colors.textTertiary, marginTop: spacing.sm },

  // Section
  sectionTitle: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.primary, letterSpacing: 2, marginBottom: spacing.md, marginTop: spacing.lg },

  // Form
  formCard: { padding: spacing.md },
  saveButton: { marginTop: spacing.sm },

  // Account
  accountCard: { padding: 0 },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  accountRowBorder: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  accountIconWrapper: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  accountInfo: { flex: 1 },
  accountLabel: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  accountValue: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.textPrimary, marginTop: 2 },

  // Logout
  logoutButton: { marginTop: spacing.xl },

  // Footer
  footer: { alignItems: 'center', marginTop: spacing.xl },
  footerLogo: { width: 28, height: 28, opacity: 0.12, tintColor: colors.primary, marginBottom: spacing.xs },
  footerText: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.textTertiary, letterSpacing: 2 },
  footerVersion: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 2 },
});
