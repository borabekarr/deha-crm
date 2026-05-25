import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import {
  ISwipeActionsProviderProps,
  ISwipeRegistryValue,
} from "../typings/swipe.interfaces";

const SwipeActionsContext = createContext<ISwipeRegistryValue | null>(
  null,
);

const SwipeActionsProvider: React.FC<ISwipeActionsProviderProps> = ({
  children,
}) => {
  const items = useRef(new Map<string, () => void>());
  const activeId = useRef<string | null>(null);

  const register = useCallback((id: string, close: () => void) => {
    items.current.set(id, close);
  }, []);

  const unregister = useCallback((id: string) => {
    items.current.delete(id);
    if (activeId.current === id) activeId.current = null;
  }, []);

  const notifyOpen = useCallback((id: string) => {
    const prev = activeId.current;
    if (prev && prev !== id) {
      const close = items.current.get(prev);
      if (close) close();
    }
    activeId.current = id;
  }, []);

  const closeActive = useCallback((exceptId?: string) => {
    const active = activeId.current;
    if (!active || active === exceptId) return;
    const close = items.current.get(active);
    if (close) close();
    activeId.current = null;
  }, []);

  const handleSurfaceTouchStart = useCallback(() => {
    closeActive();
  }, [closeActive]);

  const value = useMemo(
    () => ({ register, unregister, notifyOpen, closeActive }),
    [register, unregister, notifyOpen, closeActive],
  );

  return (
    <SwipeActionsContext.Provider value={value}>
      <View
        style={styles.registrySurface}
        onTouchStart={handleSurfaceTouchStart}
      >
        {children}
      </View>
    </SwipeActionsContext.Provider>
  );
};

SwipeActionsProvider.displayName = "SwipeActionsProvider";

const styles = StyleSheet.create({
  registrySurface: {
    flex: 1,
  },
});

export { SwipeActionsContext, SwipeActionsProvider };
export default SwipeActionsProvider;
