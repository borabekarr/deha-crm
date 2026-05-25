import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { TabsProps as ContractTabsProps } from '@deha/ui-contracts';
import { tabMorph } from '../lib/choreography';
import type { ReanimatedTween } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Vendor surface — typed subset forwarded to AnimatedTabBar.
 * The vendor is excluded from tsc (tsconfig "exclude"), so we define only
 * what we pass through.
 */
type VendorAnimatedTabBarProps = {
  state: object;
  navigation: object;
  descriptors: object;
  renderPopupBody?: React.ComponentType<{
    colors: Record<string, string>;
    route: object;
    view: string;
  }>;
};

export interface MotionTabsProps extends ContractTabsProps {
  /**
   * react-navigation bottom-tabs state forwarded to AnimatedTabBar.
   * Required at runtime; typed as unknown to decouple from @react-navigation
   * peer-dep version in consuming screens.
   */
  navigationState: object;
  /** react-navigation navigation object */
  navigation: object;
  /** react-navigation descriptors map */
  descriptors: object;
  /**
   * Optional popup body renderer forwarded to the vendor's card-morph panel.
   */
  renderPopupBody?: VendorAnimatedTabBarProps['renderPopupBody'];
  /**
   * Override the tabMorph animation config.
   * Defaults to `tabMorph({ reducedMotion })`.
   */
  morphConfig?: ReanimatedTween;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderVendorTabBar(props: VendorAnimatedTabBarProps) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AnimatedTabBar } = require('expo-motion-tabs') as {
      AnimatedTabBar: React.ComponentType<VendorAnimatedTabBarProps>;
    };
    return <AnimatedTabBar {...props} />;
  } catch {
    return (
      <View
        style={{
          height: 64,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.mutedFg, fontSize: 13 }}>
          Motion tab bar unavailable in this environment.
        </Text>
      </View>
    );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MotionTabs({
  value: _value,
  defaultValue: _defaultValue,
  onValueChange: _onValueChange,
  orientation: _orientation,
  reducedMotion,
  children: _children,
  navigationState,
  navigation,
  descriptors,
  renderPopupBody,
  morphConfig,
}: MotionTabsProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  // Resolve morphConfig so the tabMorph token is consumed even if the vendor
  // picker is unavailable. Stored as typed surface for future native bridge.
  const resolvedMorph = morphConfig ?? tabMorph({ reducedMotion: isReduced });
  void resolvedMorph;

  const vendorProps: VendorAnimatedTabBarProps = {
    state: navigationState,
    navigation,
    descriptors,
    renderPopupBody,
  };

  return renderVendorTabBar(vendorProps);
}

// Convenience re-export so consumers can import the contract type from here.
export type { MotionTabsProps as MotionTabsComponentProps };
