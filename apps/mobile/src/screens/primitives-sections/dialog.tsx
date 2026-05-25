import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dialog } from '../../components/dialog';

export default function DialogSection() {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Dialog</Text>
      <Dialog open={open} onOpenChange={setOpen}>
        <Pressable style={s.btn} onPress={() => setOpen(true)}>
          <Text style={s.btnText}>Open Dialog</Text>
        </Pressable>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Confirm Action</Dialog.Title>
          </Dialog.Header>
          <Dialog.DialogContent>
            <Text style={s.body}>Are you sure you want to continue?</Text>
          </Dialog.DialogContent>
          <Dialog.Footer>
            <Pressable style={s.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={s.confirmBtn} onPress={() => setOpen(false)}>
              <Text style={s.confirmText}>Confirm</Text>
            </Pressable>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:      { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:        { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnText:    { fontSize: 14, color: '#111827', fontWeight: '500' },
  body:       { fontSize: 14, color: '#374151' },
  cancelBtn:  { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { fontSize: 14, color: '#374151' },
  confirmBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#111827' },
  confirmText:{ fontSize: 14, color: '#fff', fontWeight: '600' },
});
