/**
 * Perfil Screen — Tela de perfil do usuário
 * Todos os itens do menu conectados com ações reais.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUserBookings } from '../../src/services/bookingService';
import { getStickerCount } from '../../src/services/albumService';
import Header from '../../src/components/ui/Header';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';

// Contato da barbearia para suporte via WhatsApp
const WHATSAPP_NUMBER = '5511999999999'; // ⚠️ Substituir pelo número real

export default function PerfilScreen({ navigation }: any) {
  const { user, signOut } = useAuth();

  const [totalCortes, setTotalCortes] = React.useState(0);
  const [totalFigurinhas, setTotalFigurinhas] = React.useState(0);
  const [meses, setMeses] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;

    // Calcular meses
    if (user.created_at) {
      const createdDate = new Date(user.created_at);
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - createdDate.getFullYear()) * 12 +
        (now.getMonth() - createdDate.getMonth());
      setMeses(Math.max(1, diffMonths));
    } else {
      setMeses(1);
    }

    Promise.all([getUserBookings(user.id), getStickerCount(user.id)])
      .then(([bookings, stickerCount]) => {
        setTotalCortes(bookings.length);
        setTotalFigurinhas(stickerCount);
      })
      .catch(console.error);
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Lourenço Barbearia',
        message:
          '✂️ Venha conhecer a Lourenço Barbearia! Agende seu corte e colecione memórias no nosso álbum digital exclusivo.',
      });
    } catch (error: any) {
      console.log('Compartilhamento cancelado', error);
    }
  };

  const handleSupport = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Olá! Preciso de ajuda com o app da Lourenço Barbearia.'
    )}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Suporte',
        'Entre em contato conosco pelo WhatsApp ou nos visite na barbearia.'
      );
    }
  };

  const handleTermos = () => {
    Alert.alert(
      'Termos de Uso',
      'Ao utilizar o aplicativo Lourenço Barbearia, você concorda com:\n\n• Uso das informações para agendamentos\n• Armazenamento de fotos no álbum de memórias\n• Comunicações sobre seus agendamentos\n\nSeus dados são protegidos e nunca compartilhados com terceiros.',
      [{ text: 'Entendido' }]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      label: 'Editar Perfil',
      onPress: () => navigation.navigate('EditarPerfil'),
      badge: null,
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Histórico de Agendamentos',
      onPress: () => navigation.navigate('Historico'),
      badge: totalCortes > 0 ? String(totalCortes) : null,
    },
    {
      icon: 'albums-outline' as const,
      label: 'Meu Álbum Completo',
      onPress: () => navigation.navigate('Memórias'),
      badge: totalFigurinhas > 0 ? String(totalFigurinhas) : null,
    },
    {
      icon: 'share-social-outline' as const,
      label: 'Compartilhar App',
      onPress: handleShare,
      badge: null,
    },
    {
      icon: 'logo-whatsapp' as const,
      label: 'Ajuda & Suporte',
      onPress: handleSupport,
      badge: null,
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Termos de Uso',
      onPress: handleTermos,
      badge: null,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="PERFIL" subtitle="MINHA CONTA" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e Info Card */}
        <Card elevated style={styles.profileCard} noPadding>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.profileGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'LB'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.avatarEditButton}
                onPress={() => navigation.navigate('EditarPerfil')}
              >
                <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
              </TouchableOpacity>
            </View>

            {/* Nome e Telefone */}
            <Text style={styles.userName}>{user?.full_name || 'Cliente'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cut" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statNumber}>{totalCortes}</Text>
                <Text style={styles.statLabel}>CORTES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="albums" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statNumber}>{totalFigurinhas}</Text>
                <Text style={styles.statLabel}>FIGURINHAS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statNumber}>{meses}</Text>
                <Text style={styles.statLabel}>MESES</Text>
              </View>
            </View>
          </LinearGradient>
        </Card>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>CONFIGURAÇÕES</Text>
        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.badge !== null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* Logout */}
        <Button
          title="SAIR DA CONTA"
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
          <Text style={styles.footerVersion}>Versão 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentPadding: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  // Profile Card
  profileCard: { marginTop: spacing.lg, borderWidth: 0, overflow: 'hidden' },
  profileGradient: { padding: spacing.xl, alignItems: 'center', borderRadius: borderRadius.lg },

  // Avatar
  avatarContainer: { position: 'relative', marginBottom: spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary, letterSpacing: 1 },
  avatarEditButton: {
    position: 'absolute', bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },

  // User Info
  userName: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.textOnPrimary, letterSpacing: 1 },
  userPhone: { fontFamily: fonts.light, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.textOnPrimary, marginTop: 4 },
  statLabel: { fontFamily: fonts.light, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Section
  sectionTitle: {
    fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.primary,
    letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.md,
  },

  // Menu
  menuCard: { padding: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuIconContainer: {
    width: 36, height: 36, borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(13,44,104,0.06)', alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemLabel: { fontFamily: fonts.regular, fontSize: fontSizes.base, color: colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textOnPrimary,
    letterSpacing: 0.5,
  },

  // Logout
  logoutButton: { marginTop: spacing.xl },

  // Footer
  footer: { alignItems: 'center', marginTop: spacing.xl, paddingBottom: spacing.lg },
  footerLogo: { width: 32, height: 32, opacity: 0.15, tintColor: colors.primary, marginBottom: spacing.xs },
  footerText: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.textTertiary, letterSpacing: 2 },
  footerVersion: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 2 },
});
