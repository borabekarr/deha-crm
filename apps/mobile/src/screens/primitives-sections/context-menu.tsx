import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ContextMenu } from '../../components/context-menu';

export default function ContextMenuSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Context Menu</Text>
      <ContextMenu>
        <ContextMenu.Trigger>
          <View style={s.target}>
            <Text style={s.targetText}>Long-press me</Text>
          </View>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={() => {}}>Copy</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => {}}>Share</ContextMenu.Item>
          <ContextMenu.Item destructive onSelect={() => {}}>Delete</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:      { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  target:     { paddingVertical: 20, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9ca3af', alignItems: 'center' },
  targetText: { fontSize: 14, color: '#6b7280' },
});
