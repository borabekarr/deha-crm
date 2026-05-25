import { useCustomFonts } from "@/hooks/use-fonts";
import { IFloatingComposerSearchProps } from "@/typings/ui.interfaces";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const FloatingComposerSearch: React.FC<IFloatingComposerSearchProps> = ({
  onPress,
  onVoicePress,
}) => {
  const fontLoaded = useCustomFonts();

  return (
    <View style={styles.shell}>
      <Pressable
        accessibilityLabel="Search mail"
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.searchPressable,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.leading}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#737373"
            style={{
              top: 2,
            }}
          />
          <Text
            style={[
              styles.label,
              {
                fontFamily: fontLoaded ? "SfProRegular" : undefined,
              },
            ]}
          >
            Search
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Voice search"
        accessibilityRole="button"
        onPress={onVoicePress}
        style={({ pressed }) => [
          styles.voiceButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Ionicons name="mic-outline" size={23} color="#707070" />
      </Pressable>
    </View>
  );
};

FloatingComposerSearch.displayName = "FloatingComposerSearch";

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.98)",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 12,
  },
  searchPressable: {
    flex: 1,
    justifyContent: "center",
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 18,
    color: "#636363",
  },
  voiceButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.78,
  },
});

export { FloatingComposerSearch };
export default FloatingComposerSearch;
