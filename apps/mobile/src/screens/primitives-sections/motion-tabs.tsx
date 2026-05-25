import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotionTabs } from '../../components/motion-tabs';

// MotionTabs requires live react-navigation state/navigation/descriptors from
// a bottom-tab navigator. Without a real navigator context those objects are not
// available in a static ScrollView demo. The vendor falls back gracefully.
const FAKE_STATE = { routes: [], index: 0 };
const FAKE_NAV   = {};
const FAKE_DESC  = {};

export default function MotionTabsSection() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Motion Tabs</Text>
      <Text style={s.note}>Requires EAS native build (react-navigation bottom-tabs context).</Text>
      <View style={s.preview}>
        <MotionTabs
          navigationState={FAKE_STATE}
          navigation={FAKE_NAV}
          descriptors={FAKE_DESC}
        >
          {null}
        </MotionTabs>
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
