import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { duration } from '@deha/motion-tokens';
import { CORE_VERSION } from '@deha/core';
import { motionTiming } from './src/lib/motion';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Deha Mobile</Text>
      <Text>duration.base = {duration.base}ms</Text>
      <Text>core = {CORE_VERSION}</Text>
      <Text>motionTiming.duration = {motionTiming().duration}ms</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
