import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ToastViewport } from '../../components/toast';
import { toast } from '../../hooks/use-toast';

export default function ToastSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Toast</Text>
      <View style={s.row}>
        <Pressable style={s.btn} onPress={() => toast({ title: 'Default toast', variant: 'default' })}>
          <Text style={s.btnText}>Default</Text>
        </Pressable>
        <Pressable style={[s.btn, s.success]} onPress={() => toast({ title: 'Saved!', variant: 'success' })}>
          <Text style={s.btnTextLight}>Success</Text>
        </Pressable>
        <Pressable style={[s.btn, s.error]} onPress={() => toast({ title: 'Error', variant: 'error' })}>
          <Text style={s.btnTextLight}>Error</Text>
        </Pressable>
      </View>
      <ToastViewport />
    </View>
  );
}

const s = StyleSheet.create({
  wrap:         { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:        { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:          { flexDirection: 'row', gap: 8 },
  btn:          { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  success:      { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  error:        { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  btnText:      { fontSize: 14, color: '#111827', fontWeight: '500' },
  btnTextLight: { fontSize: 14, color: '#fff', fontWeight: '500' },
});
