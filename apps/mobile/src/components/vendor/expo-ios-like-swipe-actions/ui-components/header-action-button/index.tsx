import { IHeaderActionButtonProps } from "@/typings/ui.interfaces";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const HeaderActionButton: React.FC<IHeaderActionButtonProps> = ({
  onPress,
  icon,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.button}>
        <Ionicons name={icon} size={26} color="#111111" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 24,
  },
  pressed: {
    opacity: 0.84,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 50,
  },
});

export { HeaderActionButton };
export default HeaderActionButton;
