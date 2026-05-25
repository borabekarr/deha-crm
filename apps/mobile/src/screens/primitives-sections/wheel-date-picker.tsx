import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WheelDatePicker } from '../../components/wheel-date-picker';

export default function WheelDatePickerSection() {
  const [value, setValue] = useState('');
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Wheel Date Picker</Text>
      <WheelDatePicker
        value={value}
        onValueChange={setValue}
        display="spinner"
        mode="date"
      />
      {!!value && <Text style={s.hint}>Selected: {value}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint:  { fontSize: 13, color: '#9ca3af', marginTop: 8 },
});
