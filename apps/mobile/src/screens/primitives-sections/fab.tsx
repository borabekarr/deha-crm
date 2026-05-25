import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fab } from '../../components/fab';

const ACTIONS = [
  { icon: 'create', label: 'New Note',   onPress: () => {} },
  { icon: 'camera', label: 'Take Photo', onPress: () => {} },
  { icon: 'share',  label: 'Share',      onPress: () => {} },
];

export default function FabSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>FAB</Text>
      <View style={s.stage} pointerEvents="box-none">
        <Text style={s.hint}>Tap + to expand actions</Text>
        <Fab actions={ACTIONS} onPress={() => {}} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stage: { height: 140, borderRadius: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  hint:  { fontSize: 13, color: '#9ca3af', padding: 12 },
});
