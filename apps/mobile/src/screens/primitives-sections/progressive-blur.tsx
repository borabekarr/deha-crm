import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressiveBlur } from '../../components/progressive-blur';

const STEPS = [0, 0.33, 0.66, 1.0];

export default function ProgressiveBlurSection() {
  const [step, setStep] = useState(0);
  const progress = STEPS[step % STEPS.length];

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Progressive Blur</Text>
      <View style={s.stage}>
        <Text style={s.bg}>Background content visible here</Text>
        <ProgressiveBlur scrollProgress={progress} style={s.blur} />
      </View>
      <View style={s.row}>
        <Text style={s.hint}>Progress: {Math.round(progress * 100)}%</Text>
        <Pressable style={s.btn} onPress={() => setStep((v) => v + 1)}>
          <Text style={s.btnText}>Increase</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title:   { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stage:   { height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  bg:      { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  blur:    { borderRadius: 8 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  hint:    { fontSize: 13, color: '#9ca3af' },
  btn:     { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db' },
  btnText: { fontSize: 13, color: '#374151' },
});
