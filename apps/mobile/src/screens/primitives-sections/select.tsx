import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Select } from '../../components/select';

export default function SelectSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Select</Text>
      <Select defaultValue="apple" placeholder="Pick a fruit">
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="apple"  label="Apple" />
          <Select.Item value="banana" label="Banana" />
          <Select.Item value="cherry" label="Cherry" />
        </Select.Content>
      </Select>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
