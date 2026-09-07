import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../auth-store';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }
    setErrorMessage('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Erro ao efetuar login.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>✈️ Diário de Viagens</Text>
        <Text style={styles.subtitle}>Acesse sua conta para sincronizar suas memórias</Text>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha secreta"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>
            Não tem uma conta? <Text style={styles.linkBold}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a09',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#292524',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a8a29e',
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    backgroundColor: '#450a0a',
    color: '#f87171',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d6d3d1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#292524',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  button: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#a8a29e',
    fontSize: 14,
  },
  linkBold: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
});
