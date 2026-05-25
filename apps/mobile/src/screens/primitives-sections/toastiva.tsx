import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { showToastiva } from '../../components/toastiva';

export default function ToastivaSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Toastiva</Text>
      <View style={s.row}>
        <Pressable style={s.btn} onPress={() => showToastiva({ title: 'Info', variant: 'default' })}>
          <Text style={s.btnText}>Default</Text>
        </Pressable>
        <Pressable style={[s.btn, s.success]} onPress={() => showToastiva({ title: 'Done!', variant: 'success' })}>
          <Text style={s.light}>Success</Text>
        </Pressable>
        <Pressable style={[s.btn, s.warn]} onPress={() => showToastiva({ title: 'Warning', variant: 'warning' })}>
          <Text style={s.btnText}>Warning</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:     { flexDirection: 'row', gap: 8 },
  btn:     { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  success: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  warn:    { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  btnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  light:   { fontSize: 14, color: '#fff', fontWeight: '500' },
});
