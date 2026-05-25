import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearBottomTabs } from '../../components/linear-bottom-tabs';

// LinearBottomTabs requires live react-navigation state/navigation/descriptors.
// The vendor falls back gracefully without a real navigator context.
const FAKE_STATE = { routes: [], index: 0 };
const FAKE_NAV   = {};
const FAKE_DESC  = {};

export default function LinearBottomTabsSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Linear Bottom Tabs</Text>
      <Text style={s.note}>Requires EAS native build (react-navigation bottom-tabs context).</Text>
      <View style={s.preview}>
        <LinearBottomTabs
          navigationState={FAKE_STATE}
          navigation={FAKE_NAV}
          descriptors={FAKE_DESC}
        >
          {null}
        </LinearBottomTabs>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  note:    { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  preview: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
});
