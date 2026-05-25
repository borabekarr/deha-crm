import { IFloatingComposerProps } from "@/typings/ui.interfaces";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingComposerSearch } from "../floating-composer-search";

const FloatingComposer: React.FC<IFloatingComposerProps> = ({
  onMenuPress,
  onSearchPress,
  onVoicePress,
  onComposePress,
}) => {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom + 8, 18);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom }]}>
      <Pressable
        accessibilityLabel="Mailbox options"
        accessibilityRole="button"
        onPress={onMenuPress}
        style={({ pressed }) => [
          styles.menuPressable,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.menuButton}>
          {/* <Ionicons name="menu" size={28} color="#111111" /> */}
          <View
            style={{
              width: 20,
              height: 1.5,
              backgroundColor: "#111111",
            }}
          />
          <View
            style={{
              width: 18,
              height: 1.5,
              backgroundColor: "#111111",
            }}
          />
          <View
            style={{
              width: 13,
              height: 1.5,
              backgroundColor: "#111111",
            }}
          />
        </View>
      </Pressable>
      <FloatingComposerSearch
        onPress={onSearchPress}
        onVoicePress={onVoicePress}
      />
      <Pressable
        accessibilityLabel="Compose message"
        accessibilityRole="button"
        onPress={onComposePress}
        style={({ pressed }) => [
          styles.composePressable,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.composeButton}>
          <Ionicons name="create-outline" size={28} color="#111111" />
        </View>
      </Pressable>
    </View>
  );
};

FloatingComposer.displayName = "FloatingComposer";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 22,
    right: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuPressable: {
    borderRadius: 28,
  },
  composePressable: {
    borderRadius: 28,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#F0C97A",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: {
      width: -6,
      height: 2,
    },
    elevation: 10,
    gap: 5,
  },
  composeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },
  pressed: {
    opacity: 0.8,
  },
});

export { FloatingComposer };
export default FloatingComposer;
