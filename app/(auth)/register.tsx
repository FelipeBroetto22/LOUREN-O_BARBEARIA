/**
 * Register Screen — Tela de cadastro de novo usuário
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
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, fonts, fontSizes, spacing } from '../../src/config/theme';

export default function RegisterScreen({ navigation }: any) {
  const { signUp, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nome é obrigatório';
    if (!email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!email.includes('@')) newErrors.email = 'Email inválido';
    if (!password.trim()) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      Alert.alert(
        'Conta criada!',
        'Verifique seu email para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro no cadastro', error.message || 'Tente novamente.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo-full.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>CRIAR CONTA</Text>
          <Text style={styles.subtitle}>
            Junte-se à Lourenço Barbearia e comece a colecionar suas memórias
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
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
            placeholder="Mínimo 6 caracteres"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <Input
            label="Confirmar Senha"
            icon="lock-closed-outline"
            placeholder="Repita a senha"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

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
            label="Número de Telefone"
            icon="call-outline"
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Button
            title="CRIAR CONTA"
            onPress={handleRegister}
            loading={isLoading}
            variant="accent"
            fullWidth
            size="lg"
            style={styles.registerButton}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Já tem conta?{' '}
              <Text style={styles.loginLinkBold}>Faça login</Text>
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 150,
    height: 120,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginLinkText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  loginLinkBold: {
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
});
