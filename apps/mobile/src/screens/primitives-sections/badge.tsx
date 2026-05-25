import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/badge';

const VARIANTS = ['default', 'secondary', 'outline', 'destructive', 'success', 'warning', 'neutral'] as const;

export default function BadgeSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Badge</Text>
      <View style={s.row}>
        {VARIANTS.map((v) => (
          <Badge key={v} variant={v}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Badge>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
