import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DropdownMenu } from '../../components/dropdown-menu';

const ITEMS = [
  { key: 'edit',   label: 'Edit',   onSelect: () => {} },
  { key: 'dup',    label: 'Duplicate' },
  { key: 'del',    label: 'Delete',  disabled: true },
];

export default function DropdownMenuSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Dropdown Menu</Text>
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <Pressable style={s.btn}>
            <Text style={s.btnText}>Actions ▾</Text>
          </Pressable>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content items={ITEMS} />
      </DropdownMenu>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:     { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
});
