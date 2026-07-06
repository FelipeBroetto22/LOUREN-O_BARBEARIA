/**
 * Barber Clientes Screen — Lista de clientes atendidos + álbum
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { getBarberClients, getClientAlbum } from '../../src/services/barberService';
import { organizeIntoPages } from '../../src/services/albumService';
import AlbumGrid from '../../src/components/album/AlbumGrid';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../src/config/theme';
import type { AlbumSticker } from '../../src/types/album';

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  last_booking: string;
};

export default function BarberClientesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Album modal
  const [albumModal, setAlbumModal] = useState(false);
  const [albumClient, setAlbumClient] = useState<Client | null>(null);
  const [albumStickers, setAlbumStickers] = useState<AlbumSticker[]>([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  const loadClients = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBarberClients(user.id);
      setClients(data);
      setFiltered(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  }, [user]);

  useEffect(() => {
    loadClients().finally(() => setIsLoading(false));
  }, [loadClients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(clients);
    } else {
      const lower = search.toLowerCase();
      setFiltered(clients.filter((c) => c.full_name.toLowerCase().includes(lower)));
    }
  }, [search, clients]);

  const openAlbum = async (client: Client) => {
    setAlbumClient(client);
    setAlbumModal(true);
    setLoadingAlbum(true);
    try {
      const stickers = await getClientAlbum(client.id);
      setAlbumStickers(stickers);
    } catch (err) {
      console.error('Erro ao carregar álbum:', err);
    } finally {
      setLoadingAlbum(false);
    }
  };

  const renderClient = ({ item }: { item: Client }) => {
    const initials = item.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const lastDate = new Date(item.last_booking).toLocaleDateString('pt-BR');

    return (
      <TouchableOpacity onPress={() => openAlbum(item)} activeOpacity={0.85}>
        <View style={styles.clientCard}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.clientAvatar} />
          ) : (
            <View style={[styles.clientAvatar, styles.clientAvatarFallback]}>
              <Text style={styles.clientInitials}>{initials}</Text>
            </View>
          )}

          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.full_name}</Text>
            {item.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color={colors.textTertiary} />
                <Text style={styles.clientPhone}>{item.phone}</Text>
              </View>
            )}
            <View style={styles.lastVisitRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.lastVisitText}>Último: {lastDate}</Text>
            </View>
          </View>

          <View style={styles.albumBtn}>
            <Ionicons name="albums-outline" size={18} color={colors.primary} />
            <Text style={styles.albumBtnText}>Álbum</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const albumPages = organizeIntoPages(albumStickers);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>CLIENTES</Text>
            <Text style={styles.headerSub}>{clients.length} clientes atendidos</Text>
          </View>
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>
                {search ? 'Nenhum resultado' : 'Nenhum cliente'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `Não encontramos "${search}" nos seus clientes.`
                  : 'Os clientes que você atender aparecerão aqui.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Album Modal */}
      <Modal
        visible={albumModal}
        animationType="slide"
        onRequestClose={() => setAlbumModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal header */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[styles.modalHeader, { paddingTop: insets.top + spacing.sm }]}
          >
            <TouchableOpacity onPress={() => setAlbumModal(false)} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>ÁLBUM</Text>
              <Text style={styles.modalHeaderSub}>{albumClient?.full_name?.toUpperCase()}</Text>
            </View>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {loadingAlbum ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando álbum...</Text>
            </View>
          ) : albumStickers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="albums-outline" size={64} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>Álbum vazio</Text>
              <Text style={styles.emptySubtitle}>
                {albumClient?.full_name} ainda não tem figurinhas.
              </Text>
            </View>
          ) : (
            <AlbumGrid
              pages={albumPages}
              userName={albumClient?.full_name || 'Cliente'}
              totalStickers={albumStickers.length}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontFamily: fonts.bold, fontSize: fontSizes['2xl'], color: colors.textOnPrimary, letterSpacing: 3 },
  headerSub: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)' },
  headerCount: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  headerCountText: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textOnPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textOnPrimary },

  // Content
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.light, fontSize: fontSizes.md, color: colors.textTertiary, marginTop: spacing.sm },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  separator: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.md },

  // Client row
  clientCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  clientAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: spacing.md },
  clientAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  clientInitials: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.textOnPrimary },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.textPrimary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  clientPhone: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  lastVisitRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lastVisitText: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: colors.textTertiary },
  albumBtn: { alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm },
  albumBtnText: { fontFamily: fonts.semibold, fontSize: 9, color: colors.primary, letterSpacing: 0.5 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.textSecondary, marginTop: spacing.lg },
  emptySubtitle: { fontFamily: fonts.light, fontSize: fontSizes.md, color: colors.textTertiary, textAlign: 'center', marginTop: 4, lineHeight: 22 },

  // Album Modal
  modalContainer: { flex: 1, backgroundColor: colors.albumBg },
  modalHeader: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center' },
  modalBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalHeaderCenter: { flex: 1, alignItems: 'center' },
  modalHeaderTitle: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.textOnPrimary, letterSpacing: 3 },
  modalHeaderSub: { fontFamily: fonts.light, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
});
