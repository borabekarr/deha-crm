import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tooltip } from '../../components/tooltip';

export default function TooltipSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Tooltip</Text>
      <Tooltip content="This is a helpful tooltip" delayDuration={500}>
        <Pressable style={s.btn}>
          <Text style={s.btnText}>Press &amp; hold</Text>
        </Pressable>
      </Tooltip>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:     { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  btnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
});
