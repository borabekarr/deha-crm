import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../../components/sheet';

export default function SheetSection() {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Sheet</Text>
      <Sheet open={open} onOpenChange={setOpen}>
        <Pressable style={s.btn} onPress={() => setOpen(true)}>
          <Text style={s.btnText}>Open Sheet</Text>
        </Pressable>
        <Sheet.Content>
          <Text style={s.sheetTitle}>Bottom Sheet</Text>
          <Text style={s.sheetBody}>Drag down or tap outside to dismiss.</Text>
          <Pressable style={[s.btn, { marginTop: 16 }]} onPress={() => setOpen(false)}>
            <Text style={s.btnText}>Close</Text>
          </Pressable>
        </Sheet.Content>
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:      { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:        { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnText:    { fontSize: 14, color: '#111827', fontWeight: '500' },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 6 },
  sheetBody:  { fontSize: 14, color: '#6b7280' },
});
