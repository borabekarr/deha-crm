import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pagination } from '../../components/pagination';

export default function PaginationSection() {
  const [page, setPage] = useState(3);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Pagination</Text>
      <Pagination
        page={page}
        totalPages={8}
        onPageChange={setPage}
        siblingCount={1}
      />
      <Text style={s.hint}>Page {page} of 8</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  title: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint:  { fontSize: 13, color: '#9ca3af', marginTop: 8 },
});
