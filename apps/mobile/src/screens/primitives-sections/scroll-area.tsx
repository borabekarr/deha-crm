import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollArea } from '../../components/scroll-area';

const ITEMS = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);

export default function ScrollAreaSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Scroll Area</Text>
      <View style={s.container}>
        <ScrollArea showsVerticalScrollIndicator={false}>
          {ITEMS.map((item) => (
            <View key={item} style={s.row}>
              <Text style={s.rowText}>{item}</Text>
            </View>
          ))}
        </ScrollArea>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:     { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  container: { height: 160, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  row:       { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#f3f4f6' },
  rowText:   { fontSize: 14, color: '#374151' },
});
