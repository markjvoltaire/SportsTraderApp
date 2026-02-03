import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';

export default function DepositScreen() {
  const [amount, setAmount] = useState('0');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Funds</Text>
        <Text style={styles.subtitle}>Move money to your trading account instantly.</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.currencyPrefix}>$</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estimated Arrival</Text>
          <Text style={styles.infoValue}>Seconds</Text>
        </View>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add Cash</Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Powered by Lightspark. Funds are settled as USDC on Solana.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { marginTop: 40, marginBottom: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  inputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  currencyPrefix: { fontSize: 48, color: 'white', fontWeight: '600', marginRight: 8 },
  amountInput: { fontSize: 64, color: 'white', fontWeight: 'bold', minWidth: 100 },
  footer: { marginTop: 'auto', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  infoLabel: { color: '#94a3b8', fontSize: 16 },
  infoValue: { color: '#4ade80', fontSize: 16, fontWeight: 'bold' },
  button: { backgroundColor: '#6366F1', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  disclaimer: { color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 15 }
});