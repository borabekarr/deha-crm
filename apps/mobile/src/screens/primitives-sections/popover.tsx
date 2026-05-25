import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Popover } from '../../components/popover';

export default function PopoverSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Popover</Text>
      <Popover>
        <Popover.Trigger>
          <Pressable style={s.btn}>
            <Text style={s.btnText}>Open Popover</Text>
          </Pressable>
        </Popover.Trigger>
        <Popover.Content>
          <Text style={s.popText}>This is a popover.</Text>
          <Text style={s.popSub}>Tap outside to dismiss.</Text>
        </Popover.Content>
      </Popover>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:     { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  popText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  popSub:  { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
