/**
 * Login Screen — Tela de autenticação com logo completa
 * Inclui a imagem 20260626_143306_0000.png (logo-full) como destaque visual.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../src/config/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { signIn, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!email.includes('@')) newErrors.email = 'Email inválido';
    if (!password.trim()) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await signIn({ email: email.trim(), password });
    } catch (error: any) {
      Alert.alert('Erro ao entrar', error.message || 'Verifique suas credenciais.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo e Branding */}
        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/images/logo-full.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Linha decorativa */}
          <View style={styles.decorLine}>
            <View style={styles.lineSegment} />
            <View style={styles.diamond} />
            <View style={styles.lineSegment} />
          </View>

          <Text style={styles.welcomeText}>BEM-VINDO</Text>
          <Text style={styles.subtitleText}>
            Faça login para agendar e colecionar suas memórias
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.formSection}>
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />

          <Input
            label="Senha"
            icon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <Button
            title="ENTRAR"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.loginButton}
          />

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="CRIAR CONTA"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            fullWidth
            size="md"
          />
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          LOURENÇO BARBEARIA © 2024
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  // Brand Section
  brandSection: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.04,
    paddingBottom: spacing.lg,
  },
  logo: {
    width: 220,
    height: 180,
  },
  decorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  lineSegment: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  },
  welcomeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['3xl'],
    color: colors.primary,
    letterSpacing: 6,
  },
  subtitleText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  // Form Section
  formSection: {
    marginTop: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
    letterSpacing: 1,
  },
  // Footer
  footerText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    letterSpacing: 2,
  },
});
