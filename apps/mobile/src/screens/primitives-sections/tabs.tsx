import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from '../../components/tabs';

export default function TabsSection() {
  const [active, setActive] = useState('account');
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Tabs</Text>
      <Tabs value={active} onValueChange={setActive}>
        <Tabs.List>
          <Tabs.Trigger value="account"><Text>Account</Text></Tabs.Trigger>
          <Tabs.Trigger value="password"><Text>Password</Text></Tabs.Trigger>
          <Tabs.Trigger value="settings"><Text>Settings</Text></Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          <Text style={s.body}>Manage your account details.</Text>
        </Tabs.Content>
        <Tabs.Content value="password">
          <Text style={s.body}>Change your password here.</Text>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Text style={s.body}>Tweak your preferences.</Text>
        </Tabs.Content>
      </Tabs>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  body:  { fontSize: 14, color: '#374151', paddingTop: 4 },
});
