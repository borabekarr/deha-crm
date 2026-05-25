import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sidebar } from '../../components/sidebar';

export default function SidebarSection() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Sidebar</Text>
      <Pressable style={s.btn} onPress={() => setCollapsed((v) => !v)}>
        <Text style={s.btnText}>{collapsed ? 'Open Sidebar' : 'Close Sidebar'}</Text>
      </Pressable>
      <View style={s.stage} pointerEvents="box-none">
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} side="left">
          <Sidebar.Panel>
            <Sidebar.Header>
              <Text style={s.panelTitle}>Navigation</Text>
            </Sidebar.Header>
            <Sidebar.Item active>Dashboard</Sidebar.Item>
            <Sidebar.Item>Reports</Sidebar.Item>
            <Sidebar.Item>Settings</Sidebar.Item>
          </Sidebar.Panel>
        </Sidebar>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:      { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:        { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  btnText:    { fontSize: 14, color: '#111827', fontWeight: '500' },
  stage:      { height: 140, marginTop: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  panelTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
