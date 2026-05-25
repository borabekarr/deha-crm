import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Combobox } from '../../components/combobox';

export default function ComboboxSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Combobox</Text>
      <Combobox>
        <Combobox.Trigger placeholder="Search frameworks…" />
        <Combobox.Content>
          <Combobox.Item value="react"   label="React" />
          <Combobox.Item value="vue"     label="Vue" />
          <Combobox.Item value="svelte"  label="Svelte" />
          <Combobox.Item value="angular" label="Angular" />
        </Combobox.Content>
      </Combobox>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
