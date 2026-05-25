import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { PaginationProps } from '@deha/ui-contracts';
import { tabMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

function buildRange(page: number, total: number, sibling: number): Array<number | 'ellipsis'> {
  const range: Array<number | 'ellipsis'> = [];
  const leftSib = Math.max(page - sibling, 2);
  const rightSib = Math.min(page + sibling, total - 1);

  range.push(1);
  if (leftSib > 2) range.push('ellipsis');
  for (let i = leftSib; i <= rightSib; i++) range.push(i);
  if (rightSib < total - 1) range.push('ellipsis');
  if (total > 1) range.push(total);
  return range;
}

const ITEM_W = 36;
const ITEM_GAP = 4;

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  disabled = false,
  reducedMotion,
}: PaginationProps) {
  const isReduced = reducedMotion === 'reduce';
  const indicatorX = useSharedValue(0);
  const items = buildRange(page, totalPages, siblingCount);

  const handleLayout = useCallback(
    (index: number) => () => {
      const targetX = index * (ITEM_W + ITEM_GAP);
      const config = tabMorph({ reducedMotion: isReduced });
      indicatorX.value = withTiming(targetX, { duration: config.duration, easing: config.easing });
    },
    [indicatorX, isReduced],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const numberItems = items.filter((i): i is number => i !== 'ellipsis');
  const activeIndex = numberItems.indexOf(page);

  return (
    <View style={styles.root}>
      {/* Prev */}
      <Pressable
        onPress={() => !disabled && onPageChange?.(Math.max(1, page - 1))}
        disabled={disabled || page <= 1}
        style={[styles.navBtn, (disabled || page <= 1) && styles.disabledBtn]}
        accessibilityLabel="Previous page"
        accessibilityRole="button"
      >
        <Text style={[styles.navBtnText, (disabled || page <= 1) && styles.disabledText]}>‹</Text>
      </Pressable>

      {/* Pages */}
      <View style={styles.pagesRow}>
        {activeIndex >= 0 && (
          <Animated.View
            style={[styles.activeIndicator, animStyle]}
            onLayout={handleLayout(activeIndex)}
          />
        )}
        {items.map((item, i) => {
          if (item === 'ellipsis') {
            return (
              <View key={`e-${items[i - 1] ?? 'start'}-${items[i + 1] ?? 'end'}`} style={styles.pageItem}>
                <Text style={styles.ellipsis}>…</Text>
              </View>
            );
          }
          const isActive = item === page;
          return (
            <Pressable
              key={item}
              onPress={() => !disabled && onPageChange?.(item)}
              disabled={disabled}
              style={styles.pageItem}
              accessibilityLabel={`Page ${item}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.pageText, isActive && styles.activeText]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Next */}
      <Pressable
        onPress={() => !disabled && onPageChange?.(Math.min(totalPages, page + 1))}
        disabled={disabled || page >= totalPages}
        style={[styles.navBtn, (disabled || page >= totalPages) && styles.disabledBtn]}
        accessibilityLabel="Next page"
        accessibilityRole="button"
      >
        <Text style={[styles.navBtnText, (disabled || page >= totalPages) && styles.disabledText]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 16,
    color: colors.foreground,
  },
  disabledText: {
    color: colors.mutedFg,
  },
  pagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_GAP,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    width: ITEM_W,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.foreground,
  },
  pageItem: {
    width: ITEM_W,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    zIndex: 1,
  },
  pageText: {
    fontSize: 14,
    color: colors.foreground,
  },
  activeText: {
    color: colors.background,
    fontWeight: '600',
  },
  ellipsis: {
    fontSize: 14,
    color: colors.mutedFg,
  },
});
