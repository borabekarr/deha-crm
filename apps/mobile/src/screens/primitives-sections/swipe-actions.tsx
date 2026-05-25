import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SwipeActions } from '../../components/swipe-actions';

export default function SwipeActionsSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Swipe Actions</Text>
      <SwipeActions
        rightActions={[
          {
            key: 'delete',
            label: 'Delete',
            side: 'right',
            destructive: true,
            onPress: () => {},
            children: (
              <View style={s.action}>
                <Text style={s.actionText}>Delete</Text>
              </View>
            ),
          },
        ]}
      >
        <View style={s.row}>
          <Text style={s.rowText}>Swipe left to delete</Text>
        </View>
      </SwipeActions>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:      { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:        { paddingVertical: 16, paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  rowText:    { fontSize: 14, color: '#374151' },
  action:     { flex: 1, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
