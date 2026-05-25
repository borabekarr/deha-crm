import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from '../../components/calendar';

export default function CalendarSection() {
  const [selected, setSelected] = useState('');
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Calendar</Text>
      <Calendar
        value={selected}
        onValueChange={setSelected}
        mode="single"
      />
      {!!selected && <Text style={s.hint}>Selected: {selected}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint:  { fontSize: 13, color: '#9ca3af', marginTop: 6 },
});
